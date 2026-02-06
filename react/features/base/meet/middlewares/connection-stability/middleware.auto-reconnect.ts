import { batch } from "react-redux";
import { AnyAction } from "redux";
import { IStore } from "../../../../app/types";
import { hideNotification } from "../../../../notifications/actions";
import { CONFERENCE_WILL_LEAVE } from "../../../conference/actionTypes";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../../general/utils/conferenceState";
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { connect, hangup } from "../../../connection/actions.web";
import { setJWT } from "../../../jwt/actions";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";
import { trackRemoved } from "../../../tracks/actions.any";
import { hideLoader, showLoader } from "../../loader";

const RECONNECTION_NOTIFICATION_ID = "connection.reconnecting";
const RECONNECTION_LOADER_ID = "auto-reconnect";
const RECONNECTION_WAIT_TIME_MS = 15000;
const RECONNECTION_DELAY_MS = 3000;
const JWT_EXPIRED_ERROR = "connection.passwordRequired";

let reconnectionTimer: number | null = null;
let isReconnecting = false;
let hasReconnected = false;

export const isAutoReconnecting = () => isReconnecting;

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const hideReconnectionLoader = (store: IStore) => {
    store.dispatch(hideLoader(RECONNECTION_LOADER_ID));
};

const clearExpiredJWT = (store: IStore) => {
    store.dispatch(setJWT(undefined));
};

const clearRemoteTracks = (store: IStore) => {
    const state = store.getState();
    const remoteTracks = state["features/base/tracks"].filter((t) => !t.local);

    batch(() => {
        for (const track of remoteTracks) {
            store.dispatch(trackRemoved(track.jitsiTrack));
        }
    });
};

const leaveAndRejoinConference = async (store: IStore) => {
    if (isLeavingConferenceManually() || hasReconnected) return;

    hasReconnected = true;
    isReconnecting = true;
    store.dispatch(showLoader(undefined, "loader.reconnecting", RECONNECTION_LOADER_ID));

    try {
        const state = store.getState();
        const roomId = state["features/base/conference"]?.room;

        if (!roomId) {
            console.error("[AUTO_RECONNECT] No roomId found, cannot leave conference");
            return;
        }

        console.log("[AUTO_RECONNECT] Leaving conference for reconnection...");
        await store.dispatch(hangup(false, roomId, undefined, false));

        await new Promise((resolve) => setTimeout(resolve, RECONNECTION_DELAY_MS));

        clearRemoteTracks(store);
        clearExpiredJWT(store);

        console.log("[AUTO_RECONNECT] Rejoining conference...");
        store.dispatch(connect());

    } catch (error) {
        console.error("[AUTO_RECONNECT] Leave and rejoin error:", error);
        hasReconnected = false;
        isReconnecting = false;
        hideReconnectionLoader(store);
    }
};

const clearTimer = () => {
    if (reconnectionTimer !== null) {
        clearTimeout(reconnectionTimer);
        reconnectionTimer = null;
    }
};

const resetReconnectionState = () => {
    clearTimer();
    hasReconnected = false;
    isReconnecting = false;
};

/**
 * Middleware that handles automatic reconnection when JWT expires or connection is lost.
 */
MiddlewareRegistry.register((store: IStore) => (next: Function) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case CONFERENCE_WILL_LEAVE: {
            setLeaveConferenceManually(true);
            resetReconnectionState();
            hideReconnectionNotification(store);
            hideReconnectionLoader(store);
            break;
        }

        case CONNECTION_DISCONNECTED: {
            if (isLeavingConferenceManually() || hasReconnected) break;

            clearTimer();
            isReconnecting = true;

            reconnectionTimer = window.setTimeout(() => {
                if (!isLeavingConferenceManually() && isReconnecting && !hasReconnected) {
                    leaveAndRejoinConference(store);
                }
            }, RECONNECTION_WAIT_TIME_MS);

            break;
        }

        case CONNECTION_ESTABLISHED: {
            if (isReconnecting) {
                hideReconnectionNotification(store);
                hideReconnectionLoader(store);
            }

            resetReconnectionState();
            setLeaveConferenceManually(false);
            break;
        }

        case CONNECTION_FAILED: {
            const { error } = action;
            console.log("[AUTO_RECONNECT] Connection failed with error:", error);
            if (error?.name === JWT_EXPIRED_ERROR && !isLeavingConferenceManually() && !isReconnecting && !hasReconnected) {
                leaveAndRejoinConference(store);
            }

            break;
        }
    }

    return result;
});

export default {};
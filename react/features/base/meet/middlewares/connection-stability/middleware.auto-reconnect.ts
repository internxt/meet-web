import { batch } from "react-redux";
import { AnyAction } from "redux";
import { IStore } from "../../../../app/types";
import { hideNotification } from "../../../../notifications/actions";
import { CONFERENCE_WILL_LEAVE } from "../../../conference/actionTypes";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../../general/utils/conferenceState";
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { connect } from "../../../connection/actions.web";
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

export const isAutoReconnecting = () => isReconnecting;

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const showReconnectionLoader = (store: IStore) => {

    store.dispatch(showLoader(undefined, "loader.reconnecting", RECONNECTION_LOADER_ID));
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

const triggerReconnection = (store: IStore) => {
    store.dispatch(connect());
};

const scheduleRetry = (store: IStore) => {
    reconnectionTimer = window.setTimeout(() => {
        if (!isLeavingConferenceManually() && isReconnecting) {
            attemptReconnection(store);
        }
    }, RECONNECTION_DELAY_MS);
};

/**
 * Attempts to reconnect by clearing JWT and connecting to conference again.
 * If max attempts reached, reloads the page.
 */
const attemptReconnection = async (store: IStore) => {
    if (isLeavingConferenceManually()) return;

    isReconnecting = true;
    showReconnectionLoader(store);

    try {
        clearRemoteTracks(store);
        clearExpiredJWT(store);
        await new Promise((resolve) => setTimeout(resolve, 100));
        triggerReconnection(store);
        scheduleRetry(store);
    } catch (error) {
        console.error("[AUTO_RECONNECT] Reconnection error:", error);
        scheduleRetry(store);
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
            if (isLeavingConferenceManually()) break;

            clearTimer();
            isReconnecting = true;

            reconnectionTimer = window.setTimeout(() => {
                if (!isLeavingConferenceManually() && isReconnecting) {
                    attemptReconnection(store);
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
            console.log("[AUTO_RECONNECT] Attempting reconnect");
            const { error } = action;
            if (error?.name === JWT_EXPIRED_ERROR && !isLeavingConferenceManually() && !isReconnecting) {
                attemptReconnection(store);
            }

            break;
        }
    }

    return result;
});

export default {};

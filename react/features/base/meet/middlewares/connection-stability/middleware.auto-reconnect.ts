import { AnyAction } from "redux";
import { IStore } from "../../../../app/types";
import { hideNotification } from "../../../../notifications/actions";
import { CONFERENCE_WILL_LEAVE, CONFERENCE_JOINED } from "../../../conference/actionTypes";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../../general/utils/conferenceState";
import { CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { connect } from "../../../connection/actions.web";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";
import { hideLoader } from "../../loader";

const RECONNECTION_NOTIFICATION_ID = "connection.reconnecting";
const RECONNECTION_LOADER_ID = "auto-reconnect";
const JWT_EXPIRED_ERROR = "connection.passwordRequired";

let reconnectionTimer: number | null = null;
let isReconnecting = false;

export const isAutoReconnecting = () => isReconnecting;

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const hideReconnectionLoader = (store: IStore) => {
    store.dispatch(hideLoader(RECONNECTION_LOADER_ID));
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
            if (!isReconnecting) {
                setLeaveConferenceManually(true);
                resetReconnectionState();
                hideReconnectionNotification(store);
                hideReconnectionLoader(store);
            }
            break;
        }

        case CONFERENCE_JOINED: {
            if (isReconnecting) {
                console.log("[AUTO_RECONNECT] Successfully rejoined conference");
                hideReconnectionNotification(store);
                hideReconnectionLoader(store);
                setLeaveConferenceManually(false);
            }
            resetReconnectionState();
            break;
        }

        case CONNECTION_ESTABLISHED: {
            resetReconnectionState();
            setLeaveConferenceManually(false);
            break;
        }
 
        case CONNECTION_FAILED: {
            const { error } = action;
            console.log("[AUTO_RECONNECT] Connection failed with error:", error);
            if (error?.name === JWT_EXPIRED_ERROR && !isLeavingConferenceManually() && !isReconnecting) {
                store.dispatch(connect());
            }

            break;
        }
    }

    return result;
});

export default {};
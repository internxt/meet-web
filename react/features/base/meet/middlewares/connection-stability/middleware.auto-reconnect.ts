import { batch } from "react-redux";
import { AnyAction } from "redux";
import { IStore } from "../../../../app/types";
import { hideNotification } from "../../../../notifications/actions";
import { conferenceLeft } from "../../../conference/actions.web";
import { CONFERENCE_WILL_LEAVE } from "../../../conference/actionTypes";
import { getCurrentConference } from "../../../conference/functions";
import { isLeavingConferenceManually, setLeaveConferenceManually } from "../../general/utils/conferenceState";
import { CONNECTION_DISCONNECTED, CONNECTION_ESTABLISHED, CONNECTION_FAILED } from "../../../connection/actionTypes";
import { reloadNow } from "../../../../app/actions.web";
import { setJWT } from "../../../jwt/actions";
import MiddlewareRegistry from "../../../redux/MiddlewareRegistry";
import { trackRemoved } from "../../../tracks/actions.any";
import { hideLoader, showLoader } from "../../loader";

const RECONNECTION_NOTIFICATION_ID = "connection.reconnecting";
const RECONNECTION_LOADER_ID = "auto-reconnect";
const RECONNECTION_WAIT_TIME_MS = 3000;
const MAX_RECONNECTION_ATTEMPTS = 2;
const RECONNECTION_DELAY_MS = 2000;
const JWT_EXPIRED_ERROR = "connection.passwordRequired";

let reconnectionTimer: number | null = null;
let isReconnecting = false;
let reconnectionAttempts = 0;
let reconnectionLock = false;

export const isAutoReconnecting = () => isReconnecting;

const hideReconnectionNotification = (store: IStore) => {
    store.dispatch(hideNotification(RECONNECTION_NOTIFICATION_ID));
};

const showReconnectionLoader = (store: IStore, attempt: number) => {
    const textKey = attempt <= MAX_RECONNECTION_ATTEMPTS ? "loader.reconnecting" : "loader.reloading";

    store.dispatch(showLoader(undefined, textKey, RECONNECTION_LOADER_ID));
};

const hideReconnectionLoader = (store: IStore) => {
    store.dispatch(hideLoader(RECONNECTION_LOADER_ID));
};

const reloadPage = () => {
    window.location.reload();
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

const triggerReconnection = async (store: IStore) => {
    console.log('[AUTO_RECONNECT] calling connect from triggerReconnection');
    return await store.dispatch(reloadNow());
};

const scheduleRetry = (store: IStore) => {
    console.log('[AUTO_RECONNECT] Scheduling reconnection scheduleRetry retry in', RECONNECTION_DELAY_MS, 'ms');

    clearTimer();
    reconnectionTimer = window.setTimeout(() => {
        if (!isLeavingConferenceManually() && isReconnecting) {
            console.log('[AUTO_RECONNECT] calling attemptReconnection from scheduleRetry');
            attemptReconnection(store);
        }
    }, RECONNECTION_DELAY_MS);
};

const handleMaxAttemptsReached = (store: IStore) => {
    isReconnecting = true;
    showReconnectionLoader(store, reconnectionAttempts + 1);
    clearTimer();
    reconnectionTimer = window.setTimeout(reloadPage, 2000);
};



const cleanupOldConference = (store: IStore) => {
    const state = store.getState();
    const oldConference = getCurrentConference(state);

    if (oldConference) {
        try {
            (oldConference as any).cleanUpWebWorkers();
            (oldConference as any).removeAllListeners();
        } catch (e) {
            console.warn("[AUTO_RECONNECT] Error cleaning up old conference:", e);
        }
        store.dispatch(conferenceLeft(oldConference));
    }
};

const cleanupActiveConnection = async (store: IStore) => {
    console.log('[AUTO_RECONNECT] calling cleanupActiveConnection');
    const state = store.getState();
    const { connection } = state["features/base/connection"];
    if (connection?.disconnect) {
         console.log('[AUTO_RECONNECT] calling disconnect on active connection');
        await connection.disconnect();
    }
};

/**
 * Attempts to reconnect by clearing JWT and connecting to conference again.
 * If max attempts reached, reloads the page.
 */
const attemptReconnection = async (store: IStore) => {
    if (isLeavingConferenceManually()) return;

    if (reconnectionLock) {
        console.log('[AUTO_RECONNECT] Reconnection already in progress, skipping');
        return;
    }
    

    if (reconnectionAttempts >= MAX_RECONNECTION_ATTEMPTS) {
        console.log('[AUTO_RECONNECT] max attempts reached:', MAX_RECONNECTION_ATTEMPTS);
        handleMaxAttemptsReached(store);
        return;
    }

    reconnectionAttempts++;
    isReconnecting = true;
    showReconnectionLoader(store, reconnectionAttempts);

    reconnectionLock = true;
    console.log('[AUTO_RECONNECT] attemptReconnection called, current attempt:', reconnectionAttempts);

    try {
        cleanupOldConference(store);
        await cleanupActiveConnection(store);
        clearRemoteTracks(store);
        clearExpiredJWT(store);
        await triggerReconnection(store);
    } catch (error) {
        console.error("[AUTO_RECONNECT] Reconnection error:", error);
        await scheduleRetry(store);
    } finally {
        reconnectionLock = false;
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
    reconnectionAttempts = 0;
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
            if (reconnectionLock) {
                console.log('[AUTO_RECONNECT] Reconnection in progress, ignoring disconnect');
                break;
            }

            if (isReconnecting) {
                console.log('[AUTO_RECONNECT] Already reconnecting, scheduling retry');
                scheduleRetry(store);
            } else {
                console.log('[AUTO_RECONNECT] Starting reconnection process');
                clearTimer();
                reconnectionAttempts = 0;
                
                reconnectionTimer = window.setTimeout(() => {
                    if (!isLeavingConferenceManually()) {
                        attemptReconnection(store);
                    }
                }, RECONNECTION_WAIT_TIME_MS);
            }

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
            if (error?.name === JWT_EXPIRED_ERROR) {
                if (!isLeavingConferenceManually()) {
                    if (!isReconnecting) {
                        console.log('[AUTO_RECONNECT] JWT expired, starting reconnection');
                        clearTimer();
                        reconnectionAttempts = 0;
                        attemptReconnection(store);
                    } else {
                        console.log('[AUTO_RECONNECT] JWT expired during reconnection, scheduling retry');
                        scheduleRetry(store);
                    }
                }
            } else if (isReconnecting) {
                console.log('[AUTO_RECONNECT] Connection failed during reconnection, scheduling retry');
                scheduleRetry(store);
            }

            break;
        }
    }

    return result;
});

export default {};

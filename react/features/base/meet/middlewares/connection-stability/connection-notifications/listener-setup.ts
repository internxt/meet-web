import { IStore } from '../../../../../app/types';
import { JitsiConferenceEvents, JitsiConnectionEvents } from '../../../../lib-jitsi-meet';
import {
    handleDeviceSuspended,
    handleMediaConnectionInterrupted,
    handleMediaConnectionRestored,
} from './event-handlers.conference';
import {
    handleXMPPConnected,
    handleXMPPConnectionFailed,
    handleXMPPDisconnected,
} from './event-handlers.connection';
import { ConnectionState } from './types';

/**
 * Attaches event listeners for conference media connection events
 * These events track the ICE connection state (actual audio/video transport)
 *
 * @param conference - Jitsi conference instance
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to track listener registration
 */
export const setupConferenceMediaListeners = (
    conference: any,
    dispatch: IStore["dispatch"],
    state: ConnectionState
) => {
    if (state.hasConferenceListeners || !conference) {
        console.log("[LISTENER_SETUP] Skipping conference media listeners setup", {
            alreadyHasListeners: state.hasConferenceListeners,
            noConference: !conference
        });
        return;
    }

    console.log("[LISTENER_SETUP] Setting up conference media listeners (ICE events)");

    // Create named handler functions for proper cleanup
    const interruptedHandler = () => handleMediaConnectionInterrupted(dispatch, state);
    const restoredHandler = () => handleMediaConnectionRestored(dispatch, state);
    const suspendHandler = () => handleDeviceSuspended(dispatch);

    conference.addEventListener(JitsiConferenceEvents.CONNECTION_INTERRUPTED, interruptedHandler);
    conference.addEventListener(JitsiConferenceEvents.CONNECTION_RESTORED, restoredHandler);
    conference.addEventListener(JitsiConferenceEvents.SUSPEND_DETECTED, suspendHandler);

    // Store handlers and conference reference for cleanup
    state.conferenceHandlers = {
        interruptedHandler,
        restoredHandler,
        suspendHandler
    };
    state.conferenceRef = conference;
    state.hasConferenceListeners = true;
    console.log("[LISTENER_SETUP] Conference media listeners registered successfully");
};

/**
 * Removes event listeners for conference media connection events
 *
 * @param state - Connection state containing handler references
 */
export const removeConferenceMediaListeners = (state: ConnectionState) => {
    if (!state.conferenceRef || !state.conferenceHandlers) {
        console.log("[LISTENER_SETUP] Skipping conference media listeners removal - no refs");
        return;
    }

    console.log("[LISTENER_SETUP] Removing conference media listeners");

    const { conferenceRef, conferenceHandlers } = state;

    conferenceRef.removeEventListener(
        JitsiConferenceEvents.CONNECTION_INTERRUPTED,
        conferenceHandlers.interruptedHandler
    );
    conferenceRef.removeEventListener(
        JitsiConferenceEvents.CONNECTION_RESTORED,
        conferenceHandlers.restoredHandler
    );
    conferenceRef.removeEventListener(
        JitsiConferenceEvents.SUSPEND_DETECTED,
        conferenceHandlers.suspendHandler
    );

    // Clear references to prevent memory leaks
    state.conferenceHandlers = undefined;
    state.conferenceRef = undefined;
    state.hasConferenceListeners = false;
    console.log("[LISTENER_SETUP] Conference media listeners removed successfully");
};

/**
 * Attaches event listeners for XMPP connection events
 * These events track the signaling connection (WebSocket to XMPP server)
 *
 * @param connection - Jitsi connection instance
 * @param dispatch - Redux dispatch function
 * @param state - Connection state to track listener registration
 */
export const setupXMPPConnectionListeners = (connection: any, dispatch: IStore["dispatch"], state: ConnectionState) => {
    if (!connection || state.hasConnectionListeners) {
        console.log("[LISTENER_SETUP] Skipping XMPP listeners setup", {
            noConnection: !connection,
            alreadyHasListeners: state.hasConnectionListeners
        });
        return;
    }

    console.log("[LISTENER_SETUP] Setting up XMPP connection listeners");

    // Create named handler functions for proper cleanup
    const connectedHandler = () => handleXMPPConnected();
    const disconnectedHandler = (message: string) => handleXMPPDisconnected(dispatch, message);
    const failedHandler = (error: any, message: string) => handleXMPPConnectionFailed(dispatch, error, message);

    connection.addEventListener(JitsiConnectionEvents.CONNECTION_ESTABLISHED, connectedHandler);
    connection.addEventListener(JitsiConnectionEvents.CONNECTION_DISCONNECTED, disconnectedHandler);
    connection.addEventListener(JitsiConnectionEvents.CONNECTION_FAILED, failedHandler);

    // Store handlers and connection reference for cleanup
    state.connectionHandlers = {
        connectedHandler,
        disconnectedHandler,
        failedHandler
    };
    state.connectionRef = connection;
    state.hasConnectionListeners = true;
    console.log("[LISTENER_SETUP] XMPP connection listeners registered successfully");
};

/**
 * Removes event listeners for XMPP connection events
 *
 * @param state - Connection state containing handler references
 */
export const removeXMPPConnectionListeners = (state: ConnectionState) => {
    if (!state.connectionRef || !state.connectionHandlers) {
        console.log("[LISTENER_SETUP] Skipping XMPP listeners removal - no refs");
        return;
    }

    console.log("[LISTENER_SETUP] Removing XMPP connection listeners");

    const { connectionRef, connectionHandlers } = state;

    connectionRef.removeEventListener(
        JitsiConnectionEvents.CONNECTION_ESTABLISHED,
        connectionHandlers.connectedHandler
    );
    connectionRef.removeEventListener(
        JitsiConnectionEvents.CONNECTION_DISCONNECTED,
        connectionHandlers.disconnectedHandler
    );
    connectionRef.removeEventListener(
        JitsiConnectionEvents.CONNECTION_FAILED,
        connectionHandlers.failedHandler
    );

    // Clear references to prevent memory leaks
    state.connectionHandlers = undefined;
    state.connectionRef = undefined;
    state.hasConnectionListeners = false;
    console.log("[LISTENER_SETUP] XMPP connection listeners removed successfully");
};

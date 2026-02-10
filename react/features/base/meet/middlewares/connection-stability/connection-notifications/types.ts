/**
 * State interface for tracking connection notification behavior
 */
export interface ConnectionState {
    /**
     * True when conference media listeners (ICE/Media events) have been attached
     * Prevents duplicate event listener registration
     */
    hasConferenceListeners: boolean;

    /**
     * True when connection listeners (XMPP/WebSocket events) have been attached
     * Prevents duplicate event listener registration
     */
    hasConnectionListeners: boolean;

    /**
     * True when media connection (ICE) was interrupted
     * Used to only show "connection restored" notification if there was a previous interruption
     */
    wasMediaConnectionInterrupted: boolean;

    /**
     * Stored handler references for conference media listeners
     * Required for proper cleanup via removeEventListener
     */
    conferenceHandlers?: {
        interruptedHandler: () => void;
        restoredHandler: () => void;
        suspendHandler: () => void;
    };

    /**
     * Stored handler references for XMPP connection listeners
     * Required for proper cleanup via removeEventListener
     */
    connectionHandlers?: {
        connectedHandler: () => void;
        disconnectedHandler: (message: string) => void;
        failedHandler: (error: any, message: string) => void;
    };

    /**
     * Reference to the conference object for listener removal
     */
    conferenceRef?: any;

    /**
     * Reference to the connection object for listener removal
     */
    connectionRef?: any;
}

import { JitsiConnectionErrors } from "../../../lib-jitsi-meet";

export const MAX_RECONNECT_ATTEMPTS = 5;
export const RECONNECT_WINDOW_MS = 3 * 60 * 1000;

const RECONNECT_ATTEMPTS_KEY = "meet:reconnectAttempts";

type AttemptsStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface ConnectionError {
    name?: string;
}

const isConnectionLostError = (error?: ConnectionError | string): boolean => {
    const name = typeof error === "string" ? error : error?.name;

    return name === JitsiConnectionErrors.OTHER_ERROR || name === JitsiConnectionErrors.CONNECTION_DROPPED_ERROR;
};

const getRecentAttempts = (storage: AttemptsStorage, now: number): number[] => {
    try {
        const attempts: unknown = JSON.parse(storage.getItem(RECONNECT_ATTEMPTS_KEY) ?? "[]");

        return Array.isArray(attempts)
            ? attempts.filter((time): time is number => typeof time === "number" && now - time < RECONNECT_WINDOW_MS)
            : [];
    } catch {
        return [];
    }
};

/**
 * Decides whether a connection failure should be retried by connecting again, keeping track of the attempts so the
 * user is only taken out of the meeting after {@link MAX_RECONNECT_ATTEMPTS} attempts in {@link RECONNECT_WINDOW_MS}.
 * The attempts are kept in the session storage because every attempt reloads the page.
 *
 * @param error - The connection or conference error.
 * @param wasInMeeting - Whether the user was in the meeting or reconnecting to it when the failure happened.
 * @returns True if the user should be reconnected, false if they should be taken out of the meeting.
 */
export const shouldRetryConnection = (
    error: ConnectionError | string | undefined,
    wasInMeeting: boolean,
    storage: AttemptsStorage = sessionStorage,
    now: number = Date.now(),
): boolean => {
    const attempts = getRecentAttempts(storage, now);
    const isReconnecting = attempts.length > 0;

    if (
        !isConnectionLostError(error) ||
        !(wasInMeeting || isReconnecting) ||
        attempts.length >= MAX_RECONNECT_ATTEMPTS
    ) {
        clearConnectionRetries(storage);

        return false;
    }

    try {
        storage.setItem(RECONNECT_ATTEMPTS_KEY, JSON.stringify([...attempts, now]));
    } catch {
        return false;
    }

    return true;
};

export const clearConnectionRetries = (storage: AttemptsStorage = sessionStorage): void => {
    try {
        storage.removeItem(RECONNECT_ATTEMPTS_KEY);
    } catch {
        // NOOP
    }
};

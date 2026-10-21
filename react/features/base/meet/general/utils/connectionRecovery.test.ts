import { beforeEach, describe, expect, it, vi } from "vitest";
import {
    MAX_RECONNECT_ATTEMPTS,
    RECONNECT_WINDOW_MS,
    clearConnectionRetries,
    shouldRetryConnection,
} from "./connectionRecovery";

vi.mock("../../../lib-jitsi-meet", () => ({
    JitsiConnectionErrors: {
        OTHER_ERROR: "connection.otherError",
        CONNECTION_DROPPED_ERROR: "connection.droppedError",
    },
}));

const createStorage = () => {
    const items = new Map<string, string>();

    return {
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, value),
        removeItem: (key: string) => items.delete(key),
    };
};

const CONNECTION_LOST = { name: "connection.otherError" };

describe("shouldRetryConnection", () => {
    let storage: ReturnType<typeof createStorage>;
    const now = 1_000_000;

    beforeEach(() => {
        storage = createStorage();
    });

    it("When the connection is lost during the meeting, then it should retry", () => {
        expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now)).toBe(true);
        expect(shouldRetryConnection({ name: "connection.droppedError" }, true, storage, now)).toBe(true);
    });

    it("When the conference fails because the connection was lost, then it should retry", () => {
        expect(shouldRetryConnection("connection.otherError", true, storage, now)).toBe(true);
    });

    it("When the failure is not a lost connection, then it should not retry", () => {
        expect(shouldRetryConnection({ name: "conference.destroyed" }, true, storage, now)).toBe(false);
        expect(shouldRetryConnection(undefined, true, storage, now)).toBe(false);
    });

    it("When the connection fails before ever joining the meeting, then it should not retry", () => {
        expect(shouldRetryConnection(CONNECTION_LOST, false, storage, now)).toBe(false);
    });

    it("When the connection fails again while reconnecting, then it should retry", () => {
        shouldRetryConnection(CONNECTION_LOST, true, storage, now);

        expect(shouldRetryConnection(CONNECTION_LOST, false, storage, now + 10_000)).toBe(true);
    });

    it("When the maximum attempts are reached within the window, then it should stop retrying", () => {
        for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
            expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now + attempt * 1000)).toBe(true);
        }

        expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now + MAX_RECONNECT_ATTEMPTS * 1000)).toBe(false);
    });

    it("When it stops retrying, then the next failure in the meeting should start counting again", () => {
        for (let attempt = 0; attempt <= MAX_RECONNECT_ATTEMPTS; attempt++) {
            shouldRetryConnection(CONNECTION_LOST, true, storage, now);
        }

        expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now + 1000)).toBe(true);
    });

    it("When the previous attempts are older than the window, then they should not count", () => {
        for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
            shouldRetryConnection(CONNECTION_LOST, true, storage, now);
        }

        expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now + RECONNECT_WINDOW_MS)).toBe(true);
    });

    it("When the stored attempts are corrupted, then it should start counting again", () => {
        storage.setItem("meet:reconnectAttempts", "not json");

        expect(shouldRetryConnection(CONNECTION_LOST, true, storage, now)).toBe(true);
    });

    it("When the storage is not available, then it should not retry", () => {
        const failingStorage = {
            ...storage,
            setItem: () => {
                throw new Error("QuotaExceededError");
            },
        };

        expect(shouldRetryConnection(CONNECTION_LOST, true, failingStorage, now)).toBe(false);
    });

    it("When the attempts are cleared, then a failure before joining should not retry", () => {
        shouldRetryConnection(CONNECTION_LOST, true, storage, now);
        clearConnectionRetries(storage);

        expect(shouldRetryConnection(CONNECTION_LOST, false, storage, now)).toBe(false);
    });
});

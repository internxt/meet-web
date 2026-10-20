import { afterEach, describe, expect, it } from "vitest";
import { MAX_TIMELINE_EVENTS, clearTimelineEvents, getTimelineEvents, recordAction, recordEvent } from "./eventTimeline";

describe("eventTimeline", () => {
    afterEach(() => clearTimelineEvents());

    it("When a tracked action is dispatched, then it should keep it with its relevant details", () => {
        recordAction({ type: "CONNECTION_FAILED", error: { name: "connection.otherError", message: "WebSocket closed" } }, 1000);

        expect(getTimelineEvents()).toEqual([
            {
                time: 1000,
                type: "CONNECTION_FAILED",
                details: { error: "connection.otherError", message: "WebSocket closed", details: undefined },
            },
        ]);
    });

    it("When an action is not tracked, then it should ignore it", () => {
        recordAction({ type: "SET_FILMSTRIP_VISIBLE" });

        expect(getTimelineEvents()).toEqual([]);
    });

    it("When the encryption key changes, then it should keep only its index", () => {
        recordAction({ type: "SET_MEDIA_ENCRYPTION_KEY", keyInfo: { encryptionKey: "secret", index: 3 } }, 1000);

        expect(getTimelineEvents()).toEqual([ { time: 1000, type: "SET_MEDIA_ENCRYPTION_KEY", details: { index: 3 } } ]);
    });

    it("When reading the details of an action fails, then it should still keep the action", () => {
        recordAction({ type: "KICKED_OUT", participant: { getId: () => { throw new Error("gone"); } } }, 1000);

        expect(getTimelineEvents()).toEqual([ { time: 1000, type: "KICKED_OUT" } ]);
    });

    it("When there are more events than the limit, then it should keep the most recent ones", () => {
        for (let i = 0; i < MAX_TIMELINE_EVENTS + 1; i++) {
            recordEvent(`event ${i}`);
        }

        const events = getTimelineEvents();

        expect(events).toHaveLength(MAX_TIMELINE_EVENTS);
        expect(events[0].type).toBe("event 1");
    });
});

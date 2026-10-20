import { afterEach, describe, expect, it } from "vitest";
import { clearTimelineEvents, recordEvent } from "./eventTimeline";
import { addLogEntry, clearLogEntries } from "./logBuffer";
import {
    MAX_PREVIOUS_PAGES,
    MAX_PREVIOUS_PAGES_SIZE,
    MAX_PREVIOUS_PAGE_AGE_MS,
    getPreviousPages,
    restorePreviousPages,
    savePreviousPage,
} from "./previousPage";

const createStorage = () => {
    const items = new Map<string, string>();

    return {
        items,
        getItem: (key: string) => items.get(key) ?? null,
        setItem: (key: string, value: string) => items.set(key, value),
        removeItem: (key: string) => items.delete(key),
    };
};

const reloadPage = (storage: ReturnType<typeof createStorage>, text: string, time: number) => {
    clearLogEntries();
    clearTimelineEvents();
    addLogEntry("log", [ text ], time);
    recordEvent(text, undefined, time);
    savePreviousPage(storage, time + 1);
    restorePreviousPages(storage, time + 2);
};

describe("previousPage", () => {
    afterEach(() => {
        clearLogEntries();
        clearTimelineEvents();
        restorePreviousPages(createStorage());
    });

    it("When the page is reloaded, then the next page should get the previous logs and events", () => {
        const storage = createStorage();

        reloadPage(storage, "connection.otherError", 1000);

        expect(getPreviousPages()).toEqual([
            expect.objectContaining({
                unloadedAt: 1001,
                logs: [ expect.objectContaining({ text: "connection.otherError" }) ],
                timeline: [ expect.objectContaining({ type: "connection.otherError" }) ],
            }),
        ]);
        expect(storage.items.size).toBe(0);
    });

    it("When the user rejoins after a reload, then the page where the problem happened should still be kept", () => {
        const storage = createStorage();

        reloadPage(storage, "meeting that failed", 1000);
        reloadPage(storage, "join screen", 2000);
        reloadPage(storage, "meeting after rejoining", 3000);

        expect(getPreviousPages().map(page => page.logs[0].text)).toEqual([ "meeting that failed", "join screen", "meeting after rejoining" ]);
    });

    it("When there are more pages than the limit, then it should keep the most recent ones", () => {
        const storage = createStorage();

        for (let i = 0; i <= MAX_PREVIOUS_PAGES; i++) {
            reloadPage(storage, `page ${i}`, 1000 + i);
        }

        expect(getPreviousPages().map(page => page.logs[0].text)).toEqual([ "page 1", "page 2", "page 3" ]);
    });

    it("When the logs contain secrets, then they should not be stored", () => {
        const storage = createStorage();

        addLogEntry("log", [ "token=abc123 for test@example.com" ], 1000);
        savePreviousPage(storage, 2000);

        expect([ ...storage.items.values() ][0]).not.toMatch(/abc123|test@example\.com/);
    });

    it("When a previous page is too old, then it should be ignored", () => {
        const storage = createStorage();

        addLogEntry("log", [ "old" ], 1000);
        savePreviousPage(storage, 1000);
        restorePreviousPages(storage, 1000 + MAX_PREVIOUS_PAGE_AGE_MS);

        expect(getPreviousPages()).toEqual([]);
    });

    it("When the logs are bigger than the limit, then it should keep the most recent ones", () => {
        const storage = createStorage();

        for (let i = 0; i < 2000; i++) {
            addLogEntry("log", [ `${i} ${"x".repeat(1500)}` ], 1000);
        }
        savePreviousPage(storage, 2000);
        const stored = [ ...storage.items.values() ][0];

        expect(stored.length).toBeLessThanOrEqual(MAX_PREVIOUS_PAGES_SIZE);
        expect(stored).toContain("1999 ");
        expect(stored).not.toContain('"0 x');
    });

    it("When the stored data is corrupted, then it should be ignored", () => {
        const storage = createStorage();

        storage.setItem("meet:debugReport:previousPages", "not json");
        restorePreviousPages(storage, 1000);

        expect(getPreviousPages()).toEqual([]);
    });
});

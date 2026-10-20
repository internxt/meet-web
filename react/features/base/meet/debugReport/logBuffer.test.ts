import { afterEach, describe, expect, it, vi } from "vitest";
import {
    MAX_ENTRY_LENGTH,
    MAX_LOG_AGE_MS,
    MAX_LOG_ENTRIES,
    addLogEntry,
    clearLogEntries,
    getLogEntries,
    startLogCapture,
} from "./logBuffer";

describe("logBuffer", () => {
    afterEach(() => clearLogEntries());

    it("When objects and errors are logged, then it should keep them as text", () => {
        addLogEntry("error", [ "Failed:", new Error("boom"), { code: 1 } ], 1000);

        const [ entry ] = getLogEntries();

        expect(entry.level).toBe("error");
        expect(entry.text).toContain("Failed: Error: boom");
        expect(entry.text).toContain('{"code":1}');
    });

    it("When an object has circular references, then it should still be logged", () => {
        const value: Record<string, unknown> = { name: "a" };

        value.self = value;
        addLogEntry("log", [ value ], 1000);

        expect(getLogEntries()[0].text).toBe('{"name":"a","self":"[circular]"}');
    });

    it("When an entry is too long, then it should be truncated", () => {
        addLogEntry("log", [ "x".repeat(MAX_ENTRY_LENGTH + 100) ], 1000);

        expect(getLogEntries()[0].text).toHaveLength(MAX_ENTRY_LENGTH + 1);
    });

    it("When there are more entries than the limit, then it should keep the most recent ones", () => {
        for (let i = 0; i < MAX_LOG_ENTRIES + 5; i++) {
            addLogEntry("log", [ `entry ${i}` ], 1000);
        }

        const entries = getLogEntries();

        expect(entries).toHaveLength(MAX_LOG_ENTRIES);
        expect(entries[0].text).toBe("entry 5");
    });

    it("When entries are older than the time window, then it should drop them", () => {
        addLogEntry("log", [ "old" ], 0);
        addLogEntry("log", [ "new" ], MAX_LOG_AGE_MS + 1);

        expect(getLogEntries().map(entry => entry.text)).toEqual([ "new" ]);
    });

    it("When the console is captured, then it should keep the entries and still write to the console", () => {
        const target = { debug: vi.fn(), log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
        const originalWarn = target.warn;

        startLogCapture(target);
        target.warn("[E2EE] key sync failed", 3);

        expect(originalWarn).toHaveBeenCalledWith("[E2EE] key sync failed", 3);
        expect(getLogEntries()).toEqual([ expect.objectContaining({ level: "warn", text: "[E2EE] key sync failed 3" }) ]);
    });
});

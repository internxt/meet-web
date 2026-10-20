export const MAX_LOG_ENTRIES = 10_000;
export const MAX_LOG_AGE_MS = 15 * 60 * 1000;
export const MAX_ENTRY_LENGTH = 2000;

const LEVELS = [ "debug", "log", "info", "warn", "error" ] as const;

type Level = (typeof LEVELS)[number] | "uncaught";

export interface LogEntry {
    time: number;
    level: Level;
    text: string;
}

const entries: LogEntry[] = [];
let isCapturing = false;

const stringify = (arg: unknown): string => {
    if (typeof arg === "string") {
        return arg;
    }
    if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}${arg.stack ? `\n${arg.stack}` : ""}`;
    }
    try {
        const seen = new WeakSet<object>();

        return JSON.stringify(arg, (_key, value: unknown) => {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return "[circular]";
                }
                seen.add(value);
            }

            return value instanceof Error ? `${value.name}: ${value.message}` : value;
        }) ?? String(arg);
    } catch {
        return String(arg);
    }
};

export const addLogEntry = (level: Level, args: unknown[], now = Date.now()): void => {
    const text = args.map(stringify).join(" ");

    entries.push({ time: now, level, text: text.length > MAX_ENTRY_LENGTH ? `${text.slice(0, MAX_ENTRY_LENGTH)}…` : text });

    while (entries.length > MAX_LOG_ENTRIES || (entries.length && now - entries[0].time > MAX_LOG_AGE_MS)) {
        entries.shift();
    }
};

export const getLogEntries = (): LogEntry[] => [ ...entries ];

export const clearLogEntries = (): void => {
    entries.length = 0;
};

export const startLogCapture = (target: Pick<Console, (typeof LEVELS)[number]> = console): void => {
    if (isCapturing) {
        return;
    }
    isCapturing = true;

    LEVELS.forEach(level => {
        const original = target[level].bind(target);

        target[level] = (...args: unknown[]) => {
            try {
                addLogEntry(level, args);
            } catch {}
            original(...args);
        };
    });

    if (typeof window !== "undefined") {
        window.addEventListener("error", event => addLogEntry("uncaught", [ event.error ?? event.message ]));
        window.addEventListener("unhandledrejection", event => addLogEntry("uncaught", [ "Unhandled rejection:", event.reason ]));
    }
};

import { TimelineEvent, getTimelineEvents } from "./eventTimeline";
import { LogEntry, getLogEntries } from "./logBuffer";
import { redact, redactText } from "./redact";

const PREVIOUS_PAGES_KEY = "meet:debugReport:previousPages";
export const MAX_PREVIOUS_PAGES = 3;
export const MAX_PREVIOUS_PAGE_AGE_MS = 15 * 60 * 1000;
export const MAX_PREVIOUS_PAGES_SIZE = 2 * 1024 * 1024;

type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;

export interface PreviousPage {
    unloadedAt: number;
    url: string;
    logs: LogEntry[];
    timeline: TimelineEvent[];
}

let previousPages: PreviousPage[] = [];

const isRecent = (page: PreviousPage, now: number) => now - page.unloadedAt < MAX_PREVIOUS_PAGE_AGE_MS;

export const savePreviousPage = (storage: Storage = sessionStorage, now = Date.now()): void => {
    try {
        const current: PreviousPage = {
            unloadedAt: now,
            url: location.pathname,
            logs: getLogEntries().map(entry => ({ ...entry, text: redactText(entry.text) })),
            timeline: redact(getTimelineEvents()) as TimelineEvent[],
        };
        let pages = [ ...previousPages.filter(page => isRecent(page, now)), current ].slice(-MAX_PREVIOUS_PAGES);
        let serialized = JSON.stringify(pages);

        while (serialized.length > MAX_PREVIOUS_PAGES_SIZE && pages.some(page => page.logs.length)) {
            const index = pages.findIndex(page => page.logs.length);

            pages = pages.map((page, i) => (i === index ? { ...page, logs: page.logs.slice(Math.ceil(page.logs.length / 4)) } : page));
            serialized = JSON.stringify(pages);
        }
        storage.setItem(PREVIOUS_PAGES_KEY, serialized);
    } catch {}
};

export const restorePreviousPages = (storage: Storage = sessionStorage, now = Date.now()): void => {
    try {
        const stored = storage.getItem(PREVIOUS_PAGES_KEY);
        const pages: unknown = stored ? JSON.parse(stored) : [];

        storage.removeItem(PREVIOUS_PAGES_KEY);
        previousPages = Array.isArray(pages) ? (pages as PreviousPage[]).filter(page => isRecent(page, now)) : [];
    } catch {
        previousPages = [];
    }
};

export const getPreviousPages = (): PreviousPage[] => [ ...previousPages ];

export const keepLogsAcrossReloads = (): void => {
    restorePreviousPages();
    window.addEventListener("pagehide", () => savePreviousPage());
};

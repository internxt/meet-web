import "@testing-library/jest-dom";
import { vi } from "vitest";

const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
});

globalThis.interfaceConfig = {};
globalThis.config = {};
globalThis.JitsiMeetJS = {
    constants: {
        trackStreamingStatus: {},
        recording: {
            status: vi.fn()
        }
    },
    util: { browser: {
        isChrome: vi.fn(),
        isChromiumBased: vi.fn(),
        isElectron: vi.fn(),
        isFirefox: vi.fn(),
        isSafari: vi.fn(),
        isWebKitBased: vi.fn(),
        isSupportedAndroidBrowser: vi.fn(),
        isSupportedIOSBrowser: vi.fn()
    } },
    errors: {
        conference: {},
        connection: {},
    },
    events: {
        conference: {},
        connection: {},
    }
};

globalThis.URL.createObjectURL = vi.fn((blob) => {
  return `blob:dummy-${Date.now()}`
});

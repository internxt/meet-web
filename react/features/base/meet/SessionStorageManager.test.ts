import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionStorageManager, ANON_UUID_KEY } from "./SessionStorageManager";
import { v4 } from "uuid";

const MOCK_UUID = "mock-uuid-1234";
vi.mock("uuid", () => ({ v4: vi.fn(() => MOCK_UUID) }));

describe("SessionStorageManager tests", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks(); 
  });

    it("returns the same instance on repeated access", () => {
      const a = SessionStorageManager.instance;
      const b = SessionStorageManager.instance;
      expect(a).toBe(b);
    });

    it("returns null when no anonymous UUID is stored", () => {
      expect(SessionStorageManager.instance.getUserID()).toBeNull();
    });

    it("returns the stored anonymous UUID when one exists", () => {
      sessionStorage.setItem(ANON_UUID_KEY, "existing-uuid");
      expect(SessionStorageManager.instance.getUserID()).toBe("existing-uuid");
    });

    it("generates and stores a UUID when none exists", () => {
      const result = SessionStorageManager.instance.getOrCreateUserID();
      expect(result).toBe(MOCK_UUID);
      expect(sessionStorage.getItem(ANON_UUID_KEY)).toBe(MOCK_UUID);
    });

    it("returns existing UUID without generating a new one", async () => {
      sessionStorage.setItem(ANON_UUID_KEY, "pre-existing-uuid");

      const result = SessionStorageManager.instance.getOrCreateUserID();

      expect(result).toBe("pre-existing-uuid");
      expect(v4).not.toHaveBeenCalled();
    });

    it("does not bleed into localStorage", () => {
      SessionStorageManager.instance.getOrCreateUserID();
      expect(localStorage.getItem(ANON_UUID_KEY)).toBeNull();
    });

});
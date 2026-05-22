import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageManager } from "./LocalStorageManager";

const MOCK_DISPlAY_NAME = "mock-display-name";
const key = (LocalStorageManager as any)['KEYS']?.DISPLAY_NAME; 

describe("LocalStorageManager tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks(); 
  });

    it("returns the same instance on repeated access", () => {
      const a = LocalStorageManager.instance;
      const b = LocalStorageManager.instance;
      expect(a).toBe(b);
    });

    it("returns underfined when no display name is stored", () => {
      expect(LocalStorageManager.instance.getDisplayName()).toBeUndefined();
    });

    it("returns the stored display name when one exists", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      expect(LocalStorageManager.instance.getDisplayName()).toBe(MOCK_DISPlAY_NAME);
    });

    it("returns the last stored name if was modified", () => {
     LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
     const modifiedName = 'new-display-name';
     localStorage.setItem(key, modifiedName);
    expect(LocalStorageManager.instance.getDisplayName()).toBe(modifiedName);
    });

    it("does not bleed into localStorage", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      expect(sessionStorage.getItem(key)).toBeNull();
    });

    it("returns underfined after local storage is clened ", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      LocalStorageManager.instance.clearCredentials();
      expect(LocalStorageManager.instance.getDisplayName()).toBeUndefined();
    });

});
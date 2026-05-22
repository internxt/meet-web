import { beforeEach, describe, expect, it, vi } from "vitest";
import { LocalStorageManager } from "./LocalStorageManager";

const MOCK_DISPlAY_NAME = "mock-display-name";
const key = (LocalStorageManager as any)['KEYS']?.DISPLAY_NAME; 

describe("LocalStorageManager tests", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks(); 
  });

    it("when local storage is called repeatedly, then the same instance is returned", () => {
      const a = LocalStorageManager.instance;
      const b = LocalStorageManager.instance;
      expect(a).toBe(b);
    });

    it("when no display name is stored, then returns underfined", () => {
      expect(LocalStorageManager.instance.getDisplayName()).toBeUndefined();
    });

    it("when display name is stored, then returns it", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      expect(LocalStorageManager.instance.getDisplayName()).toBe(MOCK_DISPlAY_NAME);
    });

    it("when the stored display name was modified, then returns the last modification", () => {
     LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
     const modifiedName = 'new-display-name';
     localStorage.setItem(key, modifiedName);
    expect(LocalStorageManager.instance.getDisplayName()).toBe(modifiedName);
    });

    it("when display name is saved in the local storage, then it does not bleed into the session storage", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      expect(sessionStorage.getItem(key)).toBeNull();
    });

    it("when local storage is cleaned, then display name becomes underfined", () => {
      LocalStorageManager.instance.setDisplayName(MOCK_DISPlAY_NAME);
      LocalStorageManager.instance.clearCredentials();
      expect(LocalStorageManager.instance.getDisplayName()).toBeUndefined();
    });

});
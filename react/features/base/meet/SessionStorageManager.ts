import { v4 } from "uuid";

export const ANON_UUID_KEY = "xAnonymousUserUUID";

export class SessionStorageManager {
  private static _instance: SessionStorageManager;

  private constructor() {}

  public static get instance(): SessionStorageManager {
    if (!SessionStorageManager._instance) {
      SessionStorageManager._instance = new SessionStorageManager();
    }
    return SessionStorageManager._instance;
  }

  public getOrCreateAnonymousUUID(): string {
    let uuid = this.getAnonymousUUID();
    if (!uuid) {
        uuid = v4();
        sessionStorage.setItem(ANON_UUID_KEY, uuid);
    }
   
    return uuid;
  }

  public getAnonymousUUID(): string | null {
    return sessionStorage.getItem(ANON_UUID_KEY);
  }

}

export default SessionStorageManager.instance;
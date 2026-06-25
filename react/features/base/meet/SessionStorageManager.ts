import { v4 } from "uuid";

export const ANON_UUID_KEY = "xMeetUserUUID";

export class SessionStorageManager {
  private static _instance: SessionStorageManager;

  private constructor() {}

  public static get instance(): SessionStorageManager {
    if (!SessionStorageManager._instance) {
      SessionStorageManager._instance = new SessionStorageManager();
    }
    return SessionStorageManager._instance;
  }

  public getOrCreateUserID(): string {
    let uuid = this.getUserID();
    if (!uuid) {
        uuid = v4();
        this.setUserID(uuid);
    }
   
    return uuid;
  }

  public getUserID(): string | null {
    return sessionStorage.getItem(ANON_UUID_KEY);
  }

  public setUserID(userId: string): void {
    sessionStorage.setItem(ANON_UUID_KEY, userId);
  }

  
}

export default SessionStorageManager.instance;
import { SdkManager } from "./sdk-manager.service";

export class AuthService {
    public static readonly instance: AuthService = new AuthService();

    /**
     * Obtains the current logged in user
     *
     * @returns The current user
     */
    public getUser = async () => {
        const usersClient = SdkManager.instance.getUsers();

        const { user } = await usersClient.refreshUser();

        return user;
    };

    /**
     * Refreshes user tokens and data
     * @returns The refreshed user data and tokens
     */
    public refreshUserAndTokens = async () => {
        const usersClient = SdkManager.instance.getUsers();
        const refreshResponse = await usersClient.refreshUser();
        return refreshResponse;
    };

    /**
     * Refreshes user avatar independently
     */
    public refreshAvatarUser = async (): Promise<{ avatar: string | null }> => {
        const usersClient = SdkManager.instance.getUsers();
        return usersClient.refreshAvatarUser();
    };
}

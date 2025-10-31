/**
 * Constants for auth-related action types.
 */
export const AUTH_ACTIONS = {
    LOGIN_SUCCESS: "features/authentication/LOGIN_SUCCESS",
    LOGOUT: "features/authentication/LOGOUT",
    REFRESH_TOKEN_SUCCESS: "features/authentication/REFRESH_TOKEN_SUCCESS",
    INITIALIZE_AUTH: "features/authentication/INITIALIZE",
};

/**
 * Minimum interval between configuration checks (in ms).
 * Default: 1 hour
 */
export const CONFIG_CHECK_INTERVAL = 60 * 60 * 1000;

/**
 * Minimum interval between user data refresh (in ms).
 * Default: 30 minutes
 */
export const USER_REFRESH_INTERVAL = 30 * 60 * 1000;

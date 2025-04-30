import { Tier } from "@internxt/sdk/dist/drive/payments/types/tiers";
import { SET_CURRENT_ROOM, UPDATE_MEETING_CONFIG } from "./actionTypes";

/**
 * Updates the meeting configuration based on the user's subscription tier
 *
 * @param config - Configuration from the user's tier
 * @param config.enabled - Whether the meeting feature is enabled
 * @param config.paxPerCall - Maximum number of participants allowed per call
 * @returns Action object
 */
export function updateMeetingConfig(config: Tier["featuresPerService"]["meet"]): {
    type: string;
    payload: { enabled: boolean; paxPerCall: number };
} {
    return {
        type: UPDATE_MEETING_CONFIG,
        payload: config,
    };
}

/**
 * Sets the current active meeting room ID
 *
 * @param roomId - The ID of the current meeting room
 * @returns Action object
 */
export function setCurrentRoom(roomId: string | null): {
    type: string;
    payload: { roomId: string | null };
} {
    return {
        type: SET_CURRENT_ROOM,
        payload: { roomId },
    };
}

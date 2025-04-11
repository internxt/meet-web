import { Tier } from "@internxt/sdk/dist/drive/payments/Tier";
import { IReduxState } from "../app/types";
import { SET_MEET } from "./actionTypes";

/**
 * Set the meet configuration depending on the user Tier
 * @param payload - The payload containing the meet configuration
 * @param payload.enabled - Whether the meet is enabled or not
 * @param payload.paxPerCall - The number of pax per call
 * @returns { type: string; payload: { enabled: boolean; paxPerCall: number; } }
 */
export function setMeet(payload: Tier["featuresPerService"]["meet"]): {
    type: string;
    payload: { enabled: boolean; paxPerCall: number };
} {
    return {
        type: SET_MEET,
        payload,
    };
}

/**
 * Get the meet configuration
 * @returns { type: string }
 */
export function getMeet(state: IReduxState): {
    enabled: boolean;
    paxPerCall: number;
} {
    return {
        enabled: state["features/meet"].enabled,
        paxPerCall: state["features/meet"].paxPerCall,
    };
}

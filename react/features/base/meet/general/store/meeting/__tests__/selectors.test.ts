import { describe, expect, it, vi } from "vitest";
import ReducerRegistry from "../../../../../redux/ReducerRegistry";
import { MeetingActionTypes, SET_CURRENT_ROOM, UPDATE_MEETING_CONFIG } from "../actionTypes";
import { MEETING_REDUCER, meetingReducer } from "../reducer";

vi.mock("../../../../../redux/ReducerRegistry", () => ({
    default: {
        register: vi.fn(),
    },
}));

describe("Meeting Reducer", () => {
    const initialState = {
        enabled: false,
        paxPerCall: 0,
        currentRoomId: null,
    };

    describe("Registration", () => {
        it("When module is loaded, then it should register with ReducerRegistry", () => {
            expect(ReducerRegistry.register).toHaveBeenCalledWith(MEETING_REDUCER, meetingReducer);
        });
    });

    describe("UPDATE_MEETING_CONFIG", () => {
        it("When UPDATE_MEETING_CONFIG action is dispatched, then it should update state correctly", () => {
            const action = {
                type: UPDATE_MEETING_CONFIG,
                payload: {
                    enabled: true,
                    paxPerCall: 5,
                },
            } as MeetingActionTypes;

            const result = meetingReducer(initialState, action);

            expect(result).toEqual({
                ...initialState,
                enabled: true,
                paxPerCall: 5,
            });
        });

        it("When UPDATE_MEETING_CONFIG action is dispatched with disabled config, then it should disable meeting", () => {
            const previousState = {
                ...initialState,
                enabled: true,
                paxPerCall: 10,
            };

            const action = {
                type: UPDATE_MEETING_CONFIG,
                payload: {
                    enabled: false,
                    paxPerCall: 0,
                },
            } as MeetingActionTypes;

            const result = meetingReducer(previousState, action);

            expect(result).toEqual({
                ...previousState,
                enabled: false,
                paxPerCall: 0,
            });
        });
    });

    describe("SET_CURRENT_ROOM", () => {
        it("When SET_CURRENT_ROOM action is dispatched with roomId, then it should update currentRoomId", () => {
            const roomId = "room-456";
            const action = {
                type: SET_CURRENT_ROOM,
                payload: { roomId },
            } as MeetingActionTypes;

            const result = meetingReducer(initialState, action);

            expect(result).toEqual({
                ...initialState,
                currentRoomId: roomId,
            });
        });

        it("When SET_CURRENT_ROOM action is dispatched with null, then it should clear currentRoomId", () => {
            const previousState = {
                ...initialState,
                currentRoomId: "existing-room-id",
            };

            const action = {
                type: SET_CURRENT_ROOM,
                payload: { roomId: null },
            } as MeetingActionTypes;

            const result = meetingReducer(previousState, action);

            expect(result).toEqual({
                ...previousState,
                currentRoomId: null,
            });
        });
    });

    describe("Unknown action", () => {
        it("When unknown action is dispatched, then it should return the original state", () => {
            const action = {
                type: "UNKNOWN_ACTION",
                payload: {},
            } as any;

            const result = meetingReducer(initialState, action);

            expect(result).toBe(initialState);
        });
    });
});

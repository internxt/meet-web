import ReducerRegistry from "../base/redux/ReducerRegistry";
import { GET_MEET, MEET_KEY, SET_MEET } from "./actionTypes";
import { MeetState } from "./types";

const MEET_DEFAULT_STATE: MeetState = {
    enabled: false,
    paxPerCall: 0,
};

ReducerRegistry.register<MeetState>(MEET_KEY, (state = MEET_DEFAULT_STATE, action): MeetState => {
    console.log("action", action.type);
    switch (action.type) {
        case SET_MEET: {
            const newState: MeetState = {
                ...state,
                ...action.payload,
            };
            return newState;
        }

        case GET_MEET: {
            return state;
        }
    }

    return state;
});

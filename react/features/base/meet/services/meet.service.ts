import {
    CreateCallResponse,
    JoinCallPayload,
    JoinCallResponse,
    UsersInCallResponse,
} from "@internxt/sdk/dist/meet/types";
import { SdkManager } from "./sdk-manager.service";

export class MeetService {
    public static readonly instance: MeetService = new MeetService();

    public createCall = async (): Promise<CreateCallResponse> => {
        const meetClient = SdkManager.instance.getMeet();
        return meetClient.createCall();
    };

    public joinCall = async (room: string, payload: JoinCallPayload): Promise<JoinCallResponse> => {
        const meetClient = SdkManager.instance.getMeet();
        return meetClient.joinCall(room, payload);
    };

    public getUsersCallInCall = async (room: string): Promise<UsersInCallResponse[]> => {
        const meetClient = SdkManager.instance.getMeet();
        return meetClient.getCurrentUsersInCall(room);
    };
}

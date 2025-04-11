import { CreateCallResponse } from "@internxt/sdk/dist/meet/types";
import { SdkManager } from "./sdk-manager.service";

export class MeetService {
    public static readonly instance: MeetService = new MeetService();

    public createCall = async (): Promise<CreateCallResponse> => {
        const meetClient = SdkManager.instance.getMeet();
        return meetClient.createMeetCall();
    };
}

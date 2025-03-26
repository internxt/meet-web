import { ITrack } from "../../../../tracks/types";

export interface VideoParticipantType {
    id: string;
    name: string;
    videoEnabled: boolean;
    audioMuted: boolean;
    videoTrack?: ITrack;
    audioTrack?: ITrack;
    local: boolean;
    hidden: boolean;
    dominantSpeaker: boolean;
    raisedHand: boolean;
    pinned?: boolean;
    avatarSource?: string;
}

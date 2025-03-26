import React from "react";
import { WithTranslation } from "react-i18next";
import { connect } from "react-redux";
import { IReduxState } from "../../../../../app/types";
import LargeVideoWeb from "../../../../../large-video/components/LargeVideo.web";
import { translate } from "../../../../i18n/functions";
import {
    getLocalParticipant,
    getParticipantDisplayName,
    getRemoteParticipants,
    hasRaisedHand,
    isScreenShareParticipant,
} from "../../../../participants/functions";
import {
    getAudioTrackByParticipant,
    getVideoTrackByParticipant,
    isParticipantAudioMuted,
    isParticipantVideoMuted,
} from "../../../../tracks/functions.any";
import VideoGallery from "../components/VideoGallery";
import { VideoParticipantType } from "../types";

interface GalleryVideoWrapperProps extends WithTranslation {
    videoMode: string;
    participants?: VideoParticipantType[];
}

const GalleryVideoWrapper = ({ videoMode, participants, t }: GalleryVideoWrapperProps) => {
    if (videoMode === "gallery") {
        return (
            <div className="h-full w-full overflow-hidden bg-gray-950">
                <VideoGallery participants={participants ?? []} translate={t} />
            </div>
        );
    }
    // For speaker mode - not implemented yer, for now we just show the large video of jitsi
    return <LargeVideoWeb />;
};

function mapStateToProps(state: IReduxState, galleryProps: GalleryVideoWrapperProps) {
    const localParticipant = getLocalParticipant(state);

    console.log("Estado de participantes:", state["features/base/participants"]);

    const remoteParticipantsMap = getRemoteParticipants(state);
    console.log("Mapa de participantes remotos:", remoteParticipantsMap);

    const remoteParticipants = Array.from(remoteParticipantsMap.values());
    console.log("Array de participantes remotos:", remoteParticipants);

    const allParticipants = localParticipant ? [localParticipant, ...remoteParticipants] : remoteParticipants;
    console.log("Todos los participantes antes de filtrar:", allParticipants);

    const participantsWithTracks = allParticipants
        .filter((participant) => !isScreenShareParticipant(participant))
        .map((participant) => {
            const videoTrack = getVideoTrackByParticipant(state, participant);
            const audioTrack = getAudioTrackByParticipant(state, participant);
            const isVideoMuted = isParticipantVideoMuted(participant, state);
            const isAudioMuted = isParticipantAudioMuted(participant, state);
            const displayName = getParticipantDisplayName(state, participant.id);

            console.log(`Mapping participant ${participant.id}, video track:`, videoTrack);

            return {
                id: participant.id,
                name: displayName,
                videoEnabled: !isVideoMuted && videoTrack !== undefined,
                audioMuted: isAudioMuted,
                videoTrack: videoTrack,
                audioTrack: audioTrack,
                local: participant.local || false,
                hidden: false,
                dominantSpeaker: participant.dominantSpeaker || false,
                raisedHand: hasRaisedHand(participant),
                pinned: participant.pinned,
            };
        })
        .filter((participant) => !participant.hidden);

    console.log("Participantes finales con tracks:", participantsWithTracks);

    return {
        videoMode: galleryProps.videoMode || "gallery",
        participants: participantsWithTracks,
    };
}

export default translate(connect(mapStateToProps)(GalleryVideoWrapper));

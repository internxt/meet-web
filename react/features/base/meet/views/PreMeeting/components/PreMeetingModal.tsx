import React from "react";
import { Button, TransparentModal } from "@internxt/ui";
import { useTranslation } from "react-i18next";
import { MAX_SIZE_PARTICIPANTS } from "../../../constants";
import { ErrorMessage } from "../../../general/components/ErrorMessage";
import MediaControlsWrapper from "../../../general/containers/MediaControlsWrapper";
import { MeetingUser } from "../../../services/types/meeting.types";
import NameInputSection from "./NameInputSection";
import ParticipantsList from "./ParticipantsList";
import VideoPreviewSection from "./VideoPreviewSection";

const Spinner = () => (
    <svg
        className="animate-spin h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="#636367"
            strokeWidth="4"
        />
        <path
            className="opacity-75"
            fill="#636367"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

interface ParticipantsStatusProps {
    isCreatingConference?: boolean;
    isLoadingParticipants?: boolean;
    participantsLoadError?: boolean;
    participants: MeetingUser[];
    maxParticipants: number;
    translate: (key: string, options?: Record<string, unknown>) => string;
}

const ParticipantsStatus = ({
    isCreatingConference,
    isLoadingParticipants,
    participantsLoadError,
    participants,
    maxParticipants,
    translate: t,
}: ParticipantsStatusProps) => {
    if (isCreatingConference) {
        return (
            <span className="text-base font-normal text-white/75">
                {t("meet.preMeeting.upToParticipants", { num: maxParticipants })}
            </span>
        );
    }

    if (isLoadingParticipants) {
        return (
            <div className="flex h-6 items-center justify-center mb-5">
                <Spinner />
            </div>
        );
    }

    if (participantsLoadError) {
        return (
            <span className="text-base font-normal text-white/75 mb-5">
                {t("meet.preMeeting.participantsNotAvailable")}
            </span>
        );
    }

    return <ParticipantsList participants={participants} translate={t} />;
};

interface PreMeetingModalProps {
    /**
     * The video track to render as preview
     */
    videoTrack?: Object;

    /**
     * True if the preview overlay should be muted, false otherwise.
     */
    videoMuted?: boolean;

    /**
     * The audio track.
     */
    audioTrack?: any;

    /**
     * The name of the participant.
     */
    userName: string;

    /**
     * Whether to show name error or not
     */
    showNameError: boolean;

    /**
     * Handler to set the user name
     */
    setUserName: (name: string) => void;

    /**
     * Handler to set if name input is focused
     */
    setIsNameInputFocused: (isFocused: boolean) => void;

    /**
     * List of participants
     */
    participants: MeetingUser[];

    /**
     * Flag to indicate if participants are loading
     */
    isLoadingParticipants?: boolean;

    /**
     * Flag to indicate if there was an error loading participants
     */
    participantsLoadError?: boolean;

    /**
     * Join conference handler
     */
    joinConference?: () => void;

    /**
     * Disable join button
     */
    disableJoinButton?: boolean;

    /**
     * Mirror video
     */
    flipX?: boolean;

    /**
     * Flag to indicate if conference is creating.
     */
    isCreatingConference?: boolean;

    /**
     * Error message to display
     */
    errorMessage?: string;
}

/**
 * Component for the pre-meeting modal
 */
const PreMeetingModal = ({
    videoTrack,
    videoMuted = false,
    audioTrack,
    userName,
    showNameError,
    setUserName,
    setIsNameInputFocused,
    participants,
    isLoadingParticipants,
    participantsLoadError,
    joinConference,
    disableJoinButton,
    flipX,
    isCreatingConference,
    errorMessage,
}: PreMeetingModalProps) => {
    const num = MAX_SIZE_PARTICIPANTS;
    const { t } = useTranslation();
    return (
        <TransparentModal
            className={"flex p-7 bg-black/50 border border-white/15 rounded-[20px]"}
            isOpen={true}
            onClose={() => {}}
            disableBackdrop
        >
            <div className="flex flex-col h-full text-white space-y-4">
                <VideoPreviewSection
                    videoMuted={videoMuted}
                    videoTrack={videoTrack}
                    isAudioMuted={audioTrack?.isMuted()}
                    flipX={flipX}
                />
                <NameInputSection
                    userName={userName}
                    showNameError={showNameError}
                    setUserName={setUserName}
                    setIsNameInputFocused={setIsNameInputFocused}
                    translate={t}
                />
                <MediaControlsWrapper />
                <div className="border border-b border-white/15"/>
                <div className="flex flex-col items-center justify-center">
                    <span className="text-xl font-semibold text-white">{t("meet.internxtMeet")}</span>
                    <ParticipantsStatus
                        isCreatingConference={isCreatingConference}
                        isLoadingParticipants={isLoadingParticipants}
                        participantsLoadError={participantsLoadError}
                        participants={participants}
                        maxParticipants={num}
                        translate={t}
                    />
                </div>
                {!!errorMessage && (
                    <div className="max-w-[264px]">
                        <ErrorMessage message={errorMessage} />
                    </div>
                )}
                <Button
                    onClick={joinConference}
                    disabled={!userName || disableJoinButton}
                    loading={disableJoinButton}
                    variant="primary"
                    className="mt-5"
                >
                    {isCreatingConference ? t("meet.preMeeting.newMeeting") : t("meet.preMeeting.joinMeeting")}
                </Button>
            </div>
        </TransparentModal>
    );
};

export default PreMeetingModal;

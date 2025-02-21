import { CircleButton } from "@internxt/ui";
import { ExclamationMark, Microphone, MicrophoneSlash, VideoCamera, VideoCameraSlash } from "@phosphor-icons/react";
import React from "react";

import MeetAudioSettingsPopUp from "../containers/MeetAudioSettingsPopup";
import CustomVideoSettingsPopUp from "../containers/MeetVideoSettingsPopUp";

interface MediaControlsProps {
    hasVideoPermissions?: boolean;
    isVideoMuted?: boolean;
    hasAudioPermissions?: boolean;
    isAudioMuted?: boolean;
    onVideoClick: () => void;
    onAudioClick: () => void;
    onVideoOptionsClick: () => void;
    onAudioOptionsClick: () => void;
}
const indicatorProps = {
    icon: <ExclamationMark size={12} color="white" weight="bold" />,
    className: "bg-orange",
};
const MediaControls: React.FC<MediaControlsProps> = ({
    hasVideoPermissions,
    isVideoMuted,
    hasAudioPermissions,
    isAudioMuted,
    onVideoClick,
    onAudioClick,
    onVideoOptionsClick,
    onAudioOptionsClick,
}) => {
    const audioIndicatorProps = !hasAudioPermissions ? indicatorProps : undefined;
    const videoIndicatorProps = !hasVideoPermissions ? indicatorProps : undefined;

    return (
        <div className="flex space-x-2 justify-center items-center">
            <CircleButton
                variant="default"
                active={hasVideoPermissions && !isVideoMuted}
                indicator={videoIndicatorProps}
                onClick={onVideoClick}
                onClickToggleButton={onVideoOptionsClick}
                dropdown={<CustomVideoSettingsPopUp />}
            >
                {hasVideoPermissions && !isVideoMuted ? (
                    <VideoCamera size={22} color="black" weight="fill" />
                ) : (
                    <VideoCameraSlash size={22} color="white" weight="fill" />
                )}
            </CircleButton>
            <CircleButton
                variant="default"
                active={hasAudioPermissions && !isAudioMuted}
                indicator={audioIndicatorProps}
                onClick={onAudioClick}
                onClickToggleButton={onAudioOptionsClick}
                dropdown={<MeetAudioSettingsPopUp />}
            >
                {isAudioMuted || !hasAudioPermissions ? (
                    <MicrophoneSlash size={20} color="white" weight="fill" />
                ) : (
                    <Microphone size={22} color="black" weight="fill" />
                )}
            </CircleButton>
        </div>
    );
};

export default MediaControls;

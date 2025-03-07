import React, { useState } from "react";
import { connect } from "react-redux";

import { IReduxState } from "../../../../app/types";
import { toggleAudioSettings, toggleVideoSettings } from "../../../../settings/actions.web";
import { translate } from "../../../i18n/functions";
import { isAudioMuted as checkIsAudioMuted, isVideoMuted as checkIsVideoMuted } from "../../../media/functions";
import { IGUMPendingState } from "../../../media/types";
import { getLocalJitsiAudioTrack, getLocalJitsiVideoTrack } from "../../../tracks/functions.any";
import MediaControls from "../components/MediaControls";
import PermissionModal from "../components/PermissionModal";

declare const APP: any;

interface IProps {
    audioGUMPending: IGUMPendingState;
    videoGUMPending: IGUMPendingState;
    hasAudioPermissions: boolean;
    hasVideoPermissions: boolean;
    isAudioDisabled: boolean;
    isVidePreviewDisabled: boolean;
    onAudioOptionsClick: () => void;
    onVideoOptionsClick: () => void;
    t: (key: string) => string;
}

const MediaControlsWrapper: React.FC<IProps> = ({
    audioGUMPending,
    videoGUMPending,
    hasAudioPermissions,
    hasVideoPermissions,
    isAudioDisabled,
    isVidePreviewDisabled,
    onAudioOptionsClick,
    onVideoOptionsClick,
    t,
}) => {
    const [showPermissionModal, setShowPermissionModal] = useState(false);

    const handleVideoClick = () => {
        if (hasVideoPermissions === false) {
            setShowPermissionModal(true);
            return;
        }

        if (videoGUMPending === IGUMPendingState.NONE) {
            APP.conference.toggleVideoMuted(false, true);
        }
    };

    const handleAudioClick = () => {
        if (hasAudioPermissions === false) {
            setShowPermissionModal(true);
            return;
        }

        if (audioGUMPending === IGUMPendingState.NONE) {
            APP.conference.toggleAudioMuted(false, true);
        }
    };

    const handleClosePermissionModal = () => {
        setShowPermissionModal(false);
    };

    const handleContinueWithoutPermissions = () => {
        setShowPermissionModal(false);
    };

    return (
        <>
            <MediaControls
                hasVideoPermissions={hasVideoPermissions}
                isVideoMuted={isVidePreviewDisabled}
                hasAudioPermissions={hasAudioPermissions}
                isAudioMuted={isAudioDisabled}
                onVideoClick={handleVideoClick}
                onAudioClick={handleAudioClick}
                onVideoOptionsClick={onVideoOptionsClick}
                onAudioOptionsClick={onAudioOptionsClick}
            />

            {/* Modal de permisos */}
            {showPermissionModal && (
                <PermissionModal
                    translate={t}
                    onClose={handleClosePermissionModal}
                    onClickContinueWithoutPermissions={handleContinueWithoutPermissions}
                />
            )}
        </>
    );
};

/**
 * Maps (parts of) the redux state to props.
 *
 * @param {Object} state - The redux state.
 * @returns {Object}
 */
function mapStateToProps(state: IReduxState) {
    const { permissions = { audio: false, video: false } } = state["features/base/devices"];
    const { audio: audioGUMPending, video: videoGUMPending } = state["features/base/media"];
    const audioTrack = getLocalJitsiAudioTrack(state);
    const videoTrack = getLocalJitsiVideoTrack(state);
    const isVidePreviewMuted = checkIsVideoMuted(state);
    const isAudioMuted = checkIsAudioMuted(state);

    return {
        audioGUMPending: audioGUMPending.gumPending,
        videoGUMPending: videoGUMPending.gumPending,
        hasAudioPermissions: permissions.audio,
        hasVideoPermissions: permissions.video,
        isVidePreviewDisabled: isVidePreviewMuted,
        isAudioDisabled: isAudioMuted,
        videoTrack,
        audioTrack,
    };
}

const mapDispatchToProps = {
    onAudioOptionsClick: toggleAudioSettings,
    onVideoOptionsClick: toggleVideoSettings,
};

export default translate(connect(mapStateToProps, mapDispatchToProps)(MediaControlsWrapper));

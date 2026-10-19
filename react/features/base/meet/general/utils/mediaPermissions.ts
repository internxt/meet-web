import { JitsiTrackErrors } from "../../../lib-jitsi-meet";

interface TrackCreationError {
    name?: string;
    message?: string;
}

const isPermissionDenied = (error: TrackCreationError): boolean =>
    error.name === JitsiTrackErrors.PERMISSION_DENIED || error.name === "NotAllowedError";

const isScreenShareCancellation = (error: TrackCreationError): boolean =>
    error.name === JitsiTrackErrors.SCREENSHARING_USER_CANCELED ||
    error.name === "NotAllowedError" ||
    Boolean(error.message?.toLowerCase().includes("cancel"));

export const shouldShowPermissionsModal = (error: TrackCreationError, isScreenShare: boolean): boolean => {
    if (isScreenShare) {
        return !isScreenShareCancellation(error);
    }

    return isPermissionDenied(error);
};

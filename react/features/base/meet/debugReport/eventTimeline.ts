import { AnyAction } from "redux";

export const MAX_TIMELINE_EVENTS = 1000;

export interface TimelineEvent {
    time: number;
    type: string;
    details?: Record<string, unknown>;
}

const TRACKED_ACTIONS: Record<string, (action: AnyAction) => Record<string, unknown> | undefined> = {
    CONNECTION_WILL_CONNECT: () => undefined,
    CONNECTION_ESTABLISHED: () => undefined,
    CONNECTION_DISCONNECTED: () => undefined,
    CONNECTION_FAILED: action => ({ error: action.error?.name, message: action.error?.message, details: action.error?.details }),
    CONFERENCE_WILL_JOIN: () => undefined,
    CONFERENCE_JOINED: () => undefined,
    CONFERENCE_WILL_LEAVE: () => undefined,
    CONFERENCE_LEFT: () => undefined,
    CONFERENCE_FAILED: action => ({ error: action.error?.name, params: action.error?.params }),
    KICKED_OUT: action => ({ by: action.participant?.getId?.() }),
    PARTICIPANT_JOINED: action => ({ id: action.participant?.id, name: action.participant?.name, local: action.participant?.local }),
    PARTICIPANT_LEFT: action => ({ id: action.participant?.id }),
    TRACK_ADDED: action => ({
        participant: action.track?.participantId,
        media: action.track?.mediaType,
        videoType: action.track?.videoType,
        local: action.track?.local,
        muted: action.track?.muted,
    }),
    TRACK_REMOVED: action => ({ participant: action.track?.jitsiTrack?.getParticipantId?.(), media: action.track?.jitsiTrack?.getType?.() }),
    TRACK_CREATE_ERROR: action => ({ error: action.permissionDenied ? "permission denied" : "error", media: action.trackType }),
    TRACK_NO_DATA_FROM_SOURCE: action => ({ participant: action.track?.participantId, media: action.track?.mediaType }),
    SET_AUDIO_MUTED: action => ({ muted: action.muted }),
    SET_VIDEO_MUTED: action => ({ muted: action.muted }),
    DATA_CHANNEL_OPENED: () => undefined,
    DATA_CHANNEL_CLOSED: action => ({ code: action.code, reason: action.reason }),
    SET_PREJOIN_PAGE_VISIBILITY: action => ({ visible: action.value }),
    TOGGLE_E2EE: action => ({ enabled: action.enabled }),
    SET_MEDIA_ENCRYPTION_KEY: action => ({ index: action.keyInfo?.index }),
    SHOW_NOTIFICATION: action => ({ title: action.props?.titleKey ?? action.props?.title, description: action.props?.descriptionKey }),
    SHOW_PERMISSIONS_MODAL: () => undefined,
    OPEN_DIALOG: action => ({ component: action.component?.displayName ?? action.component?.name }),
};

const events: TimelineEvent[] = [];

export const recordAction = (action: AnyAction, now = Date.now()): void => {
    const getDetails = TRACKED_ACTIONS[action.type];

    if (!getDetails) {
        return;
    }

    let details: Record<string, unknown> | undefined;

    try {
        details = getDetails(action);
    } catch {
        details = undefined;
    }

    events.push({ time: now, type: action.type, ...(details && { details }) });
    if (events.length > MAX_TIMELINE_EVENTS) {
        events.shift();
    }
};

export const recordEvent = (type: string, details?: Record<string, unknown>, now = Date.now()): void => {
    events.push({ time: now, type, ...(details && { details }) });
    if (events.length > MAX_TIMELINE_EVENTS) {
        events.shift();
    }
};

export const getTimelineEvents = (): TimelineEvent[] => [ ...events ];

export const clearTimelineEvents = (): void => {
    events.length = 0;
};

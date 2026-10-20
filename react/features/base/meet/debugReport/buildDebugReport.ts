import { IReduxState } from "../../../app/types";
import { downloadJSON } from "../../util/downloadJSON";

import { getTimelineEvents } from "./eventTimeline";
import { getLogEntries } from "./logBuffer";
import { ConferenceLike, collectMediaSample, getMediaSamples } from "./mediaStatsSampler";
import { getPreviousPages } from "./previousPage";
import { redact } from "./redact";

export const DEBUG_REPORT_VERSION = 1;

const safely = <T>(read: () => T): T | { error: string } => {
    try {
        return read();
    } catch (error) {
        return { error: String(error) };
    }
};

const getAppBuild = () =>
    Array.from(document.querySelectorAll<HTMLScriptElement>("script[src*='app.bundle']"))
        .map(script => new URL(script.src, location.href).searchParams.get("v"))
        .find(Boolean);

const getEnvironment = () => {
    const connection = (navigator as Navigator & { connection?: Record<string, unknown> }).connection;
    const browser = JitsiMeetJS?.util?.browser;

    return {
        appBuild: getAppBuild(),
        libMeetVersion: JitsiMeetJS?.version,
        browser: browser && { name: browser.getName?.(), version: browser.getVersion?.() },
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemoryGb: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
        screen: `${screen.width}x${screen.height}@${window.devicePixelRatio}`,
        window: `${window.innerWidth}x${window.innerHeight}`,
        network: connection && { type: connection.type, effectiveType: connection.effectiveType, downlinkMbps: connection.downlink, rttMs: connection.rtt },
        online: navigator.onLine,
        visibility: document.visibilityState,
        pageUptimeSeconds: Math.round(performance.now() / 1000),
    };
};

const getDevices = async () => {
    const devices = await navigator.mediaDevices?.enumerateDevices?.() ?? [];
    const permissions = await Promise.all(
        [ "camera", "microphone" ].map(name =>
            navigator.permissions
                ?.query({ name: name as PermissionName })
                .then(status => [ name, status.state ])
                .catch(() => [ name, "unknown" ]),
        ),
    );

    return {
        permissions: Object.fromEntries(permissions.filter(Boolean) as [string, string][]),
        devices: devices.map(device => ({ kind: device.kind, label: device.label })),
    };
};

const getConferenceState = (state: IReduxState) => {
    const { conference, error: conferenceError, room, leaving, joining } = state["features/base/conference"];
    const { connection, error: connectionError } = state["features/base/connection"];
    const participants = state["features/base/participants"];
    const tracks = state["features/base/tracks"];
    const jitsiConference = conference as unknown as ConferenceLike | undefined;

    return {
        room,
        joined: Boolean(jitsiConference?.isJoined?.()),
        joining: Boolean(joining),
        leaving: Boolean(leaving),
        myUserId: safely(() => jitsiConference?.myUserId()),
        p2p: safely(() => jitsiConference?.isP2PActive?.()),
        connected: Boolean(connection),
        connectionError: connectionError && { name: connectionError.name, message: connectionError.message },
        conferenceError: conferenceError && { name: conferenceError.name, params: (conferenceError as { params?: unknown }).params },
        e2ee: state["features/e2ee"],
        prejoin: {
            visible: state["features/prejoin"]?.showPrejoin,
            joiningInProgress: state["features/prejoin"]?.joiningInProgress,
            skipPrejoinOnReload: state["features/prejoin"]?.skipPrejoinOnReload,
        },
        localParticipant: participants.local && { id: participants.local.id, name: participants.local.name, role: participants.local.role },
        remoteParticipants: [ ...participants.remote.values() ].map(participant => ({
            id: participant.id,
            name: participant.name,
            role: participant.role,
            e2eeEnabled: participant.e2eeEnabled,
            e2eeVerified: participant.e2eeVerified,
        })),
        tracks: tracks.map(track => ({
            participantId: track.participantId,
            local: track.local,
            mediaType: track.mediaType,
            videoType: track.videoType,
            muted: track.muted,
            streamingStatus: (track.jitsiTrack as { getTrackStreamingStatus?: () => string })?.getTrackStreamingStatus?.(),
            settings: safely(() => {
                const settings = track.jitsiTrack?.getTrack?.()?.getSettings?.();

                return settings && { width: settings.width, height: settings.height, frameRate: settings.frameRate };
            }),
        })),
        notifications: state["features/notifications"].notifications.map(notification => ({
            title: notification.props.titleKey,
            description: notification.props.descriptionKey,
        })),
    };
};

export const buildDebugReport = async (state: IReduxState) => {
    const conference = state["features/base/conference"].conference as unknown as ConferenceLike | undefined;
    const report = {
        reportVersion: DEBUG_REPORT_VERSION,
        generatedAt: new Date().toISOString(),
        environment: safely(getEnvironment),
        devices: await getDevices().catch(error => ({ error: String(error) })),
        conference: safely(() => getConferenceState(state)),
        media: {
            now: conference ? await collectMediaSample(conference).catch(error => ({ error: String(error) })) : undefined,
            history: getMediaSamples(),
        },
        timeline: getTimelineEvents().map(event => ({ ...event, time: new Date(event.time).toISOString() })),
        logs: getLogEntries().map(entry => `${new Date(entry.time).toISOString()} [${entry.level}] ${entry.text}`),
        connectionLogs: safely(() => (state["features/base/connection"].connection as { getLogs?: () => unknown })?.getLogs?.()),
        previousPages: safely(() =>
            getPreviousPages().map(page => ({
                unloadedAt: new Date(page.unloadedAt).toISOString(),
                url: page.url,
                timeline: page.timeline.map(event => ({ ...event, time: new Date(event.time).toISOString() })),
                logs: page.logs.map(entry => `${new Date(entry.time).toISOString()} [${entry.level}] ${entry.text}`),
            })),
        ),
    };

    return redact(report);
};

export const downloadDebugReport = async (state: IReduxState): Promise<void> => {
    const { room } = state["features/base/conference"];
    const time = new Date().toISOString().replace(/[:.]/g, "-");

    downloadJSON(await buildDebugReport(state) as object, `meet-report-${room?.slice(0, 8) ?? "no-room"}-${time}.json`);
};

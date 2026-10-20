import { recordEvent } from "./eventTimeline";

export const SAMPLE_INTERVAL_MS = 10_000;
export const MAX_SAMPLES = 90;

interface RemoteTrackLike {
    getType: () => string;
    getVideoType?: () => string;
    getSsrc?: () => number | undefined;
    isMuted?: () => boolean;
    isDecoderOn?: () => boolean;
}

interface ParticipantLike {
    getId: () => string;
    getDisplayName: () => string | undefined;
    getTracks: () => RemoteTrackLike[];
}

interface JingleSessionLike {
    peerconnection?: { peerconnection?: RTCPeerConnection };
}

export interface ConferenceLike {
    myUserId: () => string;
    isJoined: () => boolean;
    isP2PActive?: () => boolean;
    getParticipants: () => ParticipantLike[];
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    off: (event: string, handler: (...args: unknown[]) => void) => void;
    jvbJingleSession?: JingleSessionLike | null;
    p2pJingleSession?: JingleSessionLike | null;
}

type Stat = Record<string, any>;

export interface MediaSample {
    time: number;
    page: { visibility: DocumentVisibilityState; online: boolean };
    connections: Record<string, unknown>[];
    outbound: Record<string, unknown>[];
    inbound: Record<string, unknown>[];
    rendering: Record<string, unknown>[];
}

const samples: MediaSample[] = [];
const paintedFrames = new WeakMap<HTMLVideoElement, number>();
const trackedVideos = new WeakSet<HTMLVideoElement>();
let previousStats = new Map<string, Stat>();
let previousPainted = new Map<string, number>();
let previousTime = 0;
let timer: ReturnType<typeof setInterval> | undefined;
let videoScanTimer: ReturnType<typeof setInterval> | undefined;
let detachConferenceEvents: (() => void) | undefined;

const CONFERENCE_EVENTS = [
    "conference.connectionInterrupted",
    "conference.connectionRestored",
    "conference.suspendDetected",
    "conference.p2pStatus",
    "conference.e2eeKeySyncFailed",
    "conference.e2eeCryptoFailed",
    "conference.e2eeKeySyncAfterTimeout",
    "conference.dataChannelClosed",
];

const round = (value: unknown, digits = 0) => (typeof value === "number" ? Number(value.toFixed(digits)) : undefined);

const perSecond = (current: Stat, previous: Stat | undefined, field: string, seconds: number) =>
    previous && typeof current[field] === "number" && seconds > 0
        ? round((current[field] - (previous[field] ?? 0)) / seconds, 1)
        : undefined;

const delta = (current: Stat, previous: Stat | undefined, field: string) =>
    typeof current[field] === "number" ? current[field] - (previous?.[field] ?? 0) : undefined;

const getPeerConnections = (conference: ConferenceLike): [string, RTCPeerConnection][] =>
    [
        [ "jvb", conference.jvbJingleSession?.peerconnection?.peerconnection ],
        [ "p2p", conference.p2pJingleSession?.peerconnection?.peerconnection ],
    ].filter((entry): entry is [string, RTCPeerConnection] => Boolean(entry[1]));

const getSsrcOwners = (conference: ConferenceLike) => {
    const owners = new Map<number, { id: string; name?: string; videoType?: string; muted?: boolean; decoderOn?: boolean }>();

    conference.getParticipants().forEach(participant => {
        participant.getTracks().forEach(track => {
            const ssrc = track.getSsrc?.();

            if (ssrc) {
                owners.set(ssrc, {
                    id: participant.getId(),
                    name: participant.getDisplayName(),
                    videoType: track.getVideoType?.(),
                    muted: track.isMuted?.(),
                    decoderOn: track.isDecoderOn?.(),
                });
            }
        });
    });

    return owners;
};

const trackVideoElements = () => {
    document.querySelectorAll<HTMLVideoElement>("[data-testid^='participant-'] video").forEach(video => {
        if (trackedVideos.has(video) || typeof video.requestVideoFrameCallback !== "function") {
            return;
        }
        trackedVideos.add(video);
        const onFrame = () => {
            paintedFrames.set(video, (paintedFrames.get(video) ?? 0) + 1);
            video.requestVideoFrameCallback(onFrame);
        };

        video.requestVideoFrameCallback(onFrame);
    });
};

const getRendering = (seconds: number) => {
    const painted = new Map<string, number>();
    const rendering = Array.from(document.querySelectorAll<HTMLVideoElement>("[data-testid^='participant-'] video")).map(video => {
        const participantId = video.closest("[data-testid^='participant-']")?.getAttribute("data-testid")?.replace("participant-", "");
        const key = `${participantId}:${video.dataset.encodeVideo}`;
        const frames = paintedFrames.get(video) ?? 0;

        painted.set(key, frames);
        const previous = previousPainted.get(key);

        return {
            participantId,
            width: video.videoWidth,
            height: video.videoHeight,
            visible: video.offsetWidth > 0 && video.offsetHeight > 0,
            paused: video.paused,
            readyState: video.readyState,
            paintedFps: previous === undefined || seconds <= 0 ? undefined : round((frames - previous) / seconds, 1),
            throughCanvas: video.srcObject instanceof MediaStream
                && video.srcObject.getVideoTracks().some((track: MediaStreamTrack) => "canvas" in track),
        };
    });

    previousPainted = painted;

    return rendering;
};

export const collectMediaSample = async (conference: ConferenceLike, now = Date.now()): Promise<MediaSample> => {
    const seconds = previousTime ? (now - previousTime) / 1000 : 0;
    const owners = getSsrcOwners(conference);
    const currentStats = new Map<string, Stat>();
    const connections: Record<string, unknown>[] = [];
    const outbound: Record<string, unknown>[] = [];
    const inbound: Record<string, unknown>[] = [];

    for (const [ name, pc ] of getPeerConnections(conference)) {
        const report = await pc.getStats();
        const byId = new Map<string, Stat>();

        report.forEach((stat: Stat) => byId.set(stat.id, stat));

        const transport = [ ...byId.values() ].find(stat => stat.type === "transport");
        const pair = byId.get(transport?.selectedCandidatePairId) ?? [ ...byId.values() ].find(stat => stat.type === "candidate-pair" && stat.nominated);
        const local = byId.get(pair?.localCandidateId);
        const remote = byId.get(pair?.remoteCandidateId);

        connections.push({
            name,
            connectionState: pc.connectionState,
            iceConnectionState: pc.iceConnectionState,
            localCandidate: local && { type: local.candidateType, protocol: local.protocol, relayProtocol: local.relayProtocol, networkType: local.networkType },
            remoteCandidate: remote && { type: remote.candidateType, protocol: remote.protocol },
            rttMs: round((pair?.currentRoundTripTime ?? 0) * 1000),
            availableOutgoingKbps: round((pair?.availableOutgoingBitrate ?? 0) / 1000),
            availableIncomingKbps: round((pair?.availableIncomingBitrate ?? 0) / 1000),
        });

        byId.forEach(stat => {
            if (stat.type !== "inbound-rtp" && stat.type !== "outbound-rtp") {
                return;
            }
            const key = `${name}:${stat.type}:${stat.ssrc}`;
            const previous = previousStats.get(key);

            currentStats.set(key, stat);

            if (stat.type === "outbound-rtp") {
                outbound.push({
                    connection: name,
                    kind: stat.kind,
                    ssrc: stat.ssrc,
                    rid: stat.rid,
                    active: stat.active,
                    resolution: stat.frameWidth ? `${stat.frameWidth}x${stat.frameHeight}` : undefined,
                    fps: round(stat.framesPerSecond),
                    kbps: round((perSecond(stat, previous, "bytesSent", seconds) ?? 0) * 8 / 1000),
                    qualityLimitationReason: stat.qualityLimitationReason,
                    encoder: stat.encoderImplementation,
                    pliReceived: delta(stat, previous, "pliCount"),
                    nackReceived: delta(stat, previous, "nackCount"),
                });

                return;
            }

            const owner = owners.get(stat.ssrc);

            inbound.push({
                connection: name,
                kind: stat.kind,
                ssrc: stat.ssrc,
                participantId: owner?.id,
                participantName: owner?.name,
                videoType: owner?.videoType,
                remotelyMuted: owner?.muted,
                resolution: stat.frameWidth ? `${stat.frameWidth}x${stat.frameHeight}` : undefined,
                kbps: round((perSecond(stat, previous, "bytesReceived", seconds) ?? 0) * 8 / 1000),
                packetsLost: delta(stat, previous, "packetsLost"),
                jitterMs: round((stat.jitter ?? 0) * 1000),
                ...(stat.kind === "video" && {
                    receivedFps: perSecond(stat, previous, "framesReceived", seconds),
                    decodedFps: perSecond(stat, previous, "framesDecoded", seconds),
                    keyFramesDecoded: delta(stat, previous, "keyFramesDecoded"),
                    framesDropped: delta(stat, previous, "framesDropped"),
                    pliSent: delta(stat, previous, "pliCount"),
                    firSent: delta(stat, previous, "firCount"),
                    nackSent: delta(stat, previous, "nackCount"),
                    freezes: delta(stat, previous, "freezeCount"),
                    freezeMs: round((delta(stat, previous, "totalFreezesDuration") ?? 0) * 1000),
                    decoder: stat.decoderImplementation,
                    resolutionDecoderOn: owner?.decoderOn,
                }),
                ...(stat.kind === "audio" && {
                    concealedSamples: delta(stat, previous, "concealedSamples"),
                    audioLevel: round(stat.audioLevel, 3),
                }),
            });
        });
    }

    previousStats = currentStats;
    previousTime = now;

    return {
        time: now,
        page: { visibility: document.visibilityState, online: navigator.onLine },
        connections,
        outbound,
        inbound,
        rendering: getRendering(seconds),
    };
};

export const getMediaSamples = (): MediaSample[] => [ ...samples ];

export const stopMediaSampling = (): void => {
    clearInterval(timer);
    clearInterval(videoScanTimer);
    timer = undefined;
    videoScanTimer = undefined;
    detachConferenceEvents?.();
    detachConferenceEvents = undefined;
    previousStats = new Map();
    previousPainted = new Map();
    previousTime = 0;
};

export const startMediaSampling = (conference: ConferenceLike): void => {
    stopMediaSampling();

    const handlers = CONFERENCE_EVENTS.map(event => {
        const handler = (...args: unknown[]) => recordEvent(event, { args: args.slice(0, 2).map(arg => (typeof arg === "object" ? "[object]" : arg)) });

        conference.on(event, handler);

        return [ event, handler ] as const;
    });

    detachConferenceEvents = () => handlers.forEach(([ event, handler ]) => conference.off(event, handler));

    trackVideoElements();
    videoScanTimer = setInterval(trackVideoElements, 2000);
    timer = setInterval(async () => {
        try {
            samples.push(await collectMediaSample(conference));
            if (samples.length > MAX_SAMPLES) {
                samples.shift();
            }
        } catch (error) {
            recordEvent("STATS_SAMPLE_FAILED", { error: String(error) });
        }
    }, SAMPLE_INTERVAL_MS);
};

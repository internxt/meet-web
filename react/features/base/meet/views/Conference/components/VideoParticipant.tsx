import { Avatar } from "@internxt/ui";
import { Hand, MicrophoneSlash } from "@phosphor-icons/react";
import React, { useEffect, useRef, useState } from "react";
import ConnectionIndicator from "../../../../../connection-indicator/components/web/ConnectionIndicator";
import { VideoParticipantType } from "../types";

export type VideoParticipantProps = {
    participant: VideoParticipantType;
    className?: string;
    translate: (key: string) => string;
};

const VideoParticipant = ({ participant, className = "", translate }: VideoParticipantProps) => {
    const {
        id,
        name,
        videoEnabled,
        audioMuted,
        videoTrack,
        audioTrack,
        local,
        dominantSpeaker,
        raisedHand,
        avatarSource,
    } = participant;

    console.log(`Rendering participant: ${id}, name: ${name}, videoEnabled: ${videoEnabled}`);

    // References for video and audio elements
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);

    // States to control playback
    const [isVideoAttached, setIsVideoAttached] = useState(false);
    const [streamingStatus, setStreamingStatus] = useState("inactive");

    // Reconnection control
    const reconnectCountRef = useRef(0);
    const lastTrackIdRef = useRef("");

    // Handle audio
    useEffect(() => {
        if (audioRef.current && audioTrack?.jitsiTrack && !audioMuted) {
            try {
                console.log(`Connecting audio for ${name}`);
                audioTrack.jitsiTrack.attach(audioRef.current);
            } catch (e) {
                console.error(`Error connecting audio for ${name}:`, e);
            }

            return () => {
                if (audioRef.current && audioTrack?.jitsiTrack) {
                    console.log(`Disconnecting audio for ${name}`);
                    try {
                        audioTrack.jitsiTrack.detach(audioRef.current);
                    } catch (e) {
                        console.error(`Error disconnecting audio for ${name}:`, e);
                    }
                }
            };
        }
    }, [audioTrack, audioMuted, name]);

    // Detect changes in video track
    useEffect(() => {
        if (!videoTrack?.jitsiTrack) return;

        const currentTrackId = videoTrack.jitsiTrack.getId();

        // Safely get P2P state
        const isP2P = Boolean(videoTrack.jitsiTrack.conference?.p2p);

        console.log(
            `Track info for ${name}: ID=${currentTrackId}, videoEnabled=${videoEnabled}, P2P=${isP2P}, ssrc=${
                videoTrack.jitsiTrack.ssrc || "N/A"
            }`
        );

        // If track ID changed, this indicates a possible P2P/JVB change
        if (lastTrackIdRef.current && lastTrackIdRef.current !== currentTrackId) {
            console.log(
                `Track change detected for ${name}! Old: ${lastTrackIdRef.current}, New: ${currentTrackId}`
            );
            reconnectCountRef.current = 0;
            setIsVideoAttached(false);

            // Forzar una reconexión completa
            if (videoRef.current && videoTrack.jitsiTrack && videoEnabled) {
                try {
                    videoTrack.jitsiTrack.detach(videoRef.current);
                } catch (e) {
                    console.warn(`Error disconnecting old track for ${name}:`, e);
                }

                setTimeout(() => {
                    if (videoRef.current && videoTrack?.jitsiTrack) {
                        try {
                            videoTrack.jitsiTrack
                                .attach(videoRef.current)
                                .then(() => videoRef.current?.play())
                                .catch((e) =>
                                    console.warn(`Error playing video after track change for ${name}:`, e)
                                );
                        } catch (e) {
                            console.error(`Error reconnecting after track change for ${name}:`, e);
                        }
                    }
                }, 50);
            }
        }

        lastTrackIdRef.current = currentTrackId;
    }, [videoTrack, name, videoEnabled]);

    // Connect video
    useEffect(() => {
        if (!videoRef.current || !videoTrack?.jitsiTrack || !videoEnabled) {
            return;
        }

        const connectVideo = () => {
            if (!videoRef.current || !videoTrack?.jitsiTrack) return;

            try {
                console.log(`Connecting video for ${name} (attempt ${reconnectCountRef.current + 1})`);

                // Important: Before disconnecting, save current srcObject state
                const currentSrcObject = videoRef.current.srcObject;

                // Only disconnect if there's something to disconnect
                if (currentSrcObject) {
                    try {
                        videoTrack.jitsiTrack.detach(videoRef.current);
                        console.log(`Video disconnected for ${name}`);
                    } catch (e) {
                        console.warn(`Error disconnecting video for ${name}:`, e);
                    }

                    // Give a small delay to ensure detach completes
                    setTimeout(() => {
                        performAttach();
                    }, 50);
                } else {
                    performAttach();
                }
            } catch (e) {
                console.error(`Exception connecting video for ${name}:`, e);

                // Retry connection
                if (reconnectCountRef.current < 5) {
                    reconnectCountRef.current++;
                    setTimeout(connectVideo, 500);
                }
            }
        };

        const performAttach = () => {
            if (!videoRef.current || !videoTrack?.jitsiTrack) return;

            console.log(`Executing attach for ${name}`);

            try {
                videoTrack.jitsiTrack
                    .attach(videoRef.current)
                    .then(() => {
                        console.log(`Video connected for ${name}, srcObject:`, videoRef.current?.srcObject);
                        setIsVideoAttached(true);

                        // Important: verifying that srcObject exists before attempting to play
                        if (videoRef.current && videoRef.current.srcObject) {
                            return videoRef.current.play();
                        } else {
                            console.warn(`No srcObject after attach for ${name}`);
                            throw new Error("No srcObject after attach");
                        }
                    })
                    .then(() => {
                        console.log(`Video playing for ${name}`);
                        setStreamingStatus("active");
                    })
                    .catch((e) => {
                        console.warn(`Error playing video for ${name}:`, e);

                        // Retry connection
                        if (reconnectCountRef.current < 5) {
                            reconnectCountRef.current++;
                            setTimeout(connectVideo, 500);
                        }
                    });
            } catch (e) {
                console.error(`Error during attach for ${name}:`, e);

                // Retry connection
                if (reconnectCountRef.current < 5) {
                    reconnectCountRef.current++;
                    setTimeout(connectVideo, 500);
                }
            }
        };

        // Start connection process
        connectVideo();

        // Clean up on unmount
        return () => {
            if (videoRef.current && videoTrack?.jitsiTrack) {
                try {
                    videoTrack.jitsiTrack.detach(videoRef.current);
                    console.log(`Video disconnected (cleanup) for ${name}`);
                } catch (e) {
                    console.error(`Error disconnecting video (cleanup) for ${name}:`, e);
                }
            }
        };
    }, [videoTrack, videoEnabled, name]);

    // Monitor track changes
    useEffect(() => {
        if (!videoTrack?.jitsiTrack) return;

        const handleTrackMuteChanged = () => {
            console.log(`Mute state changed for ${name}`);

            // Retry connection if there are issues
            if (videoRef.current && videoTrack.jitsiTrack && videoEnabled) {
                // Indicate reconnection and reset counter
                reconnectCountRef.current = 0;
                setIsVideoAttached(false);

                // Small delay before reconnecting
                setTimeout(() => {
                    if (videoRef.current && videoTrack?.jitsiTrack) {
                        try {
                            videoTrack.jitsiTrack.detach(videoRef.current);
                            setTimeout(() => {
                                try {
                                    videoTrack.jitsiTrack
                                        .attach(videoRef.current)
                                        .then(() => videoRef.current?.play())
                                        .catch((e) =>
                                            console.warn(`Error playing video after mute for ${name}:`, e)
                                        );
                                } catch (e) {
                                    console.error(`Error reconnecting after mute for ${name}:`, e);
                                }
                            }, 50);
                        } catch (e) {
                            console.error(`Error disconnecting after mute for ${name}:`, e);
                        }
                    }
                }, 100);
            }
        };

        // Function to handle streaming status changes
        const handleStreamingStatusChanged = (track, status) => {
            console.log(`Streaming status for ${name}: ${status}`);
            setStreamingStatus(status);

            if (status === "active") {
                // All good, track is active
            } else if (status === "inactive" || status === "interrupted") {
                console.log(`Streaming interrupted for ${name}, attempting to reconnect...`);
                // Retry connection
                handleTrackMuteChanged();
            }
        };

        const track = videoTrack.jitsiTrack;

        // Register listeners
        track.addEventListener("track.mute", handleTrackMuteChanged);
        track.addEventListener("track.unmute", handleTrackMuteChanged);
        track.addEventListener("track.stopped", handleTrackMuteChanged);

        // Verify if this event is available (not always available)
        if (typeof track.addEventListener === "function") {
            track.addEventListener("track_streaming_status_changed", handleStreamingStatusChanged);
        }

        return () => {
            // Remove listeners on unmount
            track.removeEventListener("track.mute", handleTrackMuteChanged);
            track.removeEventListener("track.unmute", handleTrackMuteChanged);
            track.removeEventListener("track.stopped", handleTrackMuteChanged);

            if (typeof track.removeEventListener === "function") {
                track.removeEventListener("track_streaming_status_changed", handleStreamingStatusChanged);
            }
        };
    }, [videoTrack, name, videoEnabled]);

    // Periodic reconnection mechanism for problematic tracks
    useEffect(() => {
        let reconnectInterval: number | undefined;

        if (streamingStatus !== "active" && videoEnabled && videoTrack?.jitsiTrack) {
            console.log(`Setting up periodic reconnection for ${name}`);
            // If video is not active but should be, set up periodic reconnection
            reconnectInterval = window.setInterval(() => {
                console.log(`Attempting periodic reconnection for ${name}`);
                if (videoRef.current && videoTrack?.jitsiTrack) {
                    try {
                        // Forcing a complete reconnection
                        videoTrack.jitsiTrack.detach(videoRef.current);
                        setTimeout(() => {
                            if (videoRef.current && videoTrack?.jitsiTrack) {
                                videoTrack.jitsiTrack
                                    .attach(videoRef.current)
                                    .then(() => videoRef.current?.play())
                                    .catch((e) => console.warn(`Error in periodic reconnection for ${name}:`, e));
                            }
                        }, 50);
                    } catch (e) {
                        console.error(`Error in periodic reconnection for ${name}:`, e);
                    }
                }
            }, 10000); // Attempt every 10 seconds
        }

        return () => {
            if (reconnectInterval) {
                clearInterval(reconnectInterval);
            }
        };
    }, [streamingStatus, videoEnabled, videoTrack, name]);

    return (
        <div
            className={`relative flex aspect-square min-w-40 items-center justify-center rounded-[20px] overflow-hidden bg-gray-90 sm:aspect-video ${className}
            ${dominantSpeaker ? "ring-4 ring-white" : ""}`}
            data-testid={`participant-${id}`}
        >
            <audio ref={audioRef} autoPlay />

            {videoEnabled ? (
                <video
                    ref={videoRef}
                    className={`w-full h-full object-cover ${local ? "flipVideoX" : ""}`}
                    autoPlay
                    playsInline
                    muted={local}
                    loop={false}
                    preload="auto"
                    id={local ? "localVideo_container" : `remoteVideo_${videoTrack?.jitsiTrack?.getId() || ""}`}
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Avatar src={avatarSource} fullName={name ?? ""} className="text-white bg-white/10" diameter={80} />
                </div>
            )}

            {/* Streaming status indicator for debugging */}
            {videoEnabled && streamingStatus !== "active" && (
                <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                    <div className="bg-black/50 text-white px-3 py-2 rounded-lg">Reconnecting video...</div>
                </div>
            )}

            <div className="absolute bottom-2 left-2 px-3 py-2 bg-black/50 flex justify-bedtween items-center space-x-2 rounded-[20px]">
                <div className="text-white truncate max-w-full">
                    {name} {local ? ` (${translate("meet.meeting.videoParticipants.you")})` : ""}
                </div>
                <div className="flex space-x-2 justify-center items-center">
                    {audioMuted && (
                        <div className="text-red-500">
                            <MicrophoneSlash width={18} height={18} color="red" weight="fill" />
                        </div>
                    )}
                    {raisedHand && (
                        <div className="text-yellow">
                            <Hand width={18} height={18} weight="fill" />
                        </div>
                    )}
                    <ConnectionIndicator
                        participantId={id}
                        iconSize={18}
                        enableStatsDisplay={true}
                        alwaysVisible={true}
                        statsPopoverPosition="top"
                    />
                </div>
            </div>
        </div>
    );
};

export default VideoParticipant;

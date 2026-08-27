import React, { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setMeasuredTileViewThumbnailSize } from "../../../../../filmstrip/actions.web";
import { VideoParticipantType } from "../types";
import VideoParticipant from "./VideoParticipant";

export interface VideoGalleryProps {
    participants: VideoParticipantType[];
    flipX?: boolean;
    translate: (key: string) => string;
}

const VideoGallery = ({ participants, flipX, translate }: VideoGalleryProps) => {
    const dispatch = useDispatch();
    const gridRef = useRef<HTMLDivElement>(null);
    const participantsNumber = participants.length;
    const hasOneParticipant = participantsNumber === 1;

    const sortedParticipants = [...participants].sort((a, b) => {
        // Local user first
        if (a.local) return -1;
        if (b.local) return 1;
        // alfabetical order
        return a.name.localeCompare(b.name);
    });

    const getLayout = () => {
        if (hasOneParticipant) {
            return { aspect: "sm:aspect-video", width: "h-full max-w-full" };
        } else if (participantsNumber === 2) {
            // 2 cols x 1 row
            return { aspect: "sm:aspect-[32/9]", width: "w-[calc(50%-5px)]" };
        } else if (participantsNumber <= 4) {
            // 2 cols x 2 rows -> 3 participants wrap to 2 on top, 1 centered below
            return { aspect: "sm:aspect-video", width: "w-[calc(50%-5px)]" };
        } else if (participantsNumber <= 6) {
            // 3 cols x 2 rows
            return { aspect: "sm:aspect-[8/3]", width: "w-[calc(50%-5px)] sm:w-[calc(33.333%-7px)]" };
        } else if (participantsNumber <= 9) {
            // 3 cols x 3 rows
            return { aspect: "sm:aspect-video", width: "w-[calc(50%-5px)] sm:w-[calc(33.333%-7px)]" };
        }
       // 10 (room max capacity) -> 4 cols x 3 rows, last row has 2 centered
        return { aspect: "sm:aspect-[64/27]", width: "w-[calc(50%-5px)] sm:w-[calc(25%-8px)]" };
    };

    const { aspect, width } = getLayout();
    const mobileHeightClass = participantsNumber > 4 ? "max-h-[120px] sm:max-h-none" : "";
    const participantClasses = `relative ${width} ${mobileHeightClass} aspect-square sm:aspect-video`;

    useEffect(() => {
        const grid = gridRef.current;

        if (!grid) {
            return;
        }

        const measure = () => {
            const tile = grid.firstElementChild;

            if (!tile) {
                return;
            }

            const { height, width: tileWidth } = tile.getBoundingClientRect();

            if (height > 0 && tileWidth > 0) {
                dispatch(setMeasuredTileViewThumbnailSize(Math.round(height), Math.round(tileWidth)));
            }
        };

        const observer = new ResizeObserver(measure);

        observer.observe(grid);
        measure();

        return () => observer.disconnect();
    }, [ dispatch, participantsNumber ]);

    return (
        <div className="h-full w-full flex items-center justify-center overflow-hidden bg-gray-950">
            <div
                className={`max-h-[85vh] sm:h-[88%] w-[95%] sm:w-auto ${aspect} sm:max-w-[90%] 
                flex justify-center items-center`}
            >
                <div
                    ref={gridRef}
                    className={`${
                        hasOneParticipant ? "h-full" : ""
                    } w-full flex flex-wrap justify-center items-start content-start gap-2.5`}
                >
                    {sortedParticipants.map((participant) => (
                        <VideoParticipant
                            key={participant.id}
                            participant={participant}
                            className={participantClasses}
                            translate={translate}
                            flipX={flipX}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoGallery;

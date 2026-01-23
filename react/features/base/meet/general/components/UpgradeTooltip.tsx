import { InfoIcon } from "@phosphor-icons/react";
import React, { useCallback, useRef, useState } from "react";

interface UpgradeTooltipProps {
    translate: (key: string) => string;
}

export const UpgradeTooltip: React.FC<UpgradeTooltipProps> = ({ translate }) => {
    const [show, setShow] = useState(false);
    const [position, setPosition] = useState<"right" | "bottom">("right");
    const iconRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = useCallback(() => {
        if (!iconRef.current) return;

        const rect = iconRef.current.getBoundingClientRect();
        const tooltipWidthEstimate = 320;
        const spaceOnRight = window.innerWidth - rect.right;

        setPosition(spaceOnRight < tooltipWidthEstimate ? "bottom" : "right");
        setShow(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setShow(false);
    }, []);

    return (
        <div
            ref={iconRef}
            className="relative flex items-center"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <InfoIcon size={20} className="text-white cursor-pointer" />

            {show && (
                <div
                    className={`absolute z-50 ${
                        position === "right"
                            ? "left-full ml-3 top-1/2 -translate-y-1/2"
                            : "top-full mt-3 left-1/2 -translate-x-1/2"
                    }`}
                >
                    {position === "bottom" && (
                        <div className="flex justify-center">
                            <div className="w-0 h-0 border-l-8 border-l-transparent border-r-8 border-r-transparent border-b-8 border-b-white" />
                        </div>
                    )}

                    <div
                        className={`
              relative bg-white rounded-lg shadow-lg px-4 py-3
              w-max max-w-sm text-sm text-black leading-tight whitespace-pre-line
              ${position === "bottom" ? "mr-[200px]" : ""}
            `}
                    >
                        {position === "right" && (
                            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-r-8 border-r-white" />
                        )}

                        {translate("meet.preMeeting.upgradeMessage")}
                    </div>
                </div>
            )}
        </div>
    );
};

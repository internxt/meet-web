import { Button } from "@internxt/ui";
import React from "react";
import { useSelector } from "react-redux";

import { useUserData } from "../../views/PreMeeting/hooks/useUserData";
import { UpgradeTooltip } from "../components/UpgradeTooltip";
import { getUserTier, isMeetingEnabled } from "../store/meeting/selectors";

interface MeetingButtonProps {
    /**
     * Handler for the new meeting button
     */
    onNewMeeting: () => void;

    /**
     * Translation function
     */
    translate: (key: string) => string;

    /**
     * Whether the new meeting button should be disabled
     */
    loading?: boolean;

    /**
     * Additional CSS class for the button
     */
    className?: string;

    /**
     * Button variant
     */
    variant?: "primary" | "secondary" | "tertiary";

    /**
     * Whether to display the upgrade button
     * @default false
     * */
    displayUpgradeButton?: boolean;

    /**
     * Whether to always display the new meeting button
     * @default false
     * */
    displayNewMeetingButtonAlways?: boolean;
}

const DEFAULT_PROPS = {
    loading: false,
    className: "",
    variant: "primary" as const,
    displayUpgradeButton: false,
    displayNewMeetingButtonAlways: false,
} satisfies Partial<MeetingButtonProps>;

/**
 * Display New Meeting button or upgrade button based on user's meeting feature availability.
 */
export const MeetingButton: React.FC<MeetingButtonProps> = ({
    onNewMeeting,
    translate,
    loading = DEFAULT_PROPS.loading,
    className = DEFAULT_PROPS.className,
    variant = DEFAULT_PROPS.variant,
    displayUpgradeButton = DEFAULT_PROPS.displayUpgradeButton,
    displayNewMeetingButtonAlways = DEFAULT_PROPS.displayNewMeetingButtonAlways,
}) => {
    const isMeetEnabled = useSelector(isMeetingEnabled);
    const userTier = useSelector(getUserTier);
    const userData = useUserData();
    const isLogged = !!userData;

    const isTierLoaded = userTier !== null;
    const shouldShowUpgrade = isLogged && isTierLoaded && !isMeetEnabled && displayUpgradeButton;
    const shouldRenderButton = isLogged || displayNewMeetingButtonAlways;

    if (!shouldRenderButton) {
        return null;
    }

    const isUpgradeMode = shouldShowUpgrade;
    const buttonText = isUpgradeMode ? translate("meet.preMeeting.upgrade") : translate("meet.preMeeting.newMeeting");
    const buttonAction = isUpgradeMode ? () => window.open("https://internxt.com/pricing", "_blank") : onNewMeeting;

    return (
        <div className="flex flex-row items-center space-x-3">
            <Button variant={variant} onClick={buttonAction} disabled={loading} loading={loading} className={className}>
                {buttonText}
            </Button>

            {isUpgradeMode && <UpgradeTooltip translate={translate} />}
        </div>
    );
};

export default MeetingButton;

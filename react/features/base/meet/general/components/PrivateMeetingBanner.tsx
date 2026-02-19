import { XIcon } from "@phosphor-icons/react";
import React from "react";
import { useTranslation } from "react-i18next";

const ShieldLockIcon = () => (
    <svg width="17" height="20" viewBox="0 0 14 17" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M6.66667 16.6667C4.73611 16.1806 3.14236 15.0729 1.88542 13.3437C0.628472 11.6146 0 9.69444 0 7.58333V2.5L6.66667 0L13.3333 2.5V7.58333C13.3333 9.69444 12.7049 11.6146 11.4479 13.3437C10.191 15.0729 8.59722 16.1806 6.66667 16.6667ZM5 11.6667H8.33333C8.56944 11.6667 8.76736 11.5868 8.92708 11.4271C9.08681 11.2674 9.16667 11.0694 9.16667 10.8333V8.33333C9.16667 8.09722 9.08681 7.89931 8.92708 7.73958C8.76736 7.57986 8.56944 7.5 8.33333 7.5V6.66667C8.33333 6.20833 8.17014 5.81597 7.84375 5.48958C7.51736 5.16319 7.125 5 6.66667 5C6.20833 5 5.81597 5.16319 5.48958 5.48958C5.16319 5.81597 5 6.20833 5 6.66667V7.5C4.76389 7.5 4.56597 7.57986 4.40625 7.73958C4.24653 7.89931 4.16667 8.09722 4.16667 8.33333V10.8333C4.16667 11.0694 4.24653 11.2674 4.40625 11.4271C4.56597 11.5868 4.76389 11.6667 5 11.6667ZM5.83333 7.5V6.66667C5.83333 6.43056 5.91319 6.23264 6.07292 6.07292C6.23264 5.91319 6.43056 5.83333 6.66667 5.83333C6.90278 5.83333 7.10069 5.91319 7.26042 6.07292C7.42014 6.23264 7.5 6.43056 7.5 6.66667V7.5H5.83333Z"
            fill="#0066FF"
        />
    </svg>
);

interface PrivateMeetingBannerProps {
    isVisible: boolean;
    onClose: () => void;
}

const PrivateMeetingBanner: React.FC<PrivateMeetingBannerProps> = ({ isVisible, onClose }) => {
    const { t } = useTranslation();

    if (!isVisible) {
        return null;
    }

    return (
        <div className="fixed inset-x-0 top-[72px] min-[920px]:top-4 z-[99] flex justify-center pointer-events-none">
            <div
                className="pointer-events-auto flex min-w-[448px] items-center gap-2 bg-[#E5EEFB] border-[#E5EFFF] rounded-lg shadow-lg p-3"
                role="status"
            >
                <div className="flex-shrink-0">
                    <ShieldLockIcon />
                </div>
                <div className="flex flex-grow flex-col">
                    <span className="text-base font-medium text-[#1C1C1C]">{t("meet.secureMeetingMessage.title")}</span>
                    <span className="text-sm text-[#737373] ">{t("meet.secureMeetingMessage.description")}</span>
                </div>
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 rounded-md hover:bg-gray-80 transition-colors"
                    aria-label={t("dialog.close") ?? "Close"}
                >
                    <XIcon size={20} className="text-[#737373]" />
                </button>
            </div>
        </div>
    );
};

export default PrivateMeetingBanner;

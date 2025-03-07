import { Microphone, VideoCamera } from "@phosphor-icons/react";
import React from "react";
import ReactDOM from "react-dom";

export interface PermissionModalProps {
    translate: (key: string) => string;
    onClickContinueWithoutPermissions: () => void;
    onClose: () => void;
}

const PermissionModal = ({
    translate,
    onClickContinueWithoutPermissions,
    onClose,
}: PermissionModalProps): React.ReactPortal | null => {
    const bodyElement = document.body;

    if (!bodyElement) {
        return null;
    }

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>): void => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const modalContent = (
        <div
            className="fixed inset-0 flex items-center justify-center w-full h-full bg-black/50 z-[9999]"
            onClick={handleBackgroundClick}
        >
            <div className="w-80 rounded-[20px] overflow-hidden bg-black text-white shadow-xl border border-black/15">
                <div className="p-5 text-center">
                    <p className="text-xl text-white font-semibold mb-2 px-1">
                        {translate("meet.permissionsModal.permissionRequired")}
                    </p>
                    <p className="text-gray-300 mb-6">{translate("meet.permissionsModal.joinNotice")}</p>
                    <div className="bg-orange/50 rounded-[20px] p-5 mb-4">
                        <div className="flex justify-center gap-2 mb-4">
                            <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center">
                                <VideoCamera className="text-white" size={24} weight="fill" />
                            </div>
                            <div className="w-12 h-12 bg-white/25 rounded-full flex items-center justify-center">
                                <Microphone className="text-white" size={24} weight="fill" />
                            </div>
                        </div>
                        <p
                            className="text-center text-white text-sm font-normal"
                            dangerouslySetInnerHTML={{
                                __html: translate("meet.permissionsModal.allowInstructions"),
                            }}
                        />
                    </div>
                    <button
                        className="w-full py-3 px-4 bg-white/15 border border-white/20 hover:bg-gray-500 rounded-lg transition-colors"
                        onClick={onClickContinueWithoutPermissions}
                    >
                        {translate("meet.permissionsModal.continueWithoutPermissions")}
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, bodyElement);
};

export default PermissionModal;
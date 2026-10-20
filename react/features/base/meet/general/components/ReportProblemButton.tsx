import { BugIcon } from "@phosphor-icons/react";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useStore } from "react-redux";

import { IReduxState } from "../../../../app/types";
import { showErrorNotification, showSuccessNotification } from "../../../../notifications/actions";
import { NOTIFICATION_TIMEOUT_TYPE } from "../../../../notifications/constants";
import { downloadDebugReport } from "../../debugReport/buildDebugReport";

const LABEL_CLASS = {
    wide: "hidden min-[1440px]:inline",
    default: "hidden sm:inline",
};

interface ReportProblemButtonProps {
    showLabelFrom?: keyof typeof LABEL_CLASS;
}

const ReportProblemButton = ({ showLabelFrom = "default" }: ReportProblemButtonProps) => {
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const store = useStore<IReduxState>();
    const [ isGenerating, setIsGenerating ] = useState(false);
    const label = t("meet.reportProblem.button");

    const onClick = async () => {
        setIsGenerating(true);
        try {
            await downloadDebugReport(store.getState());
            dispatch(showSuccessNotification({
                titleKey: "meet.reportProblem.downloadedTitle",
                descriptionKey: "meet.reportProblem.downloadedDescription",
            }, NOTIFICATION_TIMEOUT_TYPE.LONG));
        } catch (error) {
            console.error("Debug report could not be generated", error);
            dispatch(showErrorNotification({ titleKey: "meet.reportProblem.failedTitle" }, NOTIFICATION_TIMEOUT_TYPE.MEDIUM));
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button
            aria-label={label}
            className="flex flex-row justify-center items-center space-x-2 p-[10px] h-12 bg-black/50 border border-white/10 rounded-2xl text-white disabled:opacity-60"
            data-testid="report-problem-button"
            disabled={isGenerating}
            onClick={onClick}
            title={label}
        >
            <BugIcon size={20} />
            <span className={LABEL_CLASS[showLabelFrom]}>{label}</span>
        </button>
    );
};

export default ReportProblemButton;

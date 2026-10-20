import { CONFERENCE_JOINED, CONFERENCE_LEFT, CONFERENCE_WILL_LEAVE } from "../../conference/actionTypes";
import { getCurrentConference } from "../../conference/functions";
import MiddlewareRegistry from "../../redux/MiddlewareRegistry";

import { downloadDebugReport } from "./buildDebugReport";
import { recordAction } from "./eventTimeline";
import { startLogCapture } from "./logBuffer";
import { ConferenceLike, startMediaSampling, stopMediaSampling } from "./mediaStatsSampler";
import { keepLogsAcrossReloads } from "./previousPage";

startLogCapture();
keepLogsAcrossReloads();

MiddlewareRegistry.register(store => next => action => {
    recordAction(action);

    const result = next(action);

    switch (action.type) {
        case CONFERENCE_JOINED: {
            const conference = getCurrentConference(store.getState());

            if (conference) {
                startMediaSampling(conference as unknown as ConferenceLike);
            }
            break;
        }
        case CONFERENCE_WILL_LEAVE:
        case CONFERENCE_LEFT:
            stopMediaSampling();
            break;
    }

    return result;
});

window.downloadMeetDebugReport = () => downloadDebugReport(APP.store.getState());

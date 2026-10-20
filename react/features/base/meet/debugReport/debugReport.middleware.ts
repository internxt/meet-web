import MiddlewareRegistry from "../../redux/MiddlewareRegistry";

import { downloadDebugReport } from "./buildDebugReport";
import { recordAction } from "./eventTimeline";
import { startLogCapture } from "./logBuffer";

startLogCapture();

MiddlewareRegistry.register(() => next => action => {
    recordAction(action);

    return next(action);
});

window.downloadMeetDebugReport = () => downloadDebugReport(APP.store.getState());

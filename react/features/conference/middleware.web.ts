import i18next from 'i18next';

import { ENDPOINT_MESSAGE_RECEIVED, KICKED_OUT } from '../base/conference/actionTypes';
import { hangup } from '../base/connection/actions.web';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import { openAllowToggleCameraDialog, setCameraFacingMode } from '../base/tracks/actions.web';
import { CAMERA_FACING_MODE_MESSAGE } from '../base/tracks/constants';

import './middleware.any';
import { openDialog } from '../base/dialog/actions';
import { KickoutDuplicate } from '../base/meet/general/components/KickoutDuplicate';

MiddlewareRegistry.register(store => next => action => {
    switch (action.type) {
    case ENDPOINT_MESSAGE_RECEIVED: {
        const { participant, data } = action;

        if (data?.name === CAMERA_FACING_MODE_MESSAGE) {
            APP.store.dispatch(openAllowToggleCameraDialog(
                /* onAllow */ () => APP.store.dispatch(setCameraFacingMode(data.facingMode)),
                /* initiatorId */ participant.getId()
            ));
        }
        break;
    }

    case KICKED_OUT: {
        const { dispatch, getState } = store;
        const { room } = getState()["features/base/conference"];

        // we need to first finish dispatching or the notification can be cleared out
        const result = next(action);

        const roomId = room ?? "";

        dispatch(openDialog('KickoutDuplicate', KickoutDuplicate, {
            title: i18next.t("dialog.kickDuplicateTitle"),
            message: i18next.t("dialog.kickDuplicateMessage")
        }));

        dispatch(hangup(true,roomId));

        return result;
    }
    }

    return next(action);
});

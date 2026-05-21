import { IStore } from '../../../../app/types';
import { showWarningNotification } from '../../../../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../../../../notifications/constants';

export const showKickoutDuplicateNotification = (dispatch: IStore['dispatch']) => {
    dispatch(
        showWarningNotification(
            {
                titleKey: 'dialog.kickDuplicateTitle',
                descriptionKey: 'dialog.kickDuplicateMessage',
            },
            NOTIFICATION_TIMEOUT_TYPE.STICKY
        )
    );
};
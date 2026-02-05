import { AnyAction } from 'redux';
import { IStore } from '../../../../app/types';
import { hideNotification } from '../../../../notifications/actions';
import { CONFERENCE_JOINED, CONFERENCE_WILL_LEAVE } from '../../../conference/actionTypes';
import { getLocalParticipant } from '../../../participants/functions';
import MiddlewareRegistry from '../../../redux/MiddlewareRegistry';

const POOR_CONNECTION_NOTIFICATION_ID = 'connection.poor';

let isNotificationCurrentlyShown = false;
let isSubscribedToStats = false;


const hidePoorConnectionWarning = (store: IStore) => {
    if (!isNotificationCurrentlyShown) {
        return;
    }

    store.dispatch(hideNotification(POOR_CONNECTION_NOTIFICATION_ID));
    isNotificationCurrentlyShown = false;
};



MiddlewareRegistry.register((store: IStore) => (next) => (action: AnyAction) => {
    const result = next(action);

    switch (action.type) {
        case CONFERENCE_JOINED: {
            const state = store.getState();
            const localParticipant = getLocalParticipant(state);

            if (!localParticipant) {
                break;
            }

            isNotificationCurrentlyShown = false;

            if (localParticipant.id && !isSubscribedToStats) {
                isSubscribedToStats = true;
            }

            break;
        }

        case CONFERENCE_WILL_LEAVE: {
            // User manually hung up - hide notification and reset state
            hidePoorConnectionWarning(store);
            isNotificationCurrentlyShown = false;
            break;
        }
    }

    return result;
});

export default {};

import { IStore } from '../app/types';
import { APP_WILL_MOUNT, APP_WILL_UNMOUNT } from '../base/app/actionTypes';
import { CONFERENCE_JOINED } from '../base/conference/actionTypes';
import { getCurrentConference } from '../base/conference/functions';
import { openDialog } from '../base/dialog/actions';
import { JitsiConferenceEvents } from '../base/lib-jitsi-meet';
import { ConfigService } from "../base/meet/services/config.service";
import ParticipantVerificationSASDialog from '../base/meet/views/Conference/components/ParticipantVerificationSASDialog';
import { showNotification, showWarningNotification } from '../notifications/actions';
import { NOTIFICATION_TIMEOUT_TYPE } from '../notifications/constants';

import { PARTICIPANT_JOINED, PARTICIPANT_LEFT } from '../base/participants/actionTypes';
import { participantUpdated } from '../base/participants/actions';
import {
    getLocalParticipant,
    getParticipantById,
    isScreenShareParticipant
} from '../base/participants/functions';
import MiddlewareRegistry from '../base/redux/MiddlewareRegistry';
import StateListenerRegistry from '../base/redux/StateListenerRegistry';
import { playSound } from '../base/sounds/actions';

import { PARTICIPANT_VERIFIED, SET_MEDIA_ENCRYPTION_KEY, START_VERIFICATION, TOGGLE_E2EE } from './actionTypes';
import { setE2EEMaxMode, toggleE2EE } from './actions';
import { E2EE_OFF_SOUND_ID, E2EE_ON_SOUND_ID, MAX_MODE } from './constants';
import {
    isMaxModeReached,
    isMaxModeThresholdReached,
    registerE2eeAudioFiles,
    unregisterE2eeAudioFiles
} from './functions';
import logger from './logger';

/**
 * Middleware that captures actions related to E2EE.
 *
 * @param {Store} store - The redux store.
 * @returns {Function}
 */
MiddlewareRegistry.register(({ dispatch, getState }) => next => action => {
    const conference = getCurrentConference(getState);

    switch (action.type) {
    case APP_WILL_MOUNT:
        registerE2eeAudioFiles(dispatch);
        break;

    case APP_WILL_UNMOUNT:
        unregisterE2eeAudioFiles(dispatch);
        break;

    case CONFERENCE_JOINED:
        _updateMaxMode(dispatch, getState);

        break;

    case PARTICIPANT_JOINED: {
        const result = next(action);

        if (!isScreenShareParticipant(action.participant) && !action.participant.local) {
            _updateMaxMode(dispatch, getState);
        }

        return result;
    }

    case PARTICIPANT_LEFT: {
        const participant = getParticipantById(getState(), action.participant?.id);
        const result = next(action);

        if (!isScreenShareParticipant(participant)) {
            _updateMaxMode(dispatch, getState);
        }

        return result;
    }

    case TOGGLE_E2EE: {
        if (conference?.isE2EESupported() && conference.isE2EEEnabled() !== action.enabled) {
            logger.debug(`E2EE will be ${action.enabled ? 'enabled' : 'disabled'}`);
            conference.toggleE2EE(action.enabled);

            // Broadcast that we enabled / disabled E2EE.
            const participant = getLocalParticipant(getState);

            dispatch(participantUpdated({
                e2eeEnabled: action.enabled,
                id: participant?.id ?? '',
                local: true
            }));

            const soundID = action.enabled ? E2EE_ON_SOUND_ID : E2EE_OFF_SOUND_ID;

            dispatch(playSound(soundID));
        }

        break;
    }

    case SET_MEDIA_ENCRYPTION_KEY: {
        if (conference?.isE2EESupported()) {
            const { exportedKey, index } = action.keyInfo;

            if (exportedKey) {
                window.crypto.subtle.importKey(
                    'raw',
                    new Uint8Array(exportedKey),
                    'AES-GCM',
                    false,
                    [ 'encrypt', 'decrypt' ])
                .then(
                    encryptionKey => {
                        conference.setMediaEncryptionKey({
                            encryptionKey,
                            index
                        });
                    })
                .catch(error => logger.error('SET_MEDIA_ENCRYPTION_KEY error', error));
            } else {
                conference.setMediaEncryptionKey({
                    encryptionKey: false,
                    index
                });
            }
        }

        break;
    }

    case PARTICIPANT_VERIFIED: {
        const { isVerified, pId } = action;

        conference?.markParticipantVerified(pId, isVerified);
        break;
    }

    case START_VERIFICATION: {
        conference?.startVerification(action.pId);
        break;
    }
    }

    return next(action);
});

/**
 * Stored E2EE event handler references for cleanup.
 */
let e2eeHandlerRefs: {
    conference: any;
    handlers: Map<string, Function>;
} | null = null;

/**
 * Set up state change listener to perform maintenance tasks when the conference
 * is left or failed.
 */
StateListenerRegistry.register(
    (state) => getCurrentConference(state),
    (conference, { dispatch }, previousConference) => {
        if (previousConference && e2eeHandlerRefs?.conference === previousConference) {
            console.log("[E2EE] Conference changed - cleaning up previous conference");

            // CRITICAL: Call E2EE cleanup from lib-jitsi-meet
            if (typeof previousConference.cleanUpWebWorkers === "function") {
                console.log("[E2EE] Calling cleanUpWebWorkers() to terminate E2EE worker");
                previousConference.cleanUpWebWorkers();
            } else {
                console.warn("[E2EE] cleanUpWebWorkers() not available on previous conference");
            }

            // Remove all stored event handlers to prevent memory leaks
            if (e2eeHandlerRefs) {
                console.log(`[E2EE] Removing ${e2eeHandlerRefs.handlers.size} event handlers`);
                for (const [event, handler] of e2eeHandlerRefs.handlers) {
                    previousConference.off(event, handler);
                }
            }

            e2eeHandlerRefs = null;
        }

        if (conference) {
            console.log("[E2EE] Setting up E2EE handlers for new conference");
            const handlers = new Map<string, Function>();

            // E2EE_SAS_AVAILABLE handler
            const sasAvailableHandler = (sas: object) => {
                if (ConfigService.instance.isDevelopment()) {
                    dispatch(openDialog('ParticipantVerificationDialog', ParticipantVerificationSASDialog, { sas }));
                }
            };
            handlers.set(JitsiConferenceEvents.E2EE_SAS_AVAILABLE, sasAvailableHandler);
            conference.on(JitsiConferenceEvents.E2EE_SAS_AVAILABLE, sasAvailableHandler);

            // E2EE_KEY_SYNC_FAILED handler
            const keySyncFailedHandler = () => {
                dispatch(showWarningNotification({
                    titleKey: 'notify.encryptionKeySyncFailedTitle',
                    descriptionKey: 'notify.encryptionKeySyncFailed'
                }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            };
            handlers.set(JitsiConferenceEvents.E2EE_KEY_SYNC_FAILED, keySyncFailedHandler);
            conference.on(JitsiConferenceEvents.E2EE_KEY_SYNC_FAILED, keySyncFailedHandler);

            // E2EE_VERIFICATION_READY handler
            const verificationReadyHandler = (pId: string, sas: object) => {
                dispatch(openDialog('ParticipantVerificationDialog', ParticipantVerificationSASDialog, { pId, sas }));
            };
            handlers.set(JitsiConferenceEvents.E2EE_VERIFICATION_READY, verificationReadyHandler);
            conference.on(JitsiConferenceEvents.E2EE_VERIFICATION_READY, verificationReadyHandler);

            // E2EE_CRYPTO_FAILED handler
            const cryptoFailedHandler = () => {
                dispatch(showWarningNotification({
                    titleKey: 'notify.cryptoFailedTitle',
                    descriptionKey: 'notify.cryptoFailed'
                }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            };
            handlers.set(JitsiConferenceEvents.E2EE_CRYPTO_FAILED, cryptoFailedHandler);
            conference.on(JitsiConferenceEvents.E2EE_CRYPTO_FAILED, cryptoFailedHandler);

            // E2EE_KEY_SYNC_AFTER_TIMEOUT handler
            const keySyncAfterTimeoutHandler = () => {
                dispatch(showNotification({
                    titleKey: 'notify.encryptionKeySyncRestoredTitle',
                    descriptionKey: 'notify.encryptionKeySyncRestored'
                }, NOTIFICATION_TIMEOUT_TYPE.STICKY));
            };
            handlers.set(JitsiConferenceEvents.E2EE_KEY_SYNC_AFTER_TIMEOUT, keySyncAfterTimeoutHandler);
            conference.on(JitsiConferenceEvents.E2EE_KEY_SYNC_AFTER_TIMEOUT, keySyncAfterTimeoutHandler);

            // Store references for cleanup
            e2eeHandlerRefs = { conference, handlers };
            console.log(`[E2EE] Successfully registered ${handlers.size} E2EE event handlers`);
        }
    }
);

/**
 * Sets the maxMode based on the number of participants in the conference.
 *
 * @param { Dispatch<any>} dispatch - The redux dispatch function.
 * @param {Function|Object} getState - The {@code getState} function.
 * @private
 * @returns {void}
 */
function _updateMaxMode(dispatch: IStore['dispatch'], getState: IStore['getState']) {
    const state = getState();

    const { e2ee = {} } = state['features/base/config'];

    if (e2ee.externallyManagedKey) {
        return;
    }

    const { maxMode, enabled } = state['features/e2ee'];
    const isMaxModeThresholdReachedValue = isMaxModeThresholdReached(state);
    let newMaxMode: string;

    if (isMaxModeThresholdReachedValue) {
        newMaxMode = MAX_MODE.THRESHOLD_EXCEEDED;
    } else if (isMaxModeReached(state)) {
        newMaxMode = MAX_MODE.ENABLED;
    } else {
        newMaxMode = MAX_MODE.DISABLED;
    }

    if (maxMode !== newMaxMode) {
        dispatch(setE2EEMaxMode(newMaxMode));
    }

    if (isMaxModeThresholdReachedValue && !enabled) {
        dispatch(toggleE2EE(false));
    }
}

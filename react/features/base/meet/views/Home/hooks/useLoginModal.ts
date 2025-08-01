import { useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";

import { get8x8BetaJWT } from "../../../../connection/options8x8";
import { loginSuccess } from "../../../general/store/auth/actions";
import { setRoomID } from "../../../general/store/errors/actions";
import { useLocalStorage } from "../../../LocalStorageManager";
import { AuthService } from "../../../services/auth.service";
import { LoginCredentials } from "../../../services/types/command.types";
import { AuthFormValues } from "../types";

interface UseAuthModalProps {
    onClose: () => void;
    onLogin?: (token: string) => void;
    translate: (key: string) => string;
}

export function useLoginModal({ onClose, onLogin, translate }: UseAuthModalProps) {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [showTwoFactor, setShowTwoFactor] = useState(false);
    const [loginError, setLoginError] = useState("");

    const storageManager = useLocalStorage();
    const dispatch = useDispatch();

    const {
        register,
        formState: { errors },
        handleSubmit,
        reset,
        watch,
    } = useForm<AuthFormValues>({
        mode: "onChange",
    });

    const twoFactorCode = watch("twoFactorCode", "");

    const resetState = useCallback(() => {
        reset();
        setShowTwoFactor(false);
        setLoginError("");
    }, [reset]);

    const handleLogin = async (formData: AuthFormValues) => {
        setIsLoggingIn(true);
        setLoginError("");

        const { email, password, twoFactorCode: formTwoFactorCode } = formData;
        const currentTwoFactorCode = formTwoFactorCode || "";

        try {
            await processLogin(email, password, currentTwoFactorCode);
        } catch (err: unknown) {
            handleLoginError(err);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const authenticateUser = useCallback(
        async (email: string, password: string, twoFactorCode: string) => {
            try {
                return await AuthService.instance.doLogin(email, password, twoFactorCode);
            } catch (err) {
                throw new Error(translate("meet.auth.modal.error.invalidCredentials"));
            }
        },
        [translate]
    );

    const createMeetToken = useCallback(
        async (token: string) => {
            try {
                return await get8x8BetaJWT(token);
            } catch (err) {
                throw new Error(translate("meet.auth.modal.error.cannotCreateMeetings"));
            }
        },
        [translate]
    );

    const saveUserSession = useCallback(
        (credentials: LoginCredentials) => {
            storageManager.saveCredentials(
                credentials.token,
                credentials.newToken,
                credentials.mnemonic,
                credentials.user
            );
            dispatch(loginSuccess(credentials));
            onLogin?.(credentials.newToken);
        },
        [storageManager, onLogin, dispatch]
    );

    const saveRoomId = useCallback(
        (roomID: string) => {
            dispatch(setRoomID(roomID));
        },
        [dispatch]
    );

    const processLogin = async (email: string, password: string, twoFactorCode: string) => {
        if (!showTwoFactor) {
            const is2FANeeded = await AuthService.instance.is2FANeeded(email);

            if (is2FANeeded && !showTwoFactor) {
                setShowTwoFactor(true);
                return;
            }
        }

        const loginCredentials = await authenticateUser(email, password, twoFactorCode);

        if (!loginCredentials?.newToken || !loginCredentials?.user) {
            throw new Error(translate("meet.auth.modal.error.invalidCredentials"));
        }

        // TODO: NEED TO SAVE MEET ROOM TO COMPLETE LOGIN AND REDIRECT TO SCHEDULE MODAL FLOW
        // saveRoomId(meetData.room);
        saveUserSession(loginCredentials);

        onClose();
    };

    const handleLoginError = useCallback(
        (err: unknown) => {
            if (err instanceof Error) {
                setLoginError(err.message);
            } else {
                setLoginError(translate("meet.auth.modal.error.genericError"));
            }
        },
        [translate]
    );

    return {
        isLoggingIn,
        showTwoFactor,
        loginError,
        register,
        errors,
        handleSubmit,
        handleLogin,
        resetState,
        twoFactorCode,
    };
}

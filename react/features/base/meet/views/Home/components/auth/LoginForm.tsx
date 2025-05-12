import { Button } from "@internxt/ui";
import React from "react";
import { useForm } from "react-hook-form";
import { AuthFormValues } from "../../types";

import { ErrorMessage } from "../../../../general/components/ErrorMessage";
import PasswordInput from "./PasswordInput";
import TextInput from "./TextInput";

interface LoginFormProps {
    onSubmit: (data: AuthFormValues) => void;
    isLoggingIn: boolean;
    loginError: string;
    translate: (key: string) => string;
    showTwoFactor: boolean;
}

export const LoginForm: React.FC<LoginFormProps> = ({
    onSubmit,
    isLoggingIn,
    loginError,
    translate,
    showTwoFactor,
}) => {
    const {
        register,
        formState: { errors, isSubmitted },
        handleSubmit,
    } = useForm<AuthFormValues>({
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
                <TextInput
                    label="email"
                    type="email"
                    placeholder={translate("meet.auth.modal.emailPlaceholder")}
                    register={register}
                    error={isSubmitted ? errors.email : undefined}
                    required
                    disabled={showTwoFactor}
                    minLength={{
                        value: 1,
                        message: translate("meet.auth.modal.error.emailEmpty"),
                    }}
                    pattern={{
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: translate("meet.auth.modal.error.emailInvalid"),
                    }}
                    autoComplete="email"
                />

                <PasswordInput
                    label="password"
                    placeholder={translate("meet.auth.modal.passwordPlaceholder")}
                    register={register}
                    error={isSubmitted ? errors.password : undefined}
                    required
                    minLength={{
                        value: 1,
                        message: translate("meet.auth.modal.error.passwordEmpty"),
                    }}
                    autoComplete="current-password"
                />

                {showTwoFactor && (
                    <PasswordInput
                        label="twoFactorCode"
                        placeholder={translate("meet.auth.modal.twoFactorCodePlaceholder")}
                        register={register}
                        error={isSubmitted ? errors.twoFactorCode : undefined}
                        required
                        autoComplete="one-time-code"
                    />
                )}

                {loginError && <ErrorMessage message={loginError} />}

                <Button type="submit" className="flex w-full" loading={isLoggingIn} disabled={isLoggingIn}>
                    {isLoggingIn ? translate("meet.auth.modal.decrypting") : translate("meet.auth.modal.loginButton")}
                </Button>
            </div>
        </form>
    );
};
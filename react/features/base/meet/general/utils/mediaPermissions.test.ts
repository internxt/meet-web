import { describe, expect, it, vi } from "vitest";
import { shouldShowPermissionsModal } from "./mediaPermissions";

vi.mock("../../../lib-jitsi-meet", () => ({
    JitsiTrackErrors: {
        PERMISSION_DENIED: "gum.permission_denied",
        SCREENSHARING_USER_CANCELED: "gum.screensharing_user_canceled",
    },
}));

describe("shouldShowPermissionsModal", () => {
    describe("Camera and microphone", () => {
        it("When the browser denied the permission, then it should show the permissions modal", () => {
            expect(shouldShowPermissionsModal({ name: "gum.permission_denied" }, false)).toBe(true);
            expect(shouldShowPermissionsModal({ name: "NotAllowedError" }, false)).toBe(true);
        });

        it.each([
            ["the device is not found", "gum.not_found"],
            ["the device is in use by another tab or app", "gum.general"],
            ["the device does not meet the constraints", "gum.constraint_failed"],
            ["getting the device times out", "gum.timeout"],
        ])("When %s, then it should not show the permissions modal", (_, name) => {
            expect(shouldShowPermissionsModal({ name, message: "Requested device(s) was/were not found" }, false)).toBe(
                false
            );
        });
    });

    describe("Screen sharing", () => {
        it.each([
            ["the user cancels the screen picker", { name: "gum.screensharing_user_canceled" }],
            ["the browser rejects the selection", { name: "NotAllowedError" }],
            ["the error message says it was cancelled", { name: "gum.general", message: "Selection cancelled" }],
        ])("When %s, then it should not show the permissions modal", (_, error) => {
            expect(shouldShowPermissionsModal(error, true)).toBe(false);
        });

        it("When screen sharing fails for another reason, then it should show the permissions modal", () => {
            expect(shouldShowPermissionsModal({ name: "gum.general", message: "Could not start" }, true)).toBe(true);
        });
    });
});

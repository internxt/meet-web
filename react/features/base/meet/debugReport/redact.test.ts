import { describe, expect, it } from "vitest";
import { redact, redactText } from "./redact";

describe("redact", () => {
    it("When a log contains a JWT, then it should remove it", () => {
        const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0In0.c2lnbmF0dXJl";

        expect(redactText(`Connecting with token ${jwt}`)).toBe("Connecting with token [jwt]");
    });

    it("When a log contains TURN credentials, then it should remove them", () => {
        const text = '{"type":"turn","host":"turn.jitsi.net","password":"NcEoUk3B+eRxq=","username":"1792580828"}';

        expect(redactText(text)).toBe('{"type":"turn","host":"turn.jitsi.net","password":"[redacted]","username":"[redacted]"}');
    });

    it("When a log contains a bearer token or a token in a URL, then it should remove it", () => {
        expect(redactText("Authorization: Bearer abc.def-ghi")).toBe("Authorization: Bearer [redacted]");
        expect(redactText("wss://host/xmpp-websocket?room=a&token=abc123")).toBe("wss://host/xmpp-websocket?room=a&token=[redacted]");
    });

    it("When a log contains SDP ICE credentials, then it should remove them", () => {
        expect(redactText("a=ice-ufrag:8hhY\r\na=ice-pwd:asd88fgpdd777uzjYhagZg")).toBe(
            "a=ice-ufrag:[redacted]\r\na=ice-pwd:[redacted]",
        );
    });

    it("When a log contains an email, then it should remove it", () => {
        expect(redactText("Joined as xavi@internxt.com")).toBe("Joined as [email]");
    });

    it("When an object has secret fields, then it should remove their values and keep the rest", () => {
        const report = {
            conference: { room: "abc", jwt: "secret", e2ee: { enabled: true, olmKey: [ 1, 2, 3 ] } },
            turn: [ { username: "u", credential: "c", host: "turn.jitsi.net" } ],
            empty: { password: "" },
        };

        expect(redact(report)).toEqual({
            conference: { room: "abc", jwt: "[redacted]", e2ee: { enabled: true, olmKey: "[redacted]" } },
            turn: [ { username: "[redacted]", credential: "[redacted]", host: "turn.jitsi.net" } ],
            empty: { password: "" },
        });
    });

    it("When the value is not a string or an object, then it should keep it", () => {
        expect(redact(42)).toBe(42);
        expect(redact(null)).toBeNull();
        expect(redact(undefined)).toBeUndefined();
    });
});

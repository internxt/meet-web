const REDACTED = "[redacted]";

const SECRET_KEY = /(password|passwd|credential|secret|token|jwt|authorization|apikey|api_key|olmkey|pqkey|privatekey|sessionkey|key_?material|ice_?ufrag|ice_?pwd|username)$/i;

const TEXT_PATTERNS: [RegExp, string][] = [
    [ /eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jwt]" ],
    [ /(bearer\s+)[\w\-.~+/]+=*/gi, `$1${REDACTED}` ],
    [
        /((?:password|passwd|credential|secret|token|jwt|username|olmKey|pqKey|ice-pwd|ice-ufrag)["']?\s*[:=]\s*["']?)[^"'&\s,}]+/gi,
        `$1${REDACTED}`,
    ],
    [ /(a=ice-(?:pwd|ufrag):)\S+/g, `$1${REDACTED}` ],
    [ /(?<![\w.+-])[\w.+-]{1,64}@[\w-]{1,63}\.[\w.-]{1,63}/g, "[email]" ],
];

export const redactText = (text: string): string =>
    TEXT_PATTERNS.reduce((result, [ pattern, replacement ]) => result.replace(pattern, replacement), text);

export const redact = (value: unknown, depth = 0): unknown => {
    if (typeof value === "string") {
        return redactText(value);
    }
    if (value === null || typeof value !== "object") {
        return value;
    }
    if (depth > 12) {
        return "[too deep]";
    }
    if (Array.isArray(value)) {
        return value.map(item => redact(item, depth + 1));
    }

    return Object.fromEntries(
        Object.entries(value).map(([ key, item ]) => [
            key,
            SECRET_KEY.test(key) && item !== null && item !== undefined && item !== "" ? REDACTED : redact(item, depth + 1),
        ]),
    );
};

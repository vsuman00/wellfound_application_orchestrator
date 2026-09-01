const API_KEY_PATTERN = /\bsk-(?:proj-)?[A-Za-z0-9_-]{10,}\b/g;
const BEARER_PATTERN = /Bearer\s+[^\s,;]+/gi;
const COOKIE_PATTERN = /Cookie:\s*[^\r\n]+/gi;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

export interface RedactionOptions {
  readonly secrets?: readonly string[];
}

export function redactText(input: string, options: RedactionOptions = {}): string {
  let redacted = input;

  for (const secret of [...(options.secrets ?? [])]
    .filter((value) => value.length > 0)
    .sort((left, right) => right.length - left.length)) {
    redacted = redacted.split(secret).join("[REDACTED]");
  }

  return redacted
    .replace(COOKIE_PATTERN, "Cookie: [REDACTED_COOKIE]")
    .replace(BEARER_PATTERN, "[REDACTED_TOKEN]")
    .replace(API_KEY_PATTERN, "[REDACTED_SECRET]")
    .replace(EMAIL_PATTERN, "[REDACTED_EMAIL]");
}

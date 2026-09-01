import { describe, expect, it } from "vitest";
import { redactText } from "../../src/security/redactor.js";

describe("redactText", () => {
  it("redacts explicit secrets, emails, bearer tokens, and cookies", () => {
    const input =
      "Alice Candidate <alice@example.com> token=sk-proj-1234567890abcdef " +
      "Authorization: Bearer abc.def.ghi Cookie: session=private-value";

    expect(redactText(input, { secrets: ["Alice Candidate"] })).toBe(
      "[REDACTED] <[REDACTED_EMAIL]> token=[REDACTED_SECRET] " +
      "Authorization: [REDACTED_TOKEN] Cookie: [REDACTED_COOKIE]"
    );
  });

  it("leaves ordinary non-sensitive text intact", () => {
    expect(redactText("Job title: Software Engineer at Example Labs.")).toBe(
      "Job title: Software Engineer at Example Labs."
    );
  });

  it("redacts phone-like candidate data when supplied explicitly", () => {
    expect(redactText("Call +91 98765 43210", { secrets: ["+91 98765 43210"] })).toBe(
      "Call [REDACTED]"
    );
  });
});

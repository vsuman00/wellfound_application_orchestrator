import { describe, expect, it } from "vitest";
import {
  defaultConfig,
  validateConfig,
  type AppConfig
} from "../../src/config/schema.js";
import { assertOutsideRepository, resolveRuntimePaths } from "../../src/config/paths.js";

describe("validateConfig", () => {
  it("returns safe defaults when no configuration is supplied", () => {
    expect(validateConfig(undefined)).toEqual({ ok: true, value: defaultConfig });
    expect(defaultConfig.scheduledMode).toBe("draft-only");
    expect(defaultConfig.liveMode).toBe("approval-required");
  });

  it("merges validated operational settings with safe defaults", () => {
    const result = validateConfig({
      timezone: "Asia/Kolkata",
      quotas: { perRun: 5, perDay: 20 },
      credentialRefs: { openAiApiKeyEnv: "WELFOUN D_API_KEY" }
    });

    expect(result).toEqual({
      ok: false,
      errors: ["credentialRefs.openAiApiKeyEnv must be a valid environment variable name."]
    });

    const valid = validateConfig({
      timezone: "Asia/Kolkata",
      quotas: { perRun: 5, perDay: 20 },
      credentialRefs: { openAiApiKeyEnv: "WELLFOUND_API_KEY" }
    });

    expect(valid.ok).toBe(true);
    if (valid.ok) {
      expect(valid.value).toMatchObject({
        timezone: "Asia/Kolkata",
        scheduledMode: "draft-only",
        liveMode: "approval-required",
        quotas: { perRun: 5, perDay: 20 },
        credentialRefs: { openAiApiKeyEnv: "WELLFOUND_API_KEY" }
      });
    }
  });

  it("rejects invalid timezone, unsafe mode, quota, raw key, and unknown fields", () => {
    const result = validateConfig({
      timezone: "Not/A_Timezone",
      scheduledMode: "policy-constrained",
      quotas: { perRun: 0, perDay: -1 },
      openAiApiKey: "sk-proj-not-a-config-value",
      unexpected: true
    });

    expect(result).toEqual({
      ok: false,
      errors: [
        "Unknown configuration field: unexpected.",
        "timezone must be a valid IANA timezone.",
        "scheduledMode policy-constrained is reserved for a later approved gate.",
        "quotas.perRun must be a positive integer.",
        "quotas.perDay must be a positive integer.",
        "Raw API keys are not accepted; use credentialRefs.openAiApiKeyEnv."
      ]
    });
  });
});

describe("resolveRuntimePaths", () => {
  it("uses a stable user-data root outside a project directory", () => {
    const paths = resolveRuntimePaths("/Users/example");

    expect(paths).toEqual({
      root: "/Users/example/.wellfound-application-orchestrator",
      browserProfile: "/Users/example/.wellfound-application-orchestrator/browser-profile",
      database: "/Users/example/.wellfound-application-orchestrator/state.sqlite3",
      logs: "/Users/example/.wellfound-application-orchestrator/logs",
      backups: "/Users/example/.wellfound-application-orchestrator/backups"
    });
  });

  it("returns a type that can be passed around without personal data", () => {
    const config: AppConfig = defaultConfig;
    expect(config).not.toHaveProperty("candidate");
  });

  it("rejects a runtime root that would overlap the repository", () => {
    const paths = resolveRuntimePaths("/Users/example/project");

    expect(() => assertOutsideRepository(paths, "/Users/example/project")).toThrow(
      "Runtime path root must be outside the repository."
    );
    expect(() => assertOutsideRepository(resolveRuntimePaths("/Users/example"), "/Users/example/project")).not.toThrow();
  });
});

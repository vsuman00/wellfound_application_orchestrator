export type ScheduledMode = "scan-only" | "draft-only";
export type LiveMode = "approval-required";

export interface AppConfig {
  readonly version: 1;
  readonly timezone: string;
  readonly scheduledMode: ScheduledMode;
  readonly liveMode: LiveMode;
  readonly quotas: {
    readonly perRun: number;
    readonly perDay: number;
  };
  readonly credentialRefs: {
    readonly openAiApiKeyEnv?: string;
  };
}

export type ConfigResult =
  | { readonly ok: true; readonly value: AppConfig }
  | { readonly ok: false; readonly errors: readonly string[] };

export const defaultConfig: AppConfig = {
  version: 1,
  timezone: "UTC",
  scheduledMode: "draft-only",
  liveMode: "approval-required",
  quotas: { perRun: 10, perDay: 50 },
  credentialRefs: {}
};

const allowedFields = new Set([
  "version",
  "timezone",
  "scheduledMode",
  "liveMode",
  "quotas",
  "credentialRefs",
  "openAiApiKey"
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isValidTimezone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) {
    return false;
  }

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}

export function validateConfig(input: unknown): ConfigResult {
  if (input === undefined) {
    return { ok: true, value: defaultConfig };
  }

  if (!isRecord(input)) {
    return { ok: false, errors: ["Configuration must be a JSON object."] };
  }

  const errors: string[] = [];
  for (const key of Object.keys(input)) {
    if (!allowedFields.has(key)) {
      errors.push(`Unknown configuration field: ${key}.`);
    }
  }

  const timezone = input.timezone ?? defaultConfig.timezone;
  if (!isValidTimezone(timezone)) {
    errors.push("timezone must be a valid IANA timezone.");
  }

  const scheduledMode = input.scheduledMode ?? defaultConfig.scheduledMode;
  if (scheduledMode === "policy-constrained") {
    errors.push("scheduledMode policy-constrained is reserved for a later approved gate.");
  } else if (scheduledMode !== "scan-only" && scheduledMode !== "draft-only") {
    errors.push("scheduledMode must be scan-only or draft-only.");
  }

  const liveMode = input.liveMode ?? defaultConfig.liveMode;
  if (liveMode !== "approval-required") {
    errors.push("liveMode must remain approval-required until a later approved gate.");
  }

  const quotasInput = input.quotas;
  let perRun: unknown = defaultConfig.quotas.perRun;
  let perDay: unknown = defaultConfig.quotas.perDay;
  if (quotasInput !== undefined) {
    if (!isRecord(quotasInput)) {
      errors.push("quotas must be an object.");
    } else {
      perRun = quotasInput.perRun ?? perRun;
      perDay = quotasInput.perDay ?? perDay;
    }
  }
  if (!isPositiveInteger(perRun)) {
    errors.push("quotas.perRun must be a positive integer.");
  }
  if (!isPositiveInteger(perDay)) {
    errors.push("quotas.perDay must be a positive integer.");
  }

  let openAiApiKeyEnv: string | undefined;
  if (input.credentialRefs !== undefined) {
    if (!isRecord(input.credentialRefs)) {
      errors.push("credentialRefs must be an object.");
    } else if (input.credentialRefs.openAiApiKeyEnv !== undefined) {
      if (
        typeof input.credentialRefs.openAiApiKeyEnv !== "string" ||
        !/^[A-Z_][A-Z0-9_]*$/.test(input.credentialRefs.openAiApiKeyEnv)
      ) {
        errors.push("credentialRefs.openAiApiKeyEnv must be a valid environment variable name.");
      } else {
        openAiApiKeyEnv = input.credentialRefs.openAiApiKeyEnv;
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(input, "openAiApiKey")) {
    errors.push("Raw API keys are not accepted; use credentialRefs.openAiApiKeyEnv.");
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      version: 1,
      timezone: timezone as string,
      scheduledMode: scheduledMode as ScheduledMode,
      liveMode: liveMode as LiveMode,
      quotas: { perRun: perRun as number, perDay: perDay as number },
      credentialRefs: openAiApiKeyEnv === undefined ? {} : { openAiApiKeyEnv }
    }
  };
}

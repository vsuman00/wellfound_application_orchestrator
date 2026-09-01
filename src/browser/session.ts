import { access, mkdir } from "node:fs/promises";
import { constants } from "node:fs";
import { chromium, type BrowserContext } from "playwright";

export type SessionHealth = "ready" | "logged-out" | "verification-required" | "locked" | "corrupt";

export interface SessionHealthInput {
  readonly profileExists: boolean;
  readonly loggedIn: boolean;
  readonly verificationRequired: boolean;
  readonly lockDetected: boolean;
  readonly corrupt: boolean;
}

export interface ManagedSessionOptions {
  readonly profileDirectory: string;
  readonly headless?: boolean;
}

export function classifySessionHealth(input: SessionHealthInput): SessionHealth {
  if (input.corrupt) {
    return "corrupt";
  }
  if (input.lockDetected) {
    return "locked";
  }
  if (input.verificationRequired) {
    return "verification-required";
  }
  if (!input.profileExists || !input.loggedIn) {
    return "logged-out";
  }
  return "ready";
}

export function profileLockCandidates(platform: NodeJS.Platform): readonly string[] {
  return platform === "win32"
    ? ["SingletonLock", "SingletonCookie"]
    : ["SingletonLock", "SingletonCookie", "SingletonSocket"];
}

export async function openManagedSession(options: ManagedSessionOptions): Promise<BrowserContext> {
  await mkdir(options.profileDirectory, { recursive: true });
  await access(options.profileDirectory, constants.W_OK);
  return chromium.launchPersistentContext(options.profileDirectory, {
    headless: options.headless ?? false
  });
}

export async function closeManagedSession(context: BrowserContext): Promise<void> {
  await context.close();
}


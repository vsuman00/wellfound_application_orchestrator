import { accessSync, constants, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { homedir } from "node:os";
import { chromium } from "playwright";

const SUPPORTED_NODE_MAJORS = new Set([24, 26]);
const SUPPORTED_PLATFORMS = new Set<NodeJS.Platform>(["darwin", "win32"]);
const SUPPORTED_ARCHITECTURES = new Set(["arm64", "x64"]);

export interface RuntimeInput {
  readonly nodeVersion: string;
  readonly platform: NodeJS.Platform;
  readonly arch: string;
}

export interface RuntimeReport {
  readonly ok: boolean;
  readonly nodeMajor: number | null;
  readonly platform: NodeJS.Platform;
  readonly arch: string;
  readonly errors: readonly string[];
}

export interface BrowserVerification {
  readonly executablePath: string;
}

export type CommandRunner = (
  executable: string,
  args: readonly string[]
) => Promise<number>;

export interface InstallOptions {
  readonly platform: NodeJS.Platform;
  readonly runCommand?: CommandRunner;
}

function parseNodeMajor(version: string): number | null {
  const match = /^v?(\d+)(?:\.|$)/.exec(version);
  return match === null ? null : Number(match[1]);
}

export function currentRuntime(): RuntimeInput {
  return {
    nodeVersion: process.versions.node,
    platform: process.platform,
    arch: process.arch
  };
}

export function validateRuntime(input: RuntimeInput): RuntimeReport {
  const nodeMajor = parseNodeMajor(input.nodeVersion);
  const errors: string[] = [];

  if (nodeMajor === null) {
    errors.push("Unable to determine the Node.js major version.");
  } else if (!SUPPORTED_NODE_MAJORS.has(nodeMajor)) {
    errors.push(`Node.js ${nodeMajor} is not supported; use Node.js 24 or 26.`);
  }

  if (!SUPPORTED_PLATFORMS.has(input.platform)) {
    errors.push(`Platform ${input.platform} is not supported; use macOS or Windows.`);
  }

  if (!SUPPORTED_ARCHITECTURES.has(input.arch)) {
    errors.push(`CPU architecture ${input.arch} is not supported; use arm64 or x64.`);
  }

  return {
    ok: errors.length === 0,
    nodeMajor,
    platform: input.platform,
    arch: input.arch,
    errors
  };
}

export function assertWritableDirectory(directory: string): void {
  try {
    accessSync(directory, constants.W_OK);
  } catch {
    throw new Error(`Directory is not writable: ${directory}`);
  }
}

function defaultCommandRunner(executable: string, args: readonly string[]): Promise<number> {
  return new Promise((resolve) => {
    const child = spawn(executable, args, { stdio: "inherit", shell: false });
    child.once("error", () => resolve(1));
    child.once("exit", (code) => resolve(code ?? 1));
  });
}

export async function installManagedChromium(options: InstallOptions): Promise<void> {
  const executable = options.platform === "win32" ? "npm.cmd" : "npm";
  const runCommand = options.runCommand ?? defaultCommandRunner;
  const exitCode = await runCommand(executable, ["exec", "--", "playwright", "install", "chromium"]);

  if (exitCode !== 0) {
    throw new Error(`Managed Chromium installation failed with exit code ${exitCode}.`);
  }
}

export async function verifyManagedChromium(): Promise<BrowserVerification> {
  const executablePath = chromium.executablePath();

  if (!existsSync(executablePath)) {
    throw new Error(`Managed Chromium executable was not found at ${executablePath}.`);
  }

  const browser = await chromium.launch({ headless: true });
  await browser.close();

  return { executablePath };
}

export async function setupRuntime(): Promise<BrowserVerification> {
  const runtime = currentRuntime();
  const report = validateRuntime(runtime);

  if (!report.ok) {
    throw new Error(["Runtime preflight failed:", ...report.errors.map((error) => `- ${error}`)].join("\n"));
  }

  assertWritableDirectory(homedir());
  await installManagedChromium({ platform: runtime.platform });
  return verifyManagedChromium();
}

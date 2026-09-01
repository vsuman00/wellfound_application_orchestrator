import { describe, expect, it } from "vitest";
import {
  installManagedChromium,
  validateRuntime,
  type CommandRunner
} from "../../src/browser/install.js";

describe("validateRuntime", () => {
  it("accepts supported Node releases and macOS/Windows architectures", () => {
    expect(
      validateRuntime({ nodeVersion: "v24.18.0", platform: "darwin", arch: "arm64" })
    ).toEqual({ ok: true, nodeMajor: 24, platform: "darwin", arch: "arm64", errors: [] });

    expect(
      validateRuntime({ nodeVersion: "v26.5.0", platform: "win32", arch: "x64" })
    ).toEqual({ ok: true, nodeMajor: 26, platform: "win32", arch: "x64", errors: [] });
  });

  it("rejects unsupported Node releases, operating systems, and architectures", () => {
    const report = validateRuntime({ nodeVersion: "v25.0.0", platform: "linux", arch: "ia32" });

    expect(report.ok).toBe(false);
    expect(report.errors).toEqual([
      "Node.js 25 is not supported; use Node.js 24 or 26.",
      "Platform linux is not supported; use macOS or Windows.",
      "CPU architecture ia32 is not supported; use arm64 or x64."
    ]);
  });

  it("rejects malformed Node versions before any side effect", () => {
    expect(validateRuntime({ nodeVersion: "unknown", platform: "darwin", arch: "x64" })).toEqual({
      ok: false,
      nodeMajor: null,
      platform: "darwin",
      arch: "x64",
      errors: ["Unable to determine the Node.js major version."]
    });
  });
});

describe("installManagedChromium", () => {
  it("invokes the Playwright installer through the platform npm executable", async () => {
    const calls: Array<{ executable: string; args: readonly string[] }> = [];
    const runCommand: CommandRunner = async (executable, args) => {
      calls.push({ executable, args });
      return 0;
    };

    await installManagedChromium({ platform: "win32", runCommand });

    expect(calls).toEqual([
      { executable: "npm.cmd", args: ["exec", "--", "playwright", "install", "chromium"] }
    ]);
  });

  it("reports a failed browser download", async () => {
    const runCommand: CommandRunner = async () => 1;

    await expect(installManagedChromium({ platform: "darwin", runCommand })).rejects.toThrow(
      "Managed Chromium installation failed with exit code 1."
    );
  });
});

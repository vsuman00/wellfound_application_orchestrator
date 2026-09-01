import { describe, expect, it } from "vitest";
import { parseArgs } from "../../src/cli/args.js";
import { runScanCommand } from "../../src/cli/scan.js";

describe("parseArgs", () => {
  it("defaults to help when no command is supplied", () => {
    expect(parseArgs([])).toEqual({ command: "help" });
  });

  it("recognizes long and short help flags", () => {
    expect(parseArgs(["--help"])).toEqual({ command: "help" });
    expect(parseArgs(["-h"])).toEqual({ command: "help" });
  });

  it("recognizes the version command and flag", () => {
    expect(parseArgs(["version"])).toEqual({ command: "version" });
    expect(parseArgs(["--version"])).toEqual({ command: "version" });
    expect(parseArgs(["-v"])).toEqual({ command: "version" });
  });

  it("recognizes the setup command", () => {
    expect(parseArgs(["setup"])).toEqual({ command: "setup" });
  });

  it("recognizes scan with an explicit loopback URL", () => {
    expect(parseArgs(["scan"])).toEqual({
      command: "error",
      message: "scan requires exactly --url <loopback-url>."
    });
    expect(parseArgs(["scan", "--url", "http://127.0.0.1:3000/scenario/feed"])).toEqual({
      command: "scan",
      url: "http://127.0.0.1:3000/scenario/feed"
    });
  });

  it("rejects non-loopback scan URLs before opening a browser", async () => {
    await expect(runScanCommand("https://wellfound.com/jobs")).rejects.toThrow(
      "scan is limited to HTTP loopback URLs until the live adapter is explicitly approved."
    );
  });

  it("rejects unknown commands and extra arguments", () => {
    expect(parseArgs(["scan"])).toEqual({
      command: "error",
      message: "scan requires exactly --url <loopback-url>."
    });
    expect(parseArgs(["help", "extra"])).toEqual({
      command: "error",
      message: "Unexpected argument: extra"
    });
  });
});

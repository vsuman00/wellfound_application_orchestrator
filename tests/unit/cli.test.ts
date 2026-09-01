import { describe, expect, it } from "vitest";
import { parseArgs } from "../../src/cli/args.js";

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

  it("rejects unknown commands and extra arguments", () => {
    expect(parseArgs(["scan"])).toEqual({
      command: "error",
      message: "Unknown command: scan"
    });
    expect(parseArgs(["help", "extra"])).toEqual({
      command: "error",
      message: "Unexpected argument: extra"
    });
  });
});

export type CliResult =
  | { readonly command: "help" }
  | { readonly command: "version" }
  | { readonly command: "setup" }
  | { readonly command: "error"; readonly message: string };

export function parseArgs(argv: readonly string[]): CliResult {
  const [first, ...rest] = argv;

  if (first === undefined) {
    return { command: "help" };
  }

  if (first === "help" || first === "--help" || first === "-h") {
    const unexpected = rest[0];
    return unexpected === undefined
      ? { command: "help" }
      : { command: "error", message: `Unexpected argument: ${unexpected}` };
  }

  if (first === "version" || first === "--version" || first === "-v") {
    const unexpected = rest[0];
    return unexpected === undefined
      ? { command: "version" }
      : { command: "error", message: `Unexpected argument: ${unexpected}` };
  }

  if (first === "setup") {
    const unexpected = rest[0];
    return unexpected === undefined
      ? { command: "setup" }
      : { command: "error", message: `Unexpected argument: ${unexpected}` };
  }

  return { command: "error", message: `Unknown command: ${first}` };
}

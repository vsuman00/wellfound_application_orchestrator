export type CliResult =
  | { readonly command: "help" }
  | { readonly command: "version" }
  | { readonly command: "setup" }
  | { readonly command: "scan"; readonly url: string }
  | { readonly command: "approve"; readonly applicationId: string; readonly confirm: boolean }
  | { readonly command: "submit"; readonly applicationId: string }
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

  if (first === "scan") {
    if (rest.length !== 2 || rest[0] !== "--url" || rest[1] === undefined) {
      return { command: "error", message: "scan requires exactly --url <loopback-url>." };
    }
    return { command: "scan", url: rest[1] };
  }

  if (first === "approve") {
    if (rest.length !== 2 && rest.length !== 3) {
      return { command: "error", message: "approve requires --application-id <id> with optional --confirm." };
    }
    if (rest[0] !== "--application-id" || rest[1] === undefined || (rest.length === 3 && rest[2] !== "--confirm")) {
      return { command: "error", message: "approve requires --application-id <id> with optional --confirm." };
    }
    return { command: "approve", applicationId: rest[1], confirm: rest.length === 3 };
  }

  if (first === "submit") {
    if (rest.length !== 2 || rest[0] !== "--application-id" || rest[1] === undefined) {
      return { command: "error", message: "submit requires exactly --application-id <id>." };
    }
    return { command: "submit", applicationId: rest[1] };
  }

  return { command: "error", message: `Unknown command: ${first}` };
}

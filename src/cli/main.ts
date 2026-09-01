import { parseArgs } from "./args.js";

const VERSION = "0.1.0";

const HELP = `Wellfound Application Orchestrator ${VERSION}

Usage:
  wellfound-orchestrator help
  wellfound-orchestrator version

This foundation build has no browser, network, or application automation enabled.
`;

const result = parseArgs(process.argv.slice(2));

if (result.command === "help") {
  console.log(HELP);
} else if (result.command === "version") {
  console.log(VERSION);
} else {
  console.error(`Error: ${result.message}\n\nRun with --help for usage.`);
  process.exitCode = 2;
}

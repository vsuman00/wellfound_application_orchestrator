import { parseArgs } from "./args.js";
import { runSetupCommand } from "./setup.js";

const VERSION = "0.1.0";

const HELP = `Wellfound Application Orchestrator ${VERSION}

Usage:
  wellfound-orchestrator help
  wellfound-orchestrator version
  wellfound-orchestrator setup

The setup command validates the runtime and installs managed Chromium.
`;

const result = parseArgs(process.argv.slice(2));

async function main(): Promise<void> {
  if (result.command === "help") {
    console.log(HELP);
  } else if (result.command === "version") {
    console.log(VERSION);
  } else if (result.command === "setup") {
    try {
      console.log(await runSetupCommand());
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Setup failed: ${message}`);
      process.exitCode = 1;
    }
  } else {
    console.error(`Error: ${result.message}\n\nRun with --help for usage.`);
    process.exitCode = 2;
  }
}

await main();

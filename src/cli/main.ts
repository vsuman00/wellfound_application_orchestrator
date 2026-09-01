import { parseArgs } from "./args.js";
import { runSetupCommand } from "./setup.js";
import { runScanCommand } from "./scan.js";
import { runApproveCommand } from "./approve.js";
import { runSubmitCommand } from "./submit.js";

const VERSION = "0.1.0";

const HELP = `Wellfound Application Orchestrator ${VERSION}

Usage:
  wellfound-orchestrator help
  wellfound-orchestrator version
  wellfound-orchestrator setup
  wellfound-orchestrator scan --url <loopback-url>
  wellfound-orchestrator approve --application-id <id>
  wellfound-orchestrator submit --application-id <id>

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
  } else if (result.command === "scan") {
    try {
      console.log(await runScanCommand(result.url));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Scan failed: ${message}`);
      process.exitCode = 1;
    }
  } else if (result.command === "approve") {
    try {
      console.log(await runApproveCommand(result.applicationId, result.confirm));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Approval review failed: ${message}`);
      process.exitCode = 1;
    }
  } else if (result.command === "submit") {
    try {
      console.log(await runSubmitCommand(result.applicationId));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Submission failed: ${message}`);
      process.exitCode = 1;
    }
  } else {
    console.error(`Error: ${result.message}\n\nRun with --help for usage.`);
    process.exitCode = 2;
  }
}

await main();

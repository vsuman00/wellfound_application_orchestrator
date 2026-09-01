import { setupRuntime } from "../browser/install.js";

export async function runSetupCommand(): Promise<string> {
  const browser = await setupRuntime();
  return `Managed Chromium is ready: ${browser.executablePath}`;
}

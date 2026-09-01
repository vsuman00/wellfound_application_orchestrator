import { openManagedSession, closeManagedSession } from "../browser/session.js";
import { scanFeed } from "../adapters/wellfound/scan.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { openDatabase, closeDatabase } from "../persistence/database.js";
import { createJobRepository } from "../persistence/repositories.js";
import { persistScanResult } from "../orchestrator/scan.js";
import type { DatabaseSync } from "node:sqlite";

function assertLoopbackUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("scan URL must be a valid HTTP loopback URL.");
  }
  if (url.protocol !== "http:" || (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")) {
    throw new Error("scan is limited to HTTP loopback URLs until the live adapter is explicitly approved.");
  }
  return url;
}

export async function runScanCommand(urlValue: string): Promise<string> {
  const url = assertLoopbackUrl(urlValue);
  const paths = resolveRuntimePaths();
  const context = await openManagedSession({ profileDirectory: paths.browserProfile, headless: true });
  let database: DatabaseSync | undefined;
  try {
    database = openDatabase(paths.database);
    const page = await context.newPage();
    await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
    const result = await scanFeed(page);
    const summary = await persistScanResult(result, createJobRepository(database), { now: () => new Date().toISOString() });
    return JSON.stringify(summary);
  } finally {
    if (database !== undefined) {
      closeDatabase(database);
    }
    await closeManagedSession(context);
  }
}

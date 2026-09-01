import { afterEach, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { scanFeed } from "../../src/adapters/wellfound/scan.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

let fixtureServer: FixtureServer | undefined;

afterEach(async () => {
  await fixtureServer?.close();
  fixtureServer = undefined;
});

describe("scan-only Wellfound adapter", () => {
  it("extracts and deduplicates sanitized feed cards without form interaction", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${fixtureServer.baseUrl}/scenario/feed`);
      const result = await scanFeed(page);
      expect(result.jobs).toHaveLength(2);
      expect(result.jobs[0]?.canonicalIdentity).toBe("wellfound:fixture-job-1");
      expect(result.diagnostics).toEqual([]);
    } finally {
      await browser.close();
    }
  }, 30_000);

  it("returns typed diagnostics and no jobs for blocked or changed DOM", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${fixtureServer.baseUrl}/scenario/blocked`);
      await expect(scanFeed(page)).resolves.toMatchObject({ jobs: [], diagnostics: [{ code: "blocked" }] });
      await page.goto(`${fixtureServer.baseUrl}/scenario/changed-dom`);
      await expect(scanFeed(page)).resolves.toMatchObject({ jobs: [], diagnostics: [{ code: "changed-dom" }] });
    } finally {
      await browser.close();
    }
  }, 30_000);
});

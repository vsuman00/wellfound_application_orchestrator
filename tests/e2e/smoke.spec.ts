import { afterEach, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { fixtureScenarios } from "../fixtures/wellfound/scenarios.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

let fixtureServer: FixtureServer | undefined;

afterEach(async () => {
  await fixtureServer?.close();
  fixtureServer = undefined;
});

describe("sanitized Wellfound fixtures", () => {
  it("serves every required scenario from loopback only", async () => {
    fixtureServer = await startFixtureServer();
    expect(new URL(fixtureServer.baseUrl).hostname).toBe("127.0.0.1");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      for (const scenario of fixtureScenarios) {
        await page.goto(`${fixtureServer.baseUrl}/scenario/${scenario}`);
        await expect(page.locator(`[data-fixture-scenario="${scenario}"]`).count()).resolves.toBe(1);
      }
    } finally {
      await browser.close();
    }
  }, 30_000);

  it("keeps submit controls inert in the submit fixture", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      let submitted = false;
      page.on("request", (request) => {
        if (request.method() === "POST") {
          submitted = true;
        }
      });
      await page.goto(`${fixtureServer.baseUrl}/scenario/submit`);
      await expect(page.locator("[data-submit]").count()).resolves.toBe(1);
      expect(submitted).toBe(false);
    } finally {
      await browser.close();
    }
  }, 30_000);
});

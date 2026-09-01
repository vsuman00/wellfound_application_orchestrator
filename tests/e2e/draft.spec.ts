import { afterEach, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { draftApplication } from "../../src/adapters/wellfound/draft.js";
import type { FixtureServer } from "./fixture-server.js";
import { startFixtureServer } from "./fixture-server.js";

let fixtureServer: FixtureServer | undefined;

afterEach(async () => {
  await fixtureServer?.close();
  fixtureServer = undefined;
});

describe("non-submitting application drafting", () => {
  it("fills only exact approved facts and leaves review items untouched", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${fixtureServer.baseUrl}/scenario/questions`);
      const result = await draftApplication(page, [{
        factId: "fact-work-mode",
        key: "work-mode",
        value: "Remote",
        source: "candidate-profile",
        approvedAt: "2026-09-01T10:00:00.000Z"
      }]);
      expect(result.reviewRequired).toBe(true);
      expect(await page.locator('[data-question="work-mode"]').inputValue()).toBe("Remote");
      expect(await page.locator('[data-question="motivation"]').inputValue()).toBe("");
      expect(result.answers.map((answer) => answer.decision.kind)).toEqual(["exact", "unsupported", "review-required"]);
    } finally {
      await browser.close();
    }
  }, 30_000);
});

import { afterEach, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { submitApproved } from "../../src/adapters/wellfound/submit.js";
import type { ApprovalRecord } from "../../src/domain/approval.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

let fixtureServer: FixtureServer | undefined;

afterEach(async () => {
  await fixtureServer?.close();
  fixtureServer = undefined;
});

describe("fixture-only approved submission", () => {
  it("clicks one approved fixture control and captures confirmation evidence", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${fixtureServer.baseUrl}/scenario/submit`);
      const approval: ApprovalRecord = {
        applicationId: "application-1",
        draftId: "draft-1",
        draftRevision: "revision-1",
        approvedBy: "local-user",
        approvedAt: "2026-09-01T10:00:00.000Z",
        expiresAt: "2026-09-01T11:00:00.000Z"
      };
      const result = await submitApproved(page, "application-1", approval, "2026-09-01T10:30:00.000Z");
      expect(result.evidence).toMatchObject({ evidenceId: "fixture-confirmation-1", signal: "confirmation-page" });
    } finally {
      await browser.close();
    }
  }, 30_000);

  it("rejects an expired approval before touching the submit control", async () => {
    fixtureServer = await startFixtureServer();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(`${fixtureServer.baseUrl}/scenario/submit`);
      const approval: ApprovalRecord = {
        applicationId: "application-1",
        draftId: "draft-1",
        draftRevision: "revision-1",
        approvedBy: "local-user",
        approvedAt: "2026-09-01T10:00:00.000Z",
        expiresAt: "2026-09-01T10:01:00.000Z"
      };
      await expect(submitApproved(page, "application-1", approval, "2026-09-01T10:02:00.000Z"))
        .rejects.toThrow("valid approval");
      expect(await page.url()).toContain("/scenario/submit");
    } finally {
      await browser.close();
    }
  }, 30_000);
});

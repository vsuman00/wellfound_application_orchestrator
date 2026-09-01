import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApplication, transitionApplication } from "../../src/domain/application.js";
import type { DraftRecord } from "../../src/domain/draft.js";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createApplicationRepository, createDraftRepository, createSqliteAuditPort, createSqliteUnitOfWork } from "../../src/persistence/repositories.js";
import { persistDraft } from "../../src/orchestrator/draft.js";
import { summarizeDraftRun } from "../../src/orchestrator/run-summary.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("persisted draft orchestrator", () => {
  it("commits answers, review reasons, audit, and idempotency as one journey", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-draft-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(join(directory, "state.sqlite3"));
    try {
      let application = createApplication("application-1");
      for (const state of ["MATCHED", "DRAFTED", "REVIEW_REQUIRED"] as const) {
        application = transitionApplication(application, state);
      }
      const draft: DraftRecord = {
        id: "draft-1",
        applicationId: application.id,
        idempotencyKey: "draft:application-1:1",
        disposition: "review-required",
        answers: [
          { key: "work-mode", decision: { kind: "exact", value: "Remote", factId: "fact-1" } },
          { key: "salary", decision: { kind: "review-required", reason: "Needs explicit approval" } }
        ],
        reviewReasons: ["salary requires explicit approval"],
        createdAt: "2026-09-01T10:00:00.000Z"
      };
      const persistence = {
        applications: createApplicationRepository(database),
        drafts: createDraftRepository(database),
        audit: createSqliteAuditPort(database),
        unitOfWork: createSqliteUnitOfWork(database),
        clock: { now: () => "2026-09-01T10:00:00.000Z" }
      };
      await expect(persistDraft(application, draft, persistence)).resolves.toMatchObject({ status: "created" });
      await expect(persistDraft(application, draft, persistence)).resolves.toMatchObject({ status: "existing" });
      expect(database.prepare("SELECT COUNT(*) AS count FROM drafts").get()?.count).toBe(1);
      expect(database.prepare("SELECT COUNT(*) AS count FROM answers").get()?.count).toBe(2);
      expect(database.prepare("SELECT COUNT(*) AS count FROM application_attempts").get()?.count).toBe(1);
      expect(database.prepare("SELECT COUNT(*) AS count FROM audit_events").get()?.count).toBe(1);
      expect(summarizeDraftRun(["drafted", "review-required", "skipped", "failed"])).toEqual({ drafted: 1, reviewRequired: 1, skipped: 1, failed: 1 });
    } finally {
      closeDatabase(database);
    }
  });
});

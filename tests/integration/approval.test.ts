import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { approveDraft } from "../../src/domain/approval.js";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createApprovalRepository } from "../../src/persistence/repositories.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("persisted approvals", () => {
  it("stores one revision-bound approval and reads it back", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-approval-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(join(directory, "state.sqlite3"));
    try {
      database.prepare("INSERT INTO applications (id, state) VALUES (?, ?)").run("application-1", "REVIEW_REQUIRED");
      database.prepare("INSERT INTO drafts (id, application_id, created_at, idempotency_key, disposition) VALUES (?, ?, ?, ?, ?)")
        .run("draft-1", "application-1", "2026-09-01T10:00:00.000Z", "revision-1", "review-required");
      const approval = approveDraft({
        applicationId: "application-1",
        draftId: "draft-1",
        draftRevision: "revision-1",
        approvedBy: "local-user",
        approvedAt: "2026-09-01T10:00:00.000Z",
        expiresAt: "2026-09-01T11:00:00.000Z"
      });
      const repository = createApprovalRepository(database);
      await repository.save(approval);
      expect(await repository.getByApplicationId("application-1")).toEqual(approval);
    } finally {
      closeDatabase(database);
    }
  });
});

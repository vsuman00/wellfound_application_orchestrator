import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createSqliteRunLock } from "../../src/persistence/locks.js";
import { createSqliteQuota } from "../../src/persistence/quotas.js";
import {
  createApplicationRepository,
  createApprovalRepository,
  createSqliteAuditPort,
  createSqliteUnitOfWork,
  createSubmissionRepository
} from "../../src/persistence/repositories.js";
import { submitApprovedApplication } from "../../src/orchestrator/submit.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("persisted submission orchestrator", () => {
  it("reserves quota atomically and counts confirmed successes per run", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-quota-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(join(directory, "state.sqlite3"));
    try {
      database.prepare("INSERT INTO applications (id, state) VALUES (?, ?)").run("application-1", "APPROVED");
      database.prepare("INSERT INTO applications (id, state) VALUES (?, ?)").run("application-2", "APPROVED");
      const quota = createSqliteQuota(database);
      const input = { runId: "run-1", limits: { perRun: 1, perDay: 2 }, now: "2026-09-01T10:30:00.000Z" };
      const first = await quota.acquire({ ...input, applicationId: "application-1" });
      expect(first).not.toBeNull();
      database.prepare("INSERT INTO application_attempts (id, application_id, attempt_number, run_id, outcome_kind, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run("attempt-1", "application-1", 1, "run-1", "confirmed", input.now);
      await quota.consume(first!);
      await expect(quota.acquire({ ...input, applicationId: "application-2" })).resolves.toBeNull();
    } finally {
      closeDatabase(database);
    }
  });

  it("stores one confirmed attempt and one evidence record", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-submit-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(join(directory, "state.sqlite3"));
    try {
      database.prepare("INSERT INTO jobs (id, canonical_identity, title, company, discovered_at) VALUES (?, ?, ?, ?, ?)")
        .run("job-1", "wellfound:job-1", "Fixture Engineer", "Example Labs", "2026-09-01T10:00:00.000Z");
      database.prepare("INSERT INTO applications (id, job_id, state) VALUES (?, ?, ?)")
        .run("application-1", "job-1", "APPROVED");
      database.prepare("INSERT INTO drafts (id, application_id, created_at, idempotency_key, disposition) VALUES (?, ?, ?, ?, ?)")
        .run("draft-1", "application-1", "2026-09-01T10:00:00.000Z", "revision-1", "review-required");
      database.prepare("INSERT INTO approvals (application_id, draft_id, draft_revision, approved_by, approved_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)")
        .run("application-1", "draft-1", "revision-1", "local-user", "2026-09-01T10:00:00.000Z", "2026-09-01T11:00:00.000Z");

      const outcome = await submitApprovedApplication({
        applicationId: "application-1",
        draftId: "draft-1",
        draftRevision: "revision-1",
        runId: "run-1",
        limits: { perRun: 1, perDay: 1 },
        submit: async () => ({ evidence: {
          evidenceId: "fixture-confirmation-1",
          observedAt: "2026-09-01T10:30:00.000Z",
          signal: "confirmation-page",
          detail: "Application received"
        } })
      }, {
        applications: createApplicationRepository(database),
        approvals: createApprovalRepository(database),
        submission: createSubmissionRepository(database),
        audit: createSqliteAuditPort(database),
        unitOfWork: createSqliteUnitOfWork(database),
        lock: createSqliteRunLock(database, { now: () => "2026-09-01T10:30:00.000Z" }),
        quota: createSqliteQuota(database),
        clock: { now: () => "2026-09-01T10:30:00.000Z" }
      });

      expect(outcome.kind).toBe("confirmed");
      expect(database.prepare("SELECT state, confirmed_evidence_id FROM applications WHERE id = ?").get("application-1"))
        .toEqual({ state: "CONFIRMED", confirmed_evidence_id: "fixture-confirmation-1" });
      expect(database.prepare("SELECT COUNT(*) AS count FROM confirmation_evidence WHERE id = ?").get("fixture-confirmation-1")?.count).toBe(1);
      expect(database.prepare("SELECT outcome_kind, confirmation_evidence_id FROM application_attempts WHERE application_id = ?").get("application-1"))
        .toEqual({ outcome_kind: "confirmed", confirmation_evidence_id: "fixture-confirmation-1" });
    } finally {
      closeDatabase(database);
    }
  });
});

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApplication, transitionApplication } from "../../src/domain/application.js";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createApplicationRepository } from "../../src/persistence/repositories.js";
import { createSqliteRunLock } from "../../src/persistence/locks.js";
import { recordUnknownOutcome } from "../../src/persistence/recovery.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "wellfound-recovery-"));
  temporaryDirectories.push(directory);
  return openDatabase(join(directory, "state.sqlite3"));
}

describe("SQLite locks and recovery", () => {
  it("allows one run-lock owner and releases it safely", async () => {
    const database = await createTestDatabase();
    try {
      let now = "2026-09-01T10:00:00.000Z";
      const lock = createSqliteRunLock(database, { now: () => now });
      await expect(lock.acquire("scheduled", "owner-a", 60_000)).resolves.toEqual({
        key: "scheduled",
        owner: "owner-a",
        expiresAt: "2026-09-01T10:01:00.000Z"
      });
      await expect(lock.acquire("scheduled", "owner-b", 60_000)).resolves.toBeNull();
      await lock.release({ key: "scheduled", owner: "owner-a", expiresAt: "2026-09-01T10:01:00.000Z" });
      await expect(lock.acquire("scheduled", "owner-b", 60_000)).resolves.toEqual({
        key: "scheduled",
        owner: "owner-b",
        expiresAt: "2026-09-01T10:01:00.000Z"
      });
      now = "2026-09-01T10:02:00.000Z";
      await expect(lock.acquire("scheduled", "owner-c", 60_000)).resolves.toEqual({
        key: "scheduled",
        owner: "owner-c",
        expiresAt: "2026-09-01T10:03:00.000Z"
      });
    } finally {
      closeDatabase(database);
    }
  });

  it("prevents a second application for one canonical job identity", async () => {
    const database = await createTestDatabase();
    try {
      database.prepare(
        "INSERT INTO jobs (id, canonical_identity, title, company, discovered_at) VALUES (?, ?, ?, ?, ?)"
      ).run("job-1", "wellfound:job-1", "Engineer", "Example", "2026-09-01T10:00:00.000Z");
      const insert = database.prepare(
        "INSERT INTO applications (id, job_id, state) VALUES (?, ?, ?)"
      );
      insert.run("application-1", "job-1", "DRAFTED");
      expect(() => insert.run("application-2", "job-1", "DRAFTED")).toThrow();
    } finally {
      closeDatabase(database);
    }
  });

  it("records an interrupted submission as outcome-unknown", async () => {
    const database = await createTestDatabase();
    try {
      const repository = createApplicationRepository(database);
      let application = createApplication("application-1");
      for (const state of ["MATCHED", "DRAFTED", "REVIEW_REQUIRED", "APPROVED", "SUBMITTING"] as const) {
        application = transitionApplication(application, state);
      }
      await repository.save(application);
      await recordUnknownOutcome(database, application.id, "attempt-1", "process interrupted", "2026-09-01T10:00:00.000Z");
      expect(await repository.getById(application.id)).toEqual({ id: application.id, state: "OUTCOME_UNKNOWN" });
      expect(database.prepare(
        "SELECT outcome_kind, confirmation_evidence_id FROM application_attempts WHERE id = ?"
      ).get("attempt-1")).toEqual({ outcome_kind: "outcome-unknown", confirmation_evidence_id: null });
    } finally {
      closeDatabase(database);
    }
  });
});

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createApplication, transitionApplication } from "../../src/domain/application.js";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createApplicationRepository, createSqliteUnitOfWork } from "../../src/persistence/repositories.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

async function createTestDatabase() {
  const directory = await mkdtemp(join(tmpdir(), "wellfound-persistence-"));
  temporaryDirectories.push(directory);
  return openDatabase(join(directory, "state.sqlite3"));
}

describe("SQLite persistence adapter", () => {
  it("applies the initial schema with foreign keys and WAL enabled", async () => {
    const database = await createTestDatabase();
    try {
      expect(database.prepare("PRAGMA foreign_keys").get()?.foreign_keys).toBe(1);
      expect(database.prepare("PRAGMA journal_mode").get()?.journal_mode).toBe("wal");
      const tables = database.prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name"
      ).all().map((row) => row.name);
      expect(tables).toEqual(expect.arrayContaining([
        "answers",
        "application_attempts",
        "applications",
        "audit_events",
        "confirmation_evidence",
        "drafts",
        "jobs",
        "runs",
        "schedules",
        "schema_migrations"
      ]));
    } finally {
      closeDatabase(database);
    }
  });

  it("persists application state and rolls back a failed unit of work", async () => {
    const database = await createTestDatabase();
    try {
      const repository = createApplicationRepository(database);
      const unitOfWork = createSqliteUnitOfWork(database);
      const application = createApplication("application-1");
      await expect(unitOfWork.run(async () => {
        await repository.save(application);
        throw new Error("forced rollback");
      })).rejects.toThrow("forced rollback");
      expect(await repository.getById(application.id)).toBeNull();

      const matched = transitionApplication(application, "MATCHED");
      await unitOfWork.run(async () => repository.save(matched));
      expect(await repository.getById(application.id)).toEqual(matched);
    } finally {
      closeDatabase(database);
    }
  });

  it("enforces canonical job identity uniqueness and foreign keys", async () => {
    const database = await createTestDatabase();
    try {
      const insertJob = database.prepare(
        "INSERT INTO jobs (id, canonical_identity, title, company, discovered_at) VALUES (?, ?, ?, ?, ?)"
      );
      insertJob.run("job-1", "wellfound:job-1", "Engineer", "Example", "2026-09-01T10:00:00.000Z");
      expect(() => insertJob.run("job-2", "wellfound:job-1", "Other", "Example", "2026-09-01T10:00:00.000Z"))
        .toThrow();
      expect(() => database.prepare(
        "INSERT INTO drafts (id, application_id, created_at) VALUES (?, ?, ?)"
      ).run("draft-1", "missing", "2026-09-01T10:00:00.000Z")).toThrow();
    } finally {
      closeDatabase(database);
    }
  });
});

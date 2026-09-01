import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { openDatabase, closeDatabase } from "../../src/persistence/database.js";
import { createJobRepository } from "../../src/persistence/repositories.js";
import { persistScanResult } from "../../src/orchestrator/scan.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("persisted scan use case", () => {
  it("persists normalized jobs and returns a redacted summary", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-scan-"));
    temporaryDirectories.push(directory);
    const database = openDatabase(join(directory, "state.sqlite3"));
    try {
      const repository = createJobRepository(database);
      const summary = await persistScanResult({
        jobs: [{
          id: "fixture-job-1",
          canonicalIdentity: "wellfound:fixture-job-1",
          title: "Fixture Engineer",
          company: "Example Labs",
          location: "Remote",
          href: "/scenario/job-detail",
          publishedAt: "2026-09-01T08:00:00.000Z"
        }],
        diagnostics: [{ code: "missing-field", message: "not emitted", selector: "[fixture]" }]
      }, repository, { now: () => "2026-09-01T10:00:00.000Z" });

      expect(summary).toEqual({ scanned: 1, persisted: 1, diagnostics: ["missing-field"] });
      expect(await repository.getByCanonicalIdentity("wellfound:fixture-job-1")).toMatchObject({
        canonicalIdentity: "wellfound:fixture-job-1",
        title: "Fixture Engineer",
        discoveredAt: "2026-09-01T10:00:00.000Z"
      });
    } finally {
      closeDatabase(database);
    }
  });
});

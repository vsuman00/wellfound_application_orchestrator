import type { JobFacts } from "../adapters/wellfound/normalize.js";
import type { JobRecord } from "../domain/job.js";
import type { Clock, JobRepository } from "../domain/ports.js";
import type { ScanResult } from "../adapters/wellfound/scan.js";

export interface ScanSummary {
  readonly scanned: number;
  readonly persisted: number;
  readonly diagnostics: readonly string[];
}

function toJobRecord(job: JobFacts, discoveredAt: string): JobRecord {
  return {
    ...job,
    skills: [],
    publishedAt: job.publishedAt,
    discoveredAt
  };
}

export async function persistScanResult(
  result: ScanResult,
  repository: JobRepository,
  clock: Clock
): Promise<ScanSummary> {
  let persisted = 0;
  for (const job of result.jobs) {
    await repository.upsert(toJobRecord(job, clock.now()));
    persisted += 1;
  }
  return {
    scanned: result.jobs.length,
    persisted,
    diagnostics: result.diagnostics.map((diagnostic) => diagnostic.code)
  };
}

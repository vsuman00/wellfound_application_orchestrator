import type { DraftDisposition } from "../domain/draft.js";

export interface DraftRunSummary {
  readonly drafted: number;
  readonly reviewRequired: number;
  readonly skipped: number;
  readonly failed: number;
}

export function summarizeDraftRun(dispositions: readonly DraftDisposition[]): DraftRunSummary {
  return dispositions.reduce<DraftRunSummary>((summary, disposition) => ({
    ...summary,
    drafted: summary.drafted + (disposition === "drafted" ? 1 : 0),
    reviewRequired: summary.reviewRequired + (disposition === "review-required" ? 1 : 0),
    skipped: summary.skipped + (disposition === "skipped" ? 1 : 0),
    failed: summary.failed + (disposition === "failed" ? 1 : 0)
  }), { drafted: 0, reviewRequired: 0, skipped: 0, failed: 0 });
}

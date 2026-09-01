import type { AnswerDecision } from "./answer.js";

export interface DraftAnswerRecord {
  readonly key: string;
  readonly decision: AnswerDecision;
}

export type DraftDisposition = "drafted" | "review-required" | "skipped" | "failed";

export interface DraftRecord {
  readonly id: string;
  readonly applicationId: string;
  readonly idempotencyKey: string;
  readonly disposition: DraftDisposition;
  readonly answers: readonly DraftAnswerRecord[];
  readonly reviewReasons: readonly string[];
  readonly createdAt: string;
}

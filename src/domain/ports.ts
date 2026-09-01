import type { AuditEvent } from "./audit.js";
import type { ApplicationRecord } from "./application.js";
import type { JobRecord } from "./job.js";
import type { DraftRecord } from "./draft.js";
import type { ApprovalRecord } from "./approval.js";
import type { ConfirmationEvidence, SubmissionOutcome } from "./outcome.js";

export interface ApplicationRepository {
  getById(id: string): Promise<ApplicationRecord | null>;
  save(record: ApplicationRecord): Promise<void>;
}

export interface JobRepository {
  getByCanonicalIdentity(identity: string): Promise<JobRecord | null>;
  getById(id: string): Promise<JobRecord | null>;
  upsert(record: JobRecord): Promise<void>;
}

export interface DraftRepository {
  getByIdempotencyKey(key: string): Promise<DraftRecord | null>;
  getByApplicationId(applicationId: string): Promise<DraftRecord | null>;
  save(record: DraftRecord): Promise<void>;
}

export interface ApprovalRepository {
  getByApplicationId(applicationId: string): Promise<ApprovalRecord | null>;
  save(record: ApprovalRecord): Promise<void>;
}

export interface SubmissionAttempt {
  readonly id: string;
  readonly applicationId: string;
  readonly attemptNumber: number;
  readonly runId?: string;
  readonly outcome: SubmissionOutcome;
  readonly createdAt: string;
}

export interface SubmissionRepository {
  nextAttemptNumber(applicationId: string): Promise<number>;
  saveEvidence(applicationId: string, evidence: ConfirmationEvidence): Promise<void>;
  saveAttempt(attempt: SubmissionAttempt): Promise<void>;
}

export interface QuotaLimits {
  readonly perRun: number;
  readonly perDay: number;
}

export interface QuotaLease {
  readonly applicationId: string;
  readonly runId: string;
}

export interface QuotaPort {
  acquire(input: {
    readonly applicationId: string;
    readonly runId: string;
    readonly limits: QuotaLimits;
    readonly now: string;
  }): Promise<QuotaLease | null>;
  consume(lease: QuotaLease): Promise<void>;
  release(lease: QuotaLease): Promise<void>;
}

export interface AuditPort {
  append(event: AuditEvent): Promise<void>;
}

export interface Clock {
  now(): string;
}

export interface IdentifierPort {
  next(prefix?: string): string;
}

export interface LockLease {
  readonly key: string;
  readonly owner: string;
  readonly expiresAt: string;
}

export interface RunLockPort {
  acquire(key: string, owner: string, ttlMs: number): Promise<LockLease | null>;
  release(lease: LockLease): Promise<void>;
}

export interface UnitOfWork {
  run<T>(work: () => Promise<T>): Promise<T>;
}

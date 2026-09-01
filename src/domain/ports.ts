import type { AuditEvent } from "./audit.js";
import type { ApplicationRecord } from "./application.js";
import type { JobRecord } from "./job.js";
import type { DraftRecord } from "./draft.js";

export interface ApplicationRepository {
  getById(id: string): Promise<ApplicationRecord | null>;
  save(record: ApplicationRecord): Promise<void>;
}

export interface JobRepository {
  getByCanonicalIdentity(identity: string): Promise<JobRecord | null>;
  upsert(record: JobRecord): Promise<void>;
}

export interface DraftRepository {
  getByIdempotencyKey(key: string): Promise<DraftRecord | null>;
  save(record: DraftRecord): Promise<void>;
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

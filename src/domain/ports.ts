import type { AuditEvent } from "./audit.js";
import type { ApplicationRecord } from "./application.js";

export interface ApplicationRepository {
  getById(id: string): Promise<ApplicationRecord | null>;
  save(record: ApplicationRecord): Promise<void>;
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

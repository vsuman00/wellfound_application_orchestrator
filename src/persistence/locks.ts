import type { DatabaseSync } from "node:sqlite";
import type { Clock, LockLease, RunLockPort } from "../domain/ports.js";

export function createSqliteRunLock(database: DatabaseSync, clock: Clock): RunLockPort {
  const insert = database.prepare(
    "INSERT OR IGNORE INTO run_locks (key, owner, expires_at) VALUES (?, ?, ?)"
  );
  const reclaim = database.prepare(
    "UPDATE run_locks SET owner = ?, expires_at = ? WHERE key = ? AND expires_at <= ?"
  );
  const release = database.prepare("DELETE FROM run_locks WHERE key = ? AND owner = ?");

  return {
    async acquire(key, owner, ttlMs): Promise<LockLease | null> {
      if (ttlMs <= 0 || !Number.isFinite(ttlMs)) {
        throw new Error("Lock TTL must be a positive finite number.");
      }
      const acquiredAt = clock.now();
      const acquiredEpoch = Date.parse(acquiredAt);
      if (Number.isNaN(acquiredEpoch)) {
        throw new Error("Clock must return an ISO timestamp.");
      }
      const expiresAt = new Date(acquiredEpoch + ttlMs).toISOString();
      if (Number(insert.run(key, owner, expiresAt).changes) === 1) {
        return { key, owner, expiresAt };
      }
      if (Number(reclaim.run(owner, expiresAt, key, acquiredAt).changes) === 1) {
        return { key, owner, expiresAt };
      }
      return null;
    },
    async release(lease): Promise<void> {
      release.run(lease.key, lease.owner);
    }
  };
}

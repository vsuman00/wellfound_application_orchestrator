import type { DatabaseSync } from "node:sqlite";
import type { QuotaLease, QuotaPort } from "../domain/ports.js";

function dayOf(timestamp: string): string {
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) {
    throw new Error("Quota timestamps must be valid ISO timestamps.");
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

export function createSqliteQuota(database: DatabaseSync): QuotaPort {
  const existingReservation = database.prepare("SELECT run_id FROM quota_reservations WHERE application_id = ?");
  const runReservations = database.prepare("SELECT COUNT(*) AS count FROM quota_reservations WHERE run_id = ?");
  const runConfirmed = database.prepare("SELECT COUNT(*) AS count FROM application_attempts WHERE run_id = ? AND outcome_kind = 'confirmed'");
  const dayConfirmed = database.prepare("SELECT COUNT(*) AS count FROM application_attempts WHERE outcome_kind = 'confirmed' AND substr(created_at, 1, 10) = ?");
  const dayReservations = database.prepare("SELECT COUNT(*) AS count FROM quota_reservations WHERE reserved_day = ?");
  const insertReservation = database.prepare(`
    INSERT INTO quota_reservations (application_id, run_id, reserved_day, reserved_at)
    VALUES (?, ?, ?, ?)
  `);
  const deleteReservation = database.prepare("DELETE FROM quota_reservations WHERE application_id = ? AND run_id = ?");

  return {
    async acquire(input) {
      if (input.limits.perRun <= 0 || input.limits.perDay <= 0) {
        throw new Error("Quota limits must be positive.");
      }
      const day = dayOf(input.now);
      database.exec("BEGIN IMMEDIATE;");
      try {
        if (existingReservation.get(input.applicationId) !== undefined) {
          database.exec("ROLLBACK;");
          return null;
        }
        const reservedForRun = Number((runReservations.get(input.runId) as { count: number }).count);
        const confirmedForRun = Number((runConfirmed.get(input.runId) as { count: number }).count);
        if (reservedForRun + confirmedForRun >= input.limits.perRun) {
          database.exec("ROLLBACK;");
          return null;
        }
        const confirmedForDay = Number((dayConfirmed.get(day) as { count: number }).count);
        const reservedForDay = Number((dayReservations.get(day) as { count: number }).count);
        if (confirmedForDay + reservedForDay >= input.limits.perDay) {
          database.exec("ROLLBACK;");
          return null;
        }
        insertReservation.run(input.applicationId, input.runId, day, input.now);
        database.exec("COMMIT;");
        return { applicationId: input.applicationId, runId: input.runId } satisfies QuotaLease;
      } catch (error) {
        database.exec("ROLLBACK;");
        throw error;
      }
    },
    async consume(lease) {
      deleteReservation.run(lease.applicationId, lease.runId);
    },
    async release(lease) {
      deleteReservation.run(lease.applicationId, lease.runId);
    }
  };
}

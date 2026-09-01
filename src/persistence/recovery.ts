import type { DatabaseSync } from "node:sqlite";

export async function recordUnknownOutcome(
  database: DatabaseSync,
  applicationId: string,
  attemptId: string,
  reason: string,
  occurredAt: string
): Promise<void> {
  database.exec("BEGIN IMMEDIATE;");
  try {
    const application = database.prepare(
      "SELECT state FROM applications WHERE id = ?"
    ).get(applicationId) as { state: string } | undefined;
    if (application?.state !== "SUBMITTING") {
      throw new Error("Only a submitting application can become outcome-unknown.");
    }
    database.prepare(`
      INSERT INTO application_attempts
        (id, application_id, attempt_number, outcome_kind, outcome_reason, created_at)
      VALUES (?, ?, COALESCE((SELECT MAX(attempt_number) + 1 FROM application_attempts WHERE application_id = ?), 1), ?, ?, ?)
    `).run(attemptId, applicationId, applicationId, "outcome-unknown", reason, occurredAt);
    database.prepare(
      "UPDATE applications SET state = 'OUTCOME_UNKNOWN', updated_at = ? WHERE id = ?"
    ).run(occurredAt, applicationId);
    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

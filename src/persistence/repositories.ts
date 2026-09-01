import type { DatabaseSync } from "node:sqlite";
import type { ApplicationState } from "../domain/state-machine.js";
import type { ApplicationRepository, UnitOfWork } from "../domain/ports.js";

interface ApplicationRow {
  readonly id: string;
  readonly state: ApplicationState;
  readonly confirmed_evidence_id: string | null;
}

export function createApplicationRepository(database: DatabaseSync): ApplicationRepository {
  const read = database.prepare(
    "SELECT id, state, confirmed_evidence_id FROM applications WHERE id = ?"
  );
  const write = database.prepare(`
    INSERT INTO applications (id, state, confirmed_evidence_id)
    VALUES (?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      state = excluded.state,
      confirmed_evidence_id = excluded.confirmed_evidence_id,
      updated_at = CURRENT_TIMESTAMP
  `);

  return {
    async getById(id) {
      const row = read.get(id) as ApplicationRow | undefined;
      if (row === undefined) {
        return null;
      }
      return row.confirmed_evidence_id === null
        ? { id: row.id, state: row.state }
        : { id: row.id, state: row.state, confirmedEvidenceId: row.confirmed_evidence_id };
    },
    async save(record) {
      write.run(record.id, record.state, record.confirmedEvidenceId ?? null);
    }
  };
}

export function createSqliteUnitOfWork(database: DatabaseSync): UnitOfWork {
  return {
    async run<T>(work: () => Promise<T>): Promise<T> {
      database.exec("BEGIN IMMEDIATE;");
      try {
        const result = await work();
        database.exec("COMMIT;");
        return result;
      } catch (error) {
        database.exec("ROLLBACK;");
        throw error;
      }
    }
  };
}

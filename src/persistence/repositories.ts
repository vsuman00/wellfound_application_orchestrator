import type { DatabaseSync } from "node:sqlite";
import type { ApplicationState } from "../domain/state-machine.js";
import type { ApplicationRepository, UnitOfWork } from "../domain/ports.js";
import type { JobRepository } from "../domain/ports.js";
import type { JobRecord } from "../domain/job.js";

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

interface JobRow {
  readonly id: string;
  readonly canonical_identity: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly href: string;
  readonly skills_json: string;
  readonly published_at: string;
  readonly discovered_at: string;
}

export function createJobRepository(database: DatabaseSync): JobRepository {
  const read = database.prepare("SELECT * FROM jobs WHERE canonical_identity = ?");
  const write = database.prepare(`
    INSERT INTO jobs
      (id, canonical_identity, title, company, location, href, skills_json, published_at, discovered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(canonical_identity) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      location = excluded.location,
      href = excluded.href,
      skills_json = excluded.skills_json,
      published_at = excluded.published_at,
      discovered_at = excluded.discovered_at
  `);

  return {
    async getByCanonicalIdentity(identity) {
      const row = read.get(identity) as JobRow | undefined;
      if (row === undefined) {
        return null;
      }
      return {
        id: row.id,
        canonicalIdentity: row.canonical_identity,
        title: row.title,
        company: row.company,
        location: row.location,
        href: row.href,
        skills: JSON.parse(row.skills_json) as string[],
        publishedAt: row.published_at,
        discoveredAt: row.discovered_at
      };
    },
    async upsert(record: JobRecord) {
      write.run(
        record.id,
        record.canonicalIdentity,
        record.title,
        record.company,
        record.location,
        record.href,
        JSON.stringify(record.skills),
        record.publishedAt,
        record.discoveredAt
      );
    }
  };
}

import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

export const INITIAL_SCHEMA_VERSION = 1;
export const LATEST_SCHEMA_VERSION = 6;

export const INITIAL_SCHEMA = `
CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  canonical_identity TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  discovered_at TEXT NOT NULL
) STRICT;

CREATE TABLE applications (
  id TEXT PRIMARY KEY,
  job_id TEXT REFERENCES jobs(id),
  state TEXT NOT NULL,
  confirmed_evidence_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;

CREATE TABLE drafts (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL UNIQUE REFERENCES applications(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE answers (
  id TEXT PRIMARY KEY,
  draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  question_key TEXT NOT NULL,
  decision_kind TEXT NOT NULL,
  answer TEXT
) STRICT;

CREATE TABLE confirmation_evidence (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  observed_at TEXT NOT NULL,
  signal TEXT NOT NULL,
  detail TEXT NOT NULL
) STRICT;

CREATE TABLE application_attempts (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL,
  outcome_kind TEXT NOT NULL,
  confirmation_evidence_id TEXT REFERENCES confirmation_evidence(id),
  created_at TEXT NOT NULL,
  UNIQUE (application_id, attempt_number)
) STRICT;

CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  expression TEXT NOT NULL,
  timezone TEXT NOT NULL,
  mode TEXT NOT NULL,
  enabled INTEGER NOT NULL CHECK (enabled IN (0, 1))
) STRICT;

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL
) STRICT;

CREATE TABLE audit_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  application_id TEXT REFERENCES applications(id),
  from_state TEXT,
  to_state TEXT,
  idempotency_key TEXT NOT NULL,
  actor_kind TEXT NOT NULL,
  actor_reference TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_command TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
) STRICT;
`;

export const SECOND_SCHEMA = `
CREATE TABLE run_locks (
  key TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX applications_one_per_job
  ON applications(job_id)
  WHERE job_id IS NOT NULL;

ALTER TABLE application_attempts ADD COLUMN outcome_reason TEXT;
`;

export const THIRD_SCHEMA = `
ALTER TABLE jobs ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE jobs ADD COLUMN href TEXT NOT NULL DEFAULT '';
ALTER TABLE jobs ADD COLUMN skills_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE jobs ADD COLUMN published_at TEXT NOT NULL DEFAULT '';
`;

export const FOURTH_SCHEMA = `
ALTER TABLE drafts ADD COLUMN idempotency_key TEXT;
ALTER TABLE drafts ADD COLUMN disposition TEXT NOT NULL DEFAULT 'drafted';
ALTER TABLE drafts ADD COLUMN review_reasons_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE answers ADD COLUMN fact_id TEXT;
ALTER TABLE answers ADD COLUMN reason TEXT;
CREATE UNIQUE INDEX drafts_idempotency_key ON drafts(idempotency_key) WHERE idempotency_key IS NOT NULL;
`;

export const FIFTH_SCHEMA = `
CREATE TABLE approvals (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  draft_revision TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;
`;

export const SIXTH_SCHEMA = `
ALTER TABLE application_attempts ADD COLUMN run_id TEXT;

CREATE TABLE quota_reservations (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  run_id TEXT NOT NULL,
  reserved_day TEXT NOT NULL,
  reserved_at TEXT NOT NULL
) STRICT;
`;

export function openDatabase(databasePath: string): DatabaseSync {
  mkdirSync(dirname(databasePath), { recursive: true });
  const database = new DatabaseSync(databasePath, {
    enableForeignKeyConstraints: true,
    timeout: 5000
  });
  database.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");
  migrate(database);
  return database;
}

export function closeDatabase(database: DatabaseSync): void {
  database.close();
}

function migrate(database: DatabaseSync): void {
  database.exec("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);");
  const latestRow = database.prepare("SELECT MAX(version) AS version FROM schema_migrations").get() as
    | { version: number | null }
    | undefined;
  const latestVersion = latestRow?.version ?? 0;

  if (latestVersion > LATEST_SCHEMA_VERSION) {
    throw new Error(`Database schema version ${latestVersion} is newer than supported version ${LATEST_SCHEMA_VERSION}.`);
  }

  const migrations: ReadonlyArray<readonly [number, string]> = [
    [INITIAL_SCHEMA_VERSION, INITIAL_SCHEMA],
    [2, SECOND_SCHEMA],
    [3, THIRD_SCHEMA],
    [4, FOURTH_SCHEMA],
    [5, FIFTH_SCHEMA],
    [6, SIXTH_SCHEMA]
  ];
  for (const [version, sql] of migrations) {
    if (version <= latestVersion) {
      continue;
    }
    database.exec("BEGIN IMMEDIATE;");
    try {
      database.exec(sql);
      database.prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
        .run(version, new Date().toISOString());
      database.exec("COMMIT;");
    } catch (error) {
      database.exec("ROLLBACK;");
      throw error;
    }
  }
}

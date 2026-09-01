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

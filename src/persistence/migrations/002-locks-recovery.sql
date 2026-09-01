CREATE TABLE run_locks (
  key TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX applications_one_per_job
  ON applications(job_id)
  WHERE job_id IS NOT NULL;

ALTER TABLE application_attempts ADD COLUMN outcome_reason TEXT;

CREATE TABLE approvals (
  application_id TEXT PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
  draft_id TEXT NOT NULL REFERENCES drafts(id) ON DELETE CASCADE,
  draft_revision TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  approved_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

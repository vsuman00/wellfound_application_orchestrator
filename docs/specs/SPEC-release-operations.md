# Spec: release-operations

Status: `READY FOR REVIEW`

## Objective

Make installation, upgrade, diagnosis, backup, restore, rollback, and support status
predictable for supported macOS and Windows users.

## Public contracts

- `setup`, `doctor`, `backup`, `restore`, and version/migration commands
- release support matrix and compatibility report
- controlled pilot checklist and rollback instructions

## Acceptance criteria

- Clean install and upgrade tests cover both supported operating systems.
- Backup/restore proves application state without exporting browser credentials by default.
- Doctor reports actionable redacted status for Node, browser, session, DB, locks, and Codex.
- Release cannot proceed while any gate in `docs/PROJECT_SPEC.md` lacks evidence.

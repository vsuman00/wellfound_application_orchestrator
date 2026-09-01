# Spec: persistence-audit

Status: `READY FOR REVIEW`

## Objective

Provide transactional local state, migrations, idempotency, cross-process locking,
confirmed evidence, audit events, backup, and recovery through repository ports.

## Public contracts

- job, draft, attempt, schedule, run, and audit repositories
- `RunLock`, `UnitOfWork`, migration runner, backup/restore service
- stable dedupe key derived from canonical Wellfound identity

## Acceptance criteria

- Concurrent runs cannot act on the same job or exceed quota.
- Crash during submission leaves a recoverable `OUTCOME_UNKNOWN`, never false success.
- Migrations are ordered, atomic where supported, and tested from every released schema.
- Database, WAL, backup, and audit files remain outside the repository.

## Open implementation gate

T-006 compares the Node release-candidate SQLite API with a mature supported driver on
both platforms before the driver is accepted.

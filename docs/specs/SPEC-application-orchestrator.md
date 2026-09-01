# Spec: application-orchestrator

Status: `READY FOR REVIEW`

## Objective

Coordinate discovery, matching, drafting, review, explicit approval, one-at-a-time
submission, confirmation, persistence, quota, and audit ports.

## Public contracts

- use cases: `scan`, `draft`, `approve`, `submitApproved`, `summarizeRun`
- idempotent command identifiers and typed run results
- cancellation and deadline propagation

## Acceptance criteria

- Default scheduled invocation ends at draft/review without submit side effects.
- Submission requires an approved stored application id and reacquired run lock.
- Retry behavior differs for retryable, terminal, unknown, and confirmed outcomes.
- Port-fake integration tests prove every transition and audit event.

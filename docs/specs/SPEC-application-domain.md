# Spec: application-domain

Status: `READY FOR REVIEW`

## Objective

Own immutable candidate, job, draft, answer, attempt, outcome, schedule, and run-summary
types plus the valid application state machine.

## Public contracts

- `CandidateProfile`, `JobRecord`, `ApplicationDraft`, `AnswerDecision`
- `ApplicationAttempt`, `SubmissionOutcome`, `ScheduleDefinition`, `RunSummary`
- transition validator for `DISCOVERED` through `CONFIRMED` or failure states

## Acceptance criteria

- Invalid transitions are unrepresentable or rejected with typed errors.
- Only verified evidence can create `CONFIRMED`.
- `OUTCOME_UNKNOWN` cannot consume success quota or be retried as a fresh application.
- Domain code imports no browser, database, Codex, filesystem, or OS implementation.

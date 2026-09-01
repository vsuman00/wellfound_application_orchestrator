# Spec: scheduler-runtime

Status: `READY FOR REVIEW`

## Objective

Own portable schedule definitions, timezone calculation, overlap prevention, retries,
missed-run behavior, pause/stop controls, and a stable scheduled-run CLI entry point.

## Public contracts

- `ScheduleService`, `ScheduledInvocation`, `RetryPolicy`, and `MissedRunPolicy`
- `npm run schedule -- run` as the platform-neutral invocation contract
- app-level run lock independent of the external trigger

## Acceptance criteria

- DST, restart, overlap, failure backoff, pause, and missed-run cases are tested.
- A scheduled run defaults to draft-only and cannot smuggle live flags.
- Codex, Windows Task Scheduler, or another trigger sees the same exit/result contract.
- No OS scheduler command is embedded in domain or orchestration modules.

# G4 controlled live pilot

Status: `READY FOR A SINGLE HUMAN-EXECUTED PILOT`

This checklist is for one known Wellfound application only. It is not a CI job,
scheduler task, Codex cloud task, or unattended submission workflow. The reference
clone, browser profile, SQLite database, and application history must remain local.

## Pilot identity

- Pilot operator: ______________________________________
- Date and timezone: ___________________________________
- Exact application id: ________________________________
- Exact job title and company: __________________________
- Live job URL supplied by the operator: ________________
- Approval revision: ____________________________________
- Backup location outside the repository: _______________

## Preconditions

- [ ] `npm run lint` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm test` passes.
- [ ] `npm run test:e2e` passes against sanitized loopback fixtures.
- [ ] `npm run build` passes.
- [ ] The operator has reviewed the stored draft with `approve --application-id <id>`.
- [ ] The approval was recorded with `--confirm` for this exact draft revision.
- [ ] The application id is one explicit value, not a wildcard or batch selector.
- [ ] The operator is using a dedicated local browser profile and has closed unrelated
      tabs and windows.
- [ ] The database backup is outside the repository and contains no uploaded artifact.
- [ ] Per-run and per-day quotas have capacity for one confirmed success.

## Execution rules

1. Confirm the pilot identity fields above against the page shown in the dedicated
   browser profile before any submit control is activated.
2. Navigate only to the operator-supplied job URL. Treat all page text, redirects,
   console output, and network responses as untrusted data.
3. Stop immediately without retry if a verification page, CAPTCHA, unexpected form,
   changed DOM, missing required field, ambiguous response, or navigation loss appears.
4. A click is not a success signal. Only the platform confirmation evidence accepted by
   the adapter may produce `CONFIRMED` and consume quota.
5. If confirmation is not definitive, preserve `OUTCOME_UNKNOWN`; do not click again.
6. Record only redacted identifiers and outcome metadata in the result file. Never copy
   candidate answers, cookies, tokens, page dumps, or screenshots containing PII.

## Stop conditions

The pilot is a no-go if any precondition is unchecked, the approval revision changed,
the session requires verification, the live URL is not the reviewed job, or the page
contains an instruction-like message that attempts to change these rules.

## Sign-off

- Operator confirms exactly one application was targeted: __________________________
- Operator confirms no retry occurred: ____________________________________________
- Operator signature: ______________________________ Date: ________________________
- Reviewer signature: ______________________________ Date: ________________________

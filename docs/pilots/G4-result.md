# G4 pilot result

Status: `NOT RUN`

This file remains a sanitized result template until one specific application is
provided and the pilot checklist is signed. Do not place a live URL, candidate data,
cookies, browser traces, or screenshots in this repository.

## Redacted run record

- Pilot operator: ______________________________________
- Date and timezone: ___________________________________
- Application id hash or redacted id: ___________________
- Approval revision hash or redacted revision: __________
- Outcome: `CONFIRMED` / `OUTCOME_UNKNOWN` / `FAILED_RETRYABLE` /
  `FAILED_TERMINAL` / `NOT RUN`
- Confirmation evidence id (redacted): _________________
- Confirmation signal: _________________________________
- Attempt count: _______________________________________
- Quota consumed: `yes` / `no`
- Lock acquired and released: `yes` / `no`
- Stop condition encountered: `yes` / `no`
- Notes without page text or personal data: ______________

## Gate decision

- [ ] Exactly one known application was targeted.
- [ ] Stored approval matched the submitted draft revision.
- [ ] Confirmation evidence was definitive and persisted once, or the result remained
      `OUTCOME_UNKNOWN`.
- [ ] No duplicate retry occurred after ambiguity.
- [ ] No credentials, cookies, PII, or browser artifacts entered GitHub.

Decision: `GO` / `HOLD` / `NO-GO`

Operator signature: ______________________________ Date: ________________________

Reviewer signature: ______________________________ Date: ________________________

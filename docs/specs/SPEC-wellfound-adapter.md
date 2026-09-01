# Spec: wellfound-adapter

Status: `READY FOR REVIEW`

## Objective

Translate Wellfound pages into stable domain records and form actions while containing
all volatile locators, navigation rules, and confirmation evidence.

## Public contracts

- `JobBoardPort`: discover, inspect, draft, submit-approved, confirm-outcome
- normalized field descriptions and answer control types
- selector diagnostics with redacted trace references

## Acceptance criteria

- Sanitized fixtures cover empty, paginated, modal, multi-step, blocked, and changed DOM.
- Scan-only never fills or submits; draft-only never activates a submit control.
- Unknown controls and CAPTCHA/verification pages stop safely and request review.
- Success requires a defined platform confirmation signal captured as evidence.

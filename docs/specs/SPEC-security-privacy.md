# Spec: security-privacy

Status: `READY FOR REVIEW`

## Objective

Define PII classification, redaction, storage locations, file permissions, retention,
credential interfaces, and threat controls used by every runtime module.

## Public contracts

- `SecretProvider`, `Redactor`, `RetentionPolicy`, and `SecurePathPolicy`
- typed classifications: public, operational, personal, credential, browser-session
- safe structured logging fields and deletion/retention decisions

## Acceptance criteria

- Logs and errors redact candidate facts, tokens, cookies, and application text.
- Runtime data is outside Git and receives the strongest supported local permissions.
- Secret scans fail on representative credential and browser-state fixtures.
- Page content and LLM output cannot alter tool permissions or policy configuration.

## Boundary

No secret value is returned to page JavaScript, GitHub Actions, Codex cloud, or a log.

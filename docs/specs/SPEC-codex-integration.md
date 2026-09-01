# Spec: codex-integration

Status: `READY FOR REVIEW`

## Objective

Provide a repository-owned Codex skill and prompts that invoke the stable scheduler
command, use ChatGPT subscription authentication locally, and summarize outcomes
without exposing personal data.

## Public contracts

- `.codex/skills/wellfound-run/SKILL.md`
- read-only diagnostics and draft-run invocation; no direct DOM manipulation
- structured redacted `RunSummary` input and human-facing result

## Acceptance criteria

- Subscription-authenticated local scheduled draft succeeds without an API key.
- Core scan/draft commands remain usable when Codex is absent or quota-limited.
- The skill requests only required filesystem/network/process permissions.
- Codex cloud receives source and sanitized fixtures only, never local runtime data.

# Spec: project-foundation

Status: `READY FOR REVIEW`

## Objective

Establish a private, independent Node 24/TypeScript repository whose install, build,
lint, typecheck, test, and managed-browser setup commands behave consistently on
macOS and Windows.

## Public contracts

- npm scripts defined by `docs/PROJECT_SPEC.md`
- deterministic exit-code and structured-error conventions
- OS-safe application data-directory resolver
- dependency and source-provenance record

## Acceptance criteria

- Exact dependencies and lockfile are committed without copying clone code.
- A minimal CLI builds and its smoke test passes locally and in macOS/Windows CI.
- `npm run setup` rejects unsupported Node/OS combinations before side effects.
- Git ignores and secret scanning exclude all runtime and credential artifacts.

## Boundary

This module contains no Wellfound selectors, candidate data, browser profile, LLM
prompt, scheduler behavior, or submission behavior.

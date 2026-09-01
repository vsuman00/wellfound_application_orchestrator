# Project Agent Rules

## Source of truth

Follow, in order:

1. `docs/architecture/CAPABILITY_MAP.md`
2. The selected module specification in `docs/specs/`
3. `tasks/plan.md`
4. The selected task in `tasks/todo.md`

Do not implement work that is not represented in these documents.

## Reference boundary

`../wellfound_autoApply` is read-only. Never edit, stage, clean, reset, copy credentials
from, or run migrations against it. Reference behavior may be re-specified, but source
must not be copied without explicit provenance and review.

## Safety defaults

- Dry-run and draft-only behavior are the defaults.
- Live submission requires an approved application and explicit command intent.
- Unknown, sensitive, demographic, legal, compensation, relocation, and work-
  authorization answers fail closed unless an exact user policy exists.
- A click is not submission evidence. Only a verified platform response may produce
  `CONFIRMED`.
- Never commit PII, cookies, tokens, browser profiles, database files, logs, or API
  keys.

## Engineering rules

- Node.js 24 LTS, npm, strict TypeScript ESM, and pinned dependencies.
- Public commands and configuration behave identically on supported macOS and Windows.
- Use Node APIs for paths and processes; do not put PowerShell or shell syntax in core
  modules.
- Keep Wellfound DOM selectors inside `src/adapters/wellfound`.
- Keep Codex integration outside browser and domain modules.
- Implement one task at a time and update `tasks/todo.md` only after its verification
  evidence passes.
- Do not weaken a test, safety policy, sandbox, or permission boundary to make a task
  pass.

## Verification contract

Once Task `T-001` establishes the scripts, every implementation task must run its
focused tests plus typecheck and lint. Checkpoints run the complete suite on both the
supported macOS and Windows CI jobs.

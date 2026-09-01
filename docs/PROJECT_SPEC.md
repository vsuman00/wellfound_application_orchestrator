# Project Specification: Wellfound Application Orchestrator

Status: `IMPLEMENTATION IN PROGRESS; T-011 COMPLETE LOCALLY; WINDOWS VALIDATION ON HOLD`

## Objective

Build a local-first CLI that safely discovers, evaluates, drafts, schedules, and—with
explicit approval—submits Wellfound applications. The application must preserve a
local browser session, prevent duplicates, distinguish attempted from confirmed
submissions, and produce an auditable run summary without exposing personal data.

Success means the same public npm commands work on supported macOS and Windows systems
with Node installed and no separately installed Google Chrome.

## Accepted assumptions

1. Managed Playwright Chromium is the first browser provider.
2. macOS and Windows are equal first-release targets.
3. `draft-only` is the scheduled default and `approval-required` is the live default.
4. Codex subscription automation is a local optional adapter; Codex cloud and GitHub
   never receive the logged-in Wellfound profile.
5. The repository starts private and the current product name is provisional.
6. There is no verified public Wellfound candidate-application API, so the adapter is
   browser-based and must be treated as change-prone.

## Technology baseline

| Concern | Decision |
|---|---|
| Runtime | Node.js 24.x LTS |
| Language | TypeScript 5.9.3, strict ESM |
| Package manager | npm with committed lockfile and exact dependency versions |
| Browser | Playwright-managed Chromium; exact Playwright patch pinned in T-002 |
| Validation | Runtime schema validation selected and pinned in T-003 |
| Persistence | SQLite behind a repository interface; driver chosen by a macOS/Windows spike in T-006 |
| Unit/integration tests | Vitest version selected and pinned in T-001 |
| Browser fixtures | Playwright against local deterministic HTML fixtures |
| CI | GitHub Actions matrix for macOS and Windows; no live credentials |

Node 24 is an LTS release and Playwright currently supports Node 22, 24, and 26 plus
Windows 11+/Server 2019+ and macOS 14+. Release support follows the pinned dependency
documentation rather than promising every historical OS version.

## Planned commands

```text
npm run setup                         Validate runtime and install managed Chromium
npm run login                         Create or refresh the local Wellfound session
npm run scan -- [filters]             Discover and rank without filling forms
npm run draft -- --job-id <id>        Prepare a non-submitting application draft
npm run apply -- --application-id <id> Submit one explicitly approved application
npm run schedule -- [start|stop|run]  Manage or invoke scheduled draft work
npm run doctor                        Diagnose Node, browser, auth, data, and lock state
npm run build                         Compile TypeScript
npm run typecheck                     Type-check without output
npm run lint                          Run static checks
npm test                              Run unit and integration tests
npm run test:e2e                      Run fixture browser tests only
```

No live command may use `--live` as a broad bypass. Submission takes an explicit
approved application identifier.

## Project structure

```text
src/cli                    Command parsing and exit codes
src/domain                 Stable types, state machine, and outcome contracts
src/config                 Validated user configuration and safe data paths
src/persistence            SQLite repositories, migrations, locks, and audit records
src/browser                Managed browser lifecycle and persistent local session
src/adapters/wellfound     Wellfound navigation, locators, extraction, and confirmation
src/policies               Matching and answer decision policies
src/orchestrator           Use cases coordinating modules through ports
src/scheduler              Schedule, overlap, retry, pause, and missed-run semantics
src/integrations/codex     Codex skill/CLI adapter and run summaries
tests/unit                 Pure domain and policy tests
tests/integration          Persistence and orchestration tests
tests/e2e                  Local fixture browser journeys; never the live site in CI
tests/fixtures/wellfound   Sanitized deterministic HTML fixtures
docs/specs                 Module contracts and success criteria
tasks                      Approved implementation plan and executable backlog
```

## Code style

Use explicit ports, discriminated unions, immutable inputs, and fail-closed outcomes:

```ts
export type SubmissionOutcome =
  | { readonly kind: "confirmed"; readonly evidenceId: string }
  | { readonly kind: "retryable-failure"; readonly reason: string }
  | { readonly kind: "terminal-failure"; readonly reason: string }
  | { readonly kind: "outcome-unknown"; readonly reason: string };
```

No `any`, swallowed exceptions, mutable global configuration, page-injected personal
data, or OS-specific path concatenation is allowed.

## Testing strategy

- Domain and policies: exhaustive unit tests, including invalid transitions.
- Persistence: migration, transaction, idempotency, lock, backup, and recovery tests.
- Browser adapter: sanitized fixtures with semantic locators and saved traces on
  failure.
- Orchestration: port fakes proving retries, quotas, and confirmation semantics.
- Cross-platform: install, build, test, fixture launch, path, and recovery matrix.
- Live Wellfound: manual controlled pilot only after the live-submission gate; never CI.
- Coverage targets are established in T-001 and cannot replace behavior assertions.

## Boundaries

Always:

- Validate configuration before browser launch.
- Store runtime data outside the repository in an OS-appropriate user-data directory.
- Use prepared database statements, restrictive file permissions where supported,
  structured redacted logs, and deterministic identifiers.
- Preserve `OUTCOME_UNKNOWN` until new evidence resolves it.

Ask first:

- Enable policy-constrained unattended submission.
- Add a provider, dependency with native code, migration with data loss risk, or new
  job-board adapter.
- Change quotas, retention, answer classifications, or live permissions.

Never:

- Commit or upload credentials, PII, cookies, profiles, databases, or application
  histories.
- Evade CAPTCHAs, disguise automation, bypass rate limits, or add stealth plugins.
- Auto-answer protected-class questions or invent candidate facts.
- Record success from a click, console message, or URL change alone.

## Project success criteria

1. A clean supported macOS or Windows machine can install with Node/npm and download
   the managed browser without Google Chrome.
2. Login state persists locally and is never placed inside Git or cloud automation.
3. Scan and draft journeys are repeatable against fixtures and survive restart.
4. Duplicate, quota, unknown-answer, sensitive-answer, and concurrent-run protections
   fail closed.
5. Only verified evidence creates `CONFIRMED` and consumes a success quota.
6. Subscription-authenticated Codex can schedule a local draft run without an API key;
   the deterministic Node workflow remains usable without Codex.
7. CI passes on macOS and Windows with no live Wellfound or personal credentials.

## Release gates

- `G0`: This specification and the implementation plan are approved.
- `G1`: Foundation, domain, security, and persistence pass cross-platform CI.
- `G2`: Managed-browser login and scan-only fixture pilot pass.
- `G3`: Draft-only local pilot passes with no submission side effect.
- `G4`: Approval-required controlled live pilot confirms one known application.
- `G5`: Scheduler and Codex subscription pilot pass under least privilege.
- `G6`: Backup, recovery, upgrade, diagnostics, and release checks pass.

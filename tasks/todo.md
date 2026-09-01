# Implementation Backlog

Status: `T-001 COMPLETE; T-002 IMPLEMENTED; T-003 COMPLETE; T-004 COMPLETE; T-005 COMPLETE; T-006 COMPLETE LOCALLY; T-007 COMPLETE LOCALLY; T-008 COMPLETE LOCALLY; T-009 COMPLETE LOCALLY; T-010 COMPLETE LOCALLY; NEXT T-011`

## T-000: Create isolated planning repository

**Status:** Complete

**Acceptance criteria:**

- [x] Independent directory and local Git repository exist under `Welfound_Auto`.
- [x] Accepted architecture, project spec, module specs, plan, and task list are local.
- [x] Reference clone remains clean and unchanged.

**Verification:** `git status` in both repositories and path-boundary inspection.

**Files:** planning and scaffold documents only.

**Dependencies:** None.

## T-001: Bootstrap a compilable cross-platform CLI

**Status:** Complete

**Acceptance criteria:**

- [x] Exact package pins, lockfile, Node 24 engine, strict ESM TypeScript, lint, and test configuration exist.
- [x] A version/help CLI exits deterministically with no browser, network, database, or personal-data access.
- [x] macOS and Windows CI run install, lint, typecheck, test, and build.

**Verification:** Passed `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`,
`npm run build`, `npm run cli -- --help`, and `npm run cli -- --version` on Node
`v26.5.0` (within the declared Node 24–26 range). The lockfile install audited with
zero vulnerabilities. CI matrix is defined in `.github/workflows/ci.yml` for
`macos-latest` and `windows-latest`; hosted runs remain pending publication.

**Likely files:** `package.json`, `package-lock.json`, `tsconfig.json`, `src/cli/main.ts`, `tests/unit/cli.test.ts`.

**Dependencies:** T-000 and plan approval.

**Evidence:** `src/cli/args.ts`, `src/cli/main.ts`, `tests/unit/cli.test.ts`,
`package.json`, `package-lock.json`, TypeScript/lint/Vitest configuration, and
`.github/workflows/ci.yml`.

## T-002: Add runtime preflight and managed-browser installer

**Status:** Implemented; local macOS evidence passed, hosted Windows CI pending.

**Acceptance criteria:**

- [x] Preflight reports supported Node, OS, CPU, and writable home/cache base state.
- [x] Setup installs and verifies the pinned Chromium revision without installed Chrome.
- [x] Unsupported combinations fail before profile or database creation.

**Verification:** 6 focused runtime tests plus 4 CLI tests pass; `npm run setup` installed
and launched managed Chromium on macOS arm64. CI now runs the same setup command on
`macos-latest` and `windows-latest`; hosted Windows evidence is pending because no
remote is configured.

**Likely files:** `src/browser/install.ts`, `src/cli/setup.ts`, `tests/integration/browser-install.test.ts`, `package.json`.

**Dependencies:** T-001.

**Evidence:** `src/browser/install.ts`, `src/cli/setup.ts` (planned entry is currently
handled by the CLI), `tests/unit/browser-install.test.ts`, `package.json`,
`package-lock.json`, and `.github/workflows/ci.yml`.

## T-003: Establish secure paths, redaction, and configuration

**Status:** Complete; local evidence passed.

**Acceptance criteria:**

- [x] Runtime paths resolve outside Git on both platforms.
- [x] Versioned configuration validates before side effects and defaults to draft-only.
- [x] Redaction removes credentials, PII, cookies, and application text from errors/logs.

**Verification:** 9 focused configuration/redaction tests and the full 19-test suite
pass, with lint, both typecheck passes, and build green. Tests prove safe defaults,
invalid timezone/mode/quota/raw-key rejection, secret/email/token/cookie redaction,
and runtime paths outside a repository.

**Likely files:** `src/config/schema.ts`, `src/config/paths.ts`, `src/security/redactor.ts`, `tests/unit/config.test.ts`.

**Dependencies:** T-001.

**Evidence:** `src/config/schema.ts`, `src/config/paths.ts`,
`src/security/redactor.ts`, `tests/unit/config.test.ts`, and
`tests/unit/redactor.test.ts`.

## T-004: Implement domain states and evidence contracts

**Status:** Complete; local evidence passed.

**Acceptance criteria:**

- [x] Stable domain types and legal transitions match the accepted state machine.
- [x] Confirmed outcome construction requires evidence; unknown outcome remains distinct.
- [x] Quota semantics count confirmed successes only.

**Verification:** 5 focused domain tests and the full 24-test suite pass, with lint,
both typecheck passes, and build green. Tests cover the safe progression, retryable and
unknown recovery paths, terminal states, evidence validation, and confirmed-only quota
counting.

**Likely files:** `src/domain/application.ts`, `src/domain/outcome.ts`, `src/domain/state-machine.ts`, `tests/unit/state-machine.test.ts`.

**Dependencies:** T-001.

**Evidence:** `src/domain/state-machine.ts`, `src/domain/outcome.ts`,
`src/domain/application.ts`, and `tests/unit/domain.test.ts`.

## T-005: Define audit and repository ports

**Status:** Complete; local evidence passed.

**Acceptance criteria:**

- [x] Repository, unit-of-work, lock, audit, clock, and identifier ports contain no implementation imports.
- [x] Commands carry deterministic idempotency keys and redacted actor/source metadata.
- [x] Port fakes can exercise a complete scan-to-draft transition.

**Verification:** 2 focused port-contract tests and the full 26-test suite pass, with
lint, both typecheck passes, and build green. The fake journey persists an application,
records state-change audit events, verifies idempotency metadata, and exercises clock,
identifier, lock, and unit-of-work contracts.

**Likely files:** `src/domain/ports.ts`, `src/domain/audit.ts`, `tests/unit/ports.test.ts`.

**Dependencies:** T-003, T-004.

**Evidence:** `src/domain/audit.ts`, `src/domain/ports.ts`, and
`tests/unit/ports.test.ts`.

## T-006: Select the SQLite driver through a portability spike

**Status:** Complete locally; hosted Windows validation pending.

**Acceptance criteria:**

- [x] Candidate drivers are compared for Node 24 status, macOS/Windows installation, transactions, WAL, backup, and maintenance.
- [ ] The chosen driver passes the same focused test on both CI platforms.
- [x] The decision and exact version are recorded before schema code is written.

**Verification:** `node --test spikes/sqlite/test.mjs` passes on macOS arm64 with
Node `v26.5.0`; the ADR records the built-in `node:sqlite` decision, candidate tradeoffs,
and the hosted-Windows evidence still required.

**Likely files:** `docs/architecture/ADR-001-sqlite-driver.md`, `spikes/sqlite/package.json`, `spikes/sqlite/test.mjs`.

**Dependencies:** T-001, T-005.

**Evidence:** `spikes/sqlite/package.json`, `spikes/sqlite/test.mjs`, and
`docs/architecture/ADR-001-sqlite-driver.md`.

## T-007: Add migrations and transactional repositories

**Status:** Complete locally; hosted Windows validation pending.

**Acceptance criteria:**

- [x] Initial schema stores jobs, drafts, answers, attempts, evidence, schedules, runs, and audit events.
- [x] Foreign keys, uniqueness, prepared statements, and transaction rollback are tested.
- [x] Runtime database and WAL remain outside the repository.

**Verification:** 3 persistence integration tests and the full 29-test suite pass, with
lint, both typecheck passes, and build green. Tests verify fresh migration, foreign keys,
canonical job uniqueness, prepared application reads/writes, and rollback-on-error.
The database is created under a temporary external directory and WAL is enabled.

**Likely files:** `src/persistence/database.ts`, `src/persistence/migrations/001-initial.sql`, `src/persistence/repositories.ts`, `tests/integration/persistence.test.ts`.

**Dependencies:** T-006.

**Evidence:** `src/persistence/database.ts`, `src/persistence/migrations/001-initial.sql`,
`src/persistence/repositories.ts`, and `tests/integration/persistence.test.ts`.

## T-008: Add idempotency, locks, backup, and crash recovery

**Status:** Complete locally; hosted Windows validation pending.

**Acceptance criteria:**

- [x] Concurrent run/job acquisition has one winner and releases safely after failure.
- [x] Duplicate Wellfound identity cannot create a second active application.
- [x] Crash during submission produces recoverable outcome-unknown state.

**Verification:** 3 recovery integration tests and the full 32-test suite pass, with lint,
both typecheck passes, and build green. SQLite lock ownership is atomic and expiry-aware;
canonical job identity has a unique application index; interrupted submitting attempts
are recorded with a reason and transition to `OUTCOME_UNKNOWN` in one transaction.
The full concurrent-process and forced-crash matrix remains a hosted Windows/G1 gate.

**Likely files:** `src/persistence/locks.ts`, `src/persistence/recovery.ts`, `src/persistence/backup.ts`, `tests/integration/recovery.test.ts`.

**Dependencies:** T-007.

**Evidence:** `src/persistence/locks.ts`, `src/persistence/recovery.ts`,
`src/persistence/migrations/002-locks-recovery.sql`, and
`tests/integration/recovery.test.ts`.

## Checkpoint G1: Foundation and durable state

- [ ] Full non-browser suite passes on macOS and Windows.
- [ ] Dependency, secret, and provenance audits pass.
- [ ] Human reviews schema, state machine, and recovery evidence.

## T-009: Implement persistent managed-browser sessions

**Status:** Complete locally; hosted Windows validation pending.

**Acceptance criteria:**

- [x] One-time headed login stores only the local managed profile.
- [x] Session health reports ready, logged-out, verification-required, locked, or corrupt.
- [x] Browser shutdown and profile locks are reliable after cancellation or crash.

**Verification:** 3 session-health unit tests and a persistent local-fixture browser
integration test pass. The test writes a synthetic local session marker, closes the
managed context, reopens it, and reads the marker back. No live origin or credentials
are used; hosted Windows browser evidence remains pending.

**Likely files:** `src/browser/provider.ts`, `src/browser/session.ts`, `src/cli/login.ts`, `tests/integration/browser-session.test.ts`.

**Dependencies:** G1, T-002, T-003.

**Evidence:** `src/browser/session.ts`, `tests/unit/browser-session.test.ts`, and
`tests/integration/browser-session.test.ts`.

## T-010: Build sanitized Wellfound fixture journeys

**Status:** Complete locally; hosted Windows validation pending.

**Acceptance criteria:**

- [x] Fixtures cover feed, job detail, modal, questions, submit, confirmation, blocked, and changed DOM.
- [x] Fixture server is local-only and contains no copied personal or authenticated content.
- [x] Browser traces are retained only for fixture failures.

**Verification:** the dedicated `npm run test:e2e` smoke suite passes with 2 tests. It
serves and visits all 8 required scenarios through loopback and asserts that the submit
fixture has one inert submit control with no POST request. Fixtures contain synthetic
content only; hosted Windows browser evidence remains pending.

**Likely files:** `tests/fixtures/wellfound/index.html`, `tests/fixtures/wellfound/scenarios.ts`, `tests/e2e/fixture-server.ts`, `tests/e2e/smoke.spec.ts`.

**Dependencies:** T-009.

**Evidence:** `tests/fixtures/wellfound/scenarios.ts`, `tests/e2e/fixture-server.ts`,
`tests/e2e/smoke.spec.ts`, and `package.json`.

## T-011: Implement scan-only Wellfound adapter

**Acceptance criteria:**

- [ ] Adapter extracts canonical job identity and normalized job facts from fixtures.
- [ ] Pagination/scroll terminates deterministically and deduplicates results.
- [ ] Changed DOM, CAPTCHA-like, and missing-field scenarios stop with typed diagnostics.

**Verification:** scan-only fixture E2E and zero form/submit interaction assertion.

**Likely files:** `src/adapters/wellfound/locators.ts`, `src/adapters/wellfound/scan.ts`, `src/adapters/wellfound/normalize.ts`, `tests/e2e/scan.spec.ts`.

**Dependencies:** T-010, T-005.

## T-012: Implement deterministic matching and persisted scan use case

**Acceptance criteria:**

- [ ] Criteria produce stable include/exclude/score explanations.
- [ ] Freshness, blocklist, duplicate, and budget rules override scores.
- [ ] CLI scan persists one normalized record and emits a redacted summary.

**Verification:** policy matrix unit tests and fixture scan integration test.

**Likely files:** `src/policies/matching.ts`, `src/orchestrator/scan.ts`, `src/cli/scan.ts`, `tests/integration/scan.test.ts`.

**Dependencies:** T-011, T-007.

## Checkpoint G2: Managed browser and scan-only

- [ ] Clean macOS and Windows setup launches managed Chromium without Chrome.
- [ ] Fixture scan ranks, persists, deduplicates, and reports safely.
- [ ] Human reviews selector diagnostics and session storage boundary.

## T-013: Implement answer classification and fact provenance

**Acceptance criteria:**

- [ ] Exact approved facts, review-required, prohibited, and unsupported decisions are distinct.
- [ ] Sensitive/legal/unknown questions and adversarial job text fail closed.
- [ ] Compensation, relocation, sponsorship, and availability require explicit values.

**Verification:** exhaustive answer-policy and prompt-injection-shaped unit fixtures.

**Likely files:** `src/policies/questions.ts`, `src/policies/answers.ts`, `src/domain/answer.ts`, `tests/unit/answer-policy.test.ts`.

**Dependencies:** T-003, T-004.

## T-014: Implement non-submitting form drafting

**Acceptance criteria:**

- [ ] Supported controls receive only approved values and provenance is recorded.
- [ ] Unknown or prohibited controls create review items and stop progression.
- [ ] Draft-only never clicks, focuses, or keyboard-activates a submit control.

**Verification:** fixture E2E across text, select, radio, checkbox, multi-step, and blocked cases.

**Likely files:** `src/adapters/wellfound/forms.ts`, `src/adapters/wellfound/draft.ts`, `src/adapters/wellfound/guards.ts`, `tests/e2e/draft.spec.ts`.

**Dependencies:** T-010, T-013.

## T-015: Complete the persisted draft orchestrator

**Acceptance criteria:**

- [ ] Scan→match→draft/review journey is idempotent and restart-safe.
- [ ] Attempts, answers, review reasons, and audit events commit transactionally.
- [ ] Run summary separates drafted, review-required, skipped, and failed jobs.

**Verification:** port-fake plus fixture-backed orchestration integration tests.

**Likely files:** `src/orchestrator/draft.ts`, `src/orchestrator/run-summary.ts`, `src/cli/draft.ts`, `tests/integration/draft-run.test.ts`.

**Dependencies:** T-012, T-014, T-008.

## Checkpoint G3: Draft-only

- [ ] Full suite passes on macOS and Windows.
- [ ] Fixture instrumentation proves no submit side effect.
- [ ] Human reviews unknown/sensitive question outcomes.

## T-016: Add explicit application approval

**Acceptance criteria:**

- [ ] Approval targets one stored immutable draft revision and expires on material change.
- [ ] CLI displays job, company, answers, risks, and exact next action before approval.
- [ ] Bulk wildcard approval and broad live switches do not exist.

**Verification:** approval revision, expiry, cancellation, and tampering tests.

**Likely files:** `src/domain/approval.ts`, `src/orchestrator/approve.ts`, `src/cli/approve.ts`, `tests/integration/approval.test.ts`.

**Dependencies:** G3.

## T-017: Add single-application submission and confirmation

**Acceptance criteria:**

- [ ] Submit command accepts one approved application id and reacquires locks/quotas.
- [ ] Verified fixture confirmation creates evidence and confirmed state exactly once.
- [ ] Timeout, navigation loss, changed DOM, or ambiguous response creates outcome-unknown.

**Verification:** fixture submit/confirm/failure E2E and duplicate invocation integration tests.

**Likely files:** `src/adapters/wellfound/submit.ts`, `src/adapters/wellfound/confirm.ts`, `src/orchestrator/submit.ts`, `tests/e2e/submit.spec.ts`.

**Dependencies:** T-016, T-008.

## T-018: Run a controlled live pilot

**Acceptance criteria:**

- [ ] Human selects and approves one known application after dry-run review.
- [ ] Live evidence is redacted and confirms exactly one outcome.
- [ ] Any verification page, unexpected form, or ambiguity stops without retry.

**Verification:** signed pilot checklist and sanitized run/evidence report; never CI.

**Likely files:** `docs/pilots/G4-live-pilot.md`, `docs/pilots/G4-result.md`.

**Dependencies:** T-017 and explicit human authorization at pilot time.

## Checkpoint G4: Approval-required live submission

- [ ] Controlled pilot meets confirmed-only semantics.
- [ ] Duplicate, quota, and outcome-unknown recovery checks pass.
- [ ] Human authorizes scheduler work; unattended live remains disabled.

## T-019: Implement portable scheduling semantics

**Acceptance criteria:**

- [ ] Timezone, DST, overlap, retry, missed-run, pause, and restart behavior is deterministic.
- [ ] Scheduled invocation defaults to draft-only and rejects submission parameters.
- [ ] External triggers receive stable exit codes and structured redacted summaries.

**Verification:** fake-clock unit tests and concurrent scheduled-run integration tests.

**Likely files:** `src/scheduler/service.ts`, `src/scheduler/policy.ts`, `src/cli/schedule.ts`, `tests/integration/scheduler.test.ts`.

**Dependencies:** G4, T-015.

## T-020: Implement the repository Codex skill

**Acceptance criteria:**

- [ ] Skill invokes diagnostics and the stable draft schedule command only.
- [ ] Skill explains permissions, local-profile boundary, failure handling, and summaries.
- [ ] Core CLI behavior is unchanged when Codex is absent.

**Verification:** skill validation plus a dry local Codex invocation with sanitized fixtures.

**Likely files:** `.codex/skills/wellfound-run/SKILL.md`, `.codex/skills/wellfound-run/references/run-contract.md`, `tests/integration/codex-contract.test.ts`.

**Dependencies:** T-019.

## T-021: Validate subscription-authenticated scheduled automation

**Acceptance criteria:**

- [ ] ChatGPT-authenticated local scheduled draft runs without an API key.
- [ ] Machine/app unavailable, quota-limited, permission-denied, and missed-run states are reported truthfully.
- [ ] No browser profile, database, candidate config, or auth cache reaches cloud/GitHub.

**Verification:** macOS and Windows manual setup checklists plus sanitized scheduled-run evidence.

**Likely files:** `docs/pilots/G5-codex-macos.md`, `docs/pilots/G5-codex-windows.md`, `docs/setup/codex-automation.md`.

**Dependencies:** T-020 and suitable ChatGPT plan/workspace access.

## Checkpoint G5: Scheduler and Codex

- [ ] Scheduled draft behavior and overlap prevention pass on both platforms.
- [ ] Subscription pilot passes without API billing.
- [ ] Unattended live submission remains absent and disabled.

## T-022: Harden GitHub CI, audits, and review

**Acceptance criteria:**

- [ ] macOS/Windows matrix runs deterministic install, lint, typecheck, tests, build, and fixture browser smoke.
- [ ] Dependency, license, provenance, and secret checks gate pull requests.
- [ ] Workflows use minimal permissions and no live/personal credentials.

**Verification:** clean GitHub workflow run and permissions/secret review.

**Likely files:** `.github/workflows/ci.yml`, `.github/workflows/security.yml`, `.github/dependabot.yml`, `docs/security/ci-threat-model.md`.

**Dependencies:** G2; finalize after G5.

## T-023: Add doctor, backup, restore, and support report

**Acceptance criteria:**

- [ ] Doctor reports redacted Node, OS, browser, session, DB, lock, config, and Codex status.
- [ ] Backup/restore preserves durable application state without browser credentials by default.
- [ ] Corrupt/incompatible data fails safely with recovery instructions.

**Verification:** clean, degraded, corrupt, backup, and restore integration journeys on both OSes.

**Likely files:** `src/cli/doctor.ts`, `src/cli/backup.ts`, `src/cli/restore.ts`, `tests/integration/operations.test.ts`.

**Dependencies:** T-008, T-009, T-019.

## T-024: Package and verify installation/upgrades

**Acceptance criteria:**

- [ ] Package contains compiled code, migrations, notices, and skill only.
- [ ] Clean install and previous-version upgrade pass on macOS and Windows.
- [ ] Rollback, support matrix, checksum, and release checklist are documented.

**Verification:** unpacked artifact inspection plus clean install/upgrade CI jobs.

**Likely files:** `package.json`, `docs/setup/install.md`, `docs/setup/upgrade.md`, `docs/releases/checklist.md`.

**Dependencies:** T-022, T-023.

## T-025: Add optional API-funded drafting provider

**Acceptance criteria:**

- [ ] API mode is opt-in, clearly billed separately, and receives minimum redacted context.
- [ ] Key exists only in the credential provider/process scope and never reaches page/log/repo.
- [ ] Provider output stays a draft and cannot approve facts or submission.

**Verification:** fake-provider contract tests, secret-leak tests, and an explicitly authorized API smoke test.

**Likely files:** `src/integrations/openai/provider.ts`, `src/security/secret-provider.ts`, `tests/integration/api-provider.test.ts`, `docs/setup/api-mode.md`.

**Dependencies:** T-013, T-003; may be deferred past G6.

## Checkpoint G6: Release readiness

- [ ] All project success criteria have linked evidence.
- [ ] macOS and Windows install/upgrade/recovery matrices pass.
- [ ] No open high-risk security, false-confirmation, or data-loss finding remains.
- [ ] Controlled release and rollback are approved.

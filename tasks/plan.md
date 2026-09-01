# Implementation Plan: Wellfound Application Orchestrator

Status: `T-001 COMPLETE; T-002 IMPLEMENTED; T-003 COMPLETE; T-004 COMPLETE; T-005 COMPLETE; T-006 COMPLETE LOCALLY; T-007 COMPLETE LOCALLY; T-008 COMPLETE LOCALLY; T-009 COMPLETE LOCALLY; T-010 COMPLETE LOCALLY; T-011 COMPLETE LOCALLY; T-012 COMPLETE LOCALLY; T-013 COMPLETE LOCALLY; T-014 COMPLETE LOCALLY; T-015 COMPLETE LOCALLY; T-016 PARTIAL; G2/G3 PENDING`

## Overview

Build the product as risk-first vertical slices. First establish a reproducible
cross-platform CLI and safe state model. Then prove the managed browser against local
fixtures, add scan and draft journeys, and only later add explicit one-application
submission, scheduling, Codex, GitHub, and release operations.

## Architecture decisions

- Strict TypeScript ESM on Node 24 LTS, with npm and exact lockfile pins.
- Hexagonal boundaries: domain/use cases depend on ports, not Playwright, SQLite, or
  Codex implementations.
- Managed Playwright Chromium only for MVP; no installed Chrome and no stealth layer.
- Runtime state is local and outside Git; GitHub and Codex cloud never receive it.
- SQLite driver selection is gated by an explicit macOS/Windows compatibility spike
  because Node's built-in SQLite remains release-candidate status.
- Browser tests use deterministic local fixtures. The live site is a gated pilot, not
  a CI dependency.
- Draft-only is scheduled default. A live command accepts one previously approved
  application id rather than a broad live-mode switch.
- Codex triggers and summarizes stable Node commands; it does not own selectors,
  state, quotas, or confirmation logic.

## Dependency graph

```text
toolchain
  |-- security + configuration
  |-- application domain
          |-- persistence + locking
          |-- browser runtime
                  `-- Wellfound scan adapter
          |-- matching policy
          `-- answer policy

scan adapter + policies + persistence
  `-- draft orchestrator
          `-- approval + confirmed submission
                  `-- scheduler
                          `-- Codex integration

all verified slices
  |-- GitHub CI/review
  `-- diagnostics, backup, upgrade, release
```

## Phases and checkpoints

### Phase A: Foundation and durable state

Tasks `T-001` through `T-008` establish the toolchain, safe data paths, configuration,
domain state machine, persistence driver, migrations, idempotency, and run locking.

Checkpoint `G1`: full unit/integration suite passes on macOS and Windows; no browser or
live-site dependency exists.

### Phase B: Managed browser and scan-only slice

Tasks `T-009` through `T-012` install managed Chromium, preserve a local session, build
sanitized page fixtures, extract jobs, and rank them deterministically.

Checkpoint `G2`: a clean machine can set up, launch fixture Chromium, scan, deduplicate,
rank, persist, and summarize without Google Chrome or form side effects.

### Phase C: Safe drafting slice

Tasks `T-013` through `T-015` classify questions, fill only approved facts, and persist
draft/review decisions without clicking submit.

Checkpoint `G3`: draft-only fixture E2E proves every submit control remains untouched,
including unknown, sensitive, changed-DOM, and CAPTCHA-like fixtures.

### Phase D: Approval and confirmed submission

Tasks `T-016` through `T-018` add explicit approval, single-id submission, confirmation
evidence, outcome-unknown recovery, and one controlled manual live pilot.

Checkpoint `G4`: one known application is confirmed without duplicate or quota error;
any ambiguous result remains outcome-unknown.

### Phase E: Scheduling and Codex

Tasks `T-019` through `T-021` implement portable scheduling semantics, the repository
Codex skill, subscription-authenticated local scheduling, and redacted summaries.

Checkpoint `G5`: scheduled draft runs pass on macOS and Windows with overlap prevention;
the Codex pilot uses ChatGPT auth and no API key.

### Phase F: Engineering automation and release

Tasks `T-022` through `T-025` add CI/audits, diagnostics, backup/restore, packaging, and
the optional API-funded drafting adapter.

Checkpoint `G6`: clean install, upgrade, recovery, audit, and release checks pass with
no personal artifacts in source or release bundles.

## Sequential and parallel work

- Sequential: T-001→T-008, T-009→T-011, T-013→T-018, and T-019→T-021.
- After G1: fixture authoring can progress alongside matching-policy unit tests once
  domain contracts are frozen.
- After G3: GitHub CI hardening can progress alongside approval-flow work, but live
  pilot work stays sequential.
- Shared schema, state machine, public CLI, and permission changes always require
  coordination and an updated spec first.

## Verification policy

- Each task runs focused tests plus `npm run typecheck` and `npm run lint` once those
  scripts exist.
- Every 2–3 implementation tasks end in a full-suite checkpoint.
- Browser changes retain trace/screenshot evidence only from sanitized fixtures.
- Live tests require explicit human presence and never run from CI or Codex cloud.
- A task is complete only when its acceptance criteria and verification evidence are
  recorded in `tasks/todo.md` or linked from it.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Wellfound DOM changes | High | Adapter-only locators, fixtures, diagnostics, fail closed |
| Terms/rate-limit enforcement | High | No evasion, low budgets, manual login, safe stop, user review |
| False submission success | High | Evidence contract and explicit outcome-unknown state |
| Unsafe or invented answers | High | Approved fact provenance and prohibited/review classifications |
| Cross-platform browser/profile differences | High | Clean macOS/Windows matrix before adapter work |
| Duplicate/concurrent applications | High | DB uniqueness, transaction, run/job locks, idempotency keys |
| SQLite driver incompatibility | Medium | T-006 spike before schema implementation |
| Codex plan availability or quota | Medium | Core deterministic Node workflow remains independent |
| Credential/PII leakage | High | External data paths, redaction, secret scans, no cloud profile |
| Scheduled machine unavailable | Medium | Missed-run policy and clear run status; no false completion |

## Deferred scope

- Unattended policy-constrained live submission.
- Firefox, WebKit, branded Chrome, or Edge providers.
- Additional job boards.
- Web dashboard or mobile application.
- CAPTCHA solving, stealth plugins, fingerprint evasion, or rate-limit bypass.

These require separate capability-map revisions and approval.

## Start point

The plan was approved for implementation. T-001 through T-011 now provide the
compilable CLI, managed-browser setup, secure runtime boundaries, immutable domain
contracts, infrastructure port contracts, the SQLite driver decision, and transactional
local persistence with lock and recovery primitives, plus persistent managed sessions.
The local sanitized fixture journeys, scan-only adapter, matching policy, persistence
bridge, and loopback-only `scan` CLI are implemented. G2 remains pending because hosted
Windows validation is on hold.

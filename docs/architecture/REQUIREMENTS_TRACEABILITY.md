# Requirements Traceability

Status: `IMPLEMENTATION NOT STARTED`

| Id | Requirement | Primary owner | Evidence needed for completion |
|---|---|---|---|
| `R-001` | Never modify the clone | Project boundary | Clone stays clean at the reviewed commit through release |
| `R-002` | Independent project | `project-foundation` | Separate Git history, build, tests, and provenance |
| `R-003` | No installed Chrome prerequisite | `browser-runtime` | Clean macOS and Windows managed-browser install/login tests |
| `R-004` | Same public Node/npm workflow on macOS and Windows | `project-foundation` | Cross-platform command and fixture CI matrix |
| `R-005` | Configured automatic runs | `scheduler-runtime` | Timezone, overlap, retry, missed-run, pause, restart tests |
| `R-006` | Codex subscription path without API key | `codex-integration` | Local scheduled draft pilot with ChatGPT auth |
| `R-007` | Optional API-key path | `codex-integration` | Scoped credential storage and provider tests |
| `R-008` | GitHub engineering automation | `github-integration` | Least-privilege CI, audits, review, release workflow |
| `R-009` | Discovery through confirmed outcome | `application-orchestrator` | Fixture E2E plus gated controlled live pilot |
| `R-010` | Safe answers | `answer-policy` | Restricted and unknown questions cannot auto-submit |
| `R-011` | Confirmed-only success records | `persistence-audit` | Evidence and quota integration tests |
| `R-012` | Protect PII, cookies, and credentials | `security-privacy` | Secret scan, permissions, redaction, retention tests |
| `R-013` | Recover safely after crash or restart | `persistence-audit` | Lock, transaction, outcome-unknown, backup/restore tests |
| `R-014` | Preserve useful reference behavior without copying defects | All modules | Gap-to-test audit and provenance review |

Planning documents are evidence of intent only. A requirement moves to complete only
when the stated tests or controlled pilot evidence exists.

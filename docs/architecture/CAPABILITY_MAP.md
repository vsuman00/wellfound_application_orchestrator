# Accepted Capability Map

Status: `ACCEPTED 2026-09-01`

| Module id | Responsibility | Depends on |
|---|---|---|
| `project-foundation` | Repository, Node toolchain, commands, CI, packaging, provenance | None |
| `security-privacy` | Secrets, PII, redaction, permissions, retention, threat boundaries | `project-foundation` |
| `application-domain` | Stable types, state machine, quotas, outcomes, ports | `project-foundation` |
| `configuration` | Candidate profile, job criteria, answer rules, runtime settings | `application-domain`, `security-privacy` |
| `persistence-audit` | SQLite state, migrations, idempotency, locks, audit history | `application-domain`, `security-privacy` |
| `browser-runtime` | Managed browser, local profile, session health | `configuration`, `security-privacy` |
| `wellfound-adapter` | Navigation, extraction, form inspection, confirmation evidence | `browser-runtime`, `application-domain` |
| `matching-policy` | Filtering, ranking, freshness, exclusions, budgets | `configuration`, `application-domain` |
| `answer-policy` | Approved facts, restricted questions, review decisions, LLM boundary | `configuration`, `application-domain`, `security-privacy` |
| `application-orchestrator` | End-to-end use cases and state coordination | Adapter and policy modules, `persistence-audit` |
| `scheduler-runtime` | Schedules, locking, retries, missed runs, pause/stop | `application-orchestrator` |
| `codex-integration` | Project skill, subscription scheduling, optional API mode, summaries | `scheduler-runtime`, `security-privacy` |
| `github-integration` | Cross-platform CI, audits, review, packaging | `project-foundation`, `security-privacy` |
| `release-operations` | Install, update, backup, recovery, diagnostics, release gates | All modules |

Build order follows the table. Downstream modules may depend only on upstream public
contracts; DOM selectors remain in `wellfound-adapter`, and Codex never manipulates
forms directly.

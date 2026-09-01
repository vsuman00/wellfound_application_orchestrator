# ADR-001: Select the SQLite driver

Status: `ACCEPTED FOR T-006; WINDOWS HOSTED VALIDATION PENDING`

Date: 2026-09-01

## Context

The runtime must support Node.js 24 and 26 on macOS and Windows without requiring
native build tools or an additional database service. Persistence needs prepared
statements, transactions, WAL, backups, foreign keys, and predictable maintenance.

## Candidates

| Candidate | Node 24/26 status | macOS/Windows installation | Transactions/WAL | Maintenance tradeoff |
|---|---|---|---|---|
| Node `node:sqlite` `DatabaseSync` | Available in Node 22.5+; release-candidate API in Node 24/26 | No package or native postinstall | SQLite transactions and WAL are available through the synchronous API | Lowest install risk and one supported runtime; API stability must be rechecked on Node upgrades |
| `better-sqlite3` | Mature native addon; exact Node 24/26 prebuild coverage must be checked per release | May use prebuilds, otherwise requires a platform toolchain | Strong synchronous transaction/WAL support and backup helpers | Native ABI and prebuild availability add upgrade risk |
| `sqlite3` | Mature native addon with async API | May use prebuilds, otherwise requires a platform toolchain | Transactions/WAL supported through SQL | More callback/async surface and native install risk |

Sources: [Node.js `node:sqlite` API](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html),
[Node.js release schedule](https://nodejs.org/en/about/previous-releases),
[better-sqlite3](https://github.com/WiseLibs/better-sqlite3), and
[node-sqlite3](https://github.com/TryGhost/node-sqlite3).

## Decision

Use Node's built-in `node:sqlite` `DatabaseSync` behind the existing repository and
unit-of-work ports. Do not expose `DatabaseSync` from domain modules. Keep the driver
choice behind a persistence adapter so a future stable API or native-driver decision
does not change use cases.

The portability smoke test is `spikes/sqlite/test.mjs`. It creates a temporary database,
executes prepared inserts, and verifies WAL mode. It passed locally on macOS arm64 with
Node `v26.5.0`. Hosted Windows validation remains a required CI gate before T-007.

## Consequences

- Clean setup has no SQLite package download or compiler dependency.
- Node 24 and 26 remain the only supported runtime majors until the API is re-evaluated.
- The release checklist must include a Node upgrade compatibility check because the API
  is release-candidate status.
- Schema, backup, and recovery code remain unimplemented until T-007/T-008.

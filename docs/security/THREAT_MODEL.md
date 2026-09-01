# Initial Threat Model

Status: `PLANNED; CONTROLS NOT YET IMPLEMENTED`

| Asset | Primary threats | Required control |
|---|---|---|
| Wellfound session | Theft, upload, accidental commit | External local profile, ignore rules, permissions, no cloud path |
| Candidate facts | Logs, page injection, prompt leakage | Classification, minimum disclosure, redaction, approved provenance |
| API/Codex auth | Environment or repository exposure | Credential provider, scoped process, never page or CI artifact |
| Application state | Duplicate, corruption, false success | Transactions, idempotency, locks, confirmation evidence, backup |
| Browser actions | Changed DOM, malicious job text, prompt injection | Adapter isolation, fixtures, allowlisted actions, fail closed |
| Scheduled execution | Excess permission, overlap, silent failure | Least privilege, run lock, stable exits, truthful summaries |
| Supply chain | Malicious dependency/action | Exact pins, lockfile, provenance/license/audit gates |

CAPTCHA solving, stealth behavior, fingerprint evasion, and rate-limit bypass are
explicitly outside the authorized design.

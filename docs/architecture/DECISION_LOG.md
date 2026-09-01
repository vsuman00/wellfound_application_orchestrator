# Accepted Decision Log

Status: `ACCEPTED 2026-09-01`

| Id | Accepted decision |
|---|---|
| `D-001` | The reference clone is immutable; this is an independent repository. |
| `D-002` | Playwright-managed Chromium is the default; installed Chrome is not required. |
| `D-003` | Other browser providers are later compatibility work, not MVP scope. |
| `D-004` | Local Codex may authenticate through a ChatGPT subscription. |
| `D-005` | API-key mode is optional and secrets stay outside the repository. |
| `D-006` | The app owns schedule semantics; Codex can provide the local trigger. |
| `D-007` | GitHub handles engineering automation, never the live browser session. |
| `D-008` | Draft-only is scheduled default; approval is required for live submission. |
| `D-009` | macOS and Windows are equal first-release targets. |
| `D-010` | “Open I Cloud” is interpreted as Codex cloud; Apple iCloud is out of scope. |
| `D-011` | The repository begins private; no remote is created by this scaffold. |
| `D-012` | “Wellfound Application Orchestrator” is provisional until release naming. |
| `D-013` | No stealth plugin, CAPTCHA bypass, or anti-detection behavior is permitted. |
| `D-014` | The core Node workflow works without Codex; Codex is an optional orchestration adapter. |
| `D-015` | T-001 uses stable TypeScript 5.9.3 because the current typed-ESLint toolchain supports TypeScript below 6.1; a future compiler upgrade requires a compatibility task. |

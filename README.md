# Wellfound Application Orchestrator

This is the independent successor project for safe, local Wellfound application
automation. It is intentionally separate from the reference clone.

## Current state

`FOUNDATION SLICE IMPLEMENTED / AUTOMATION NOT IMPLEMENTED`

The repository structure, accepted architecture, module specifications, implementation
plan, and task backlog exist. T-001 provides a tested version/help CLI and local
quality gates. No command currently logs in to Wellfound, scans jobs, fills forms, or
submits an application.

## Repository boundaries

- This repository: implementation target.
- `../wellfound_autoApply`: immutable behavioral reference at commit
  `eca64b838019f9ac444c57c15fdaa3dd0258c90b`.
- `../wellfound_application_orchestrator_blueprint`: approved Phase 0 design history.

Nothing may import code, credentials, browser profiles, or runtime data from either
sibling directory.

## Intended user experience

The supported runtime target is Node.js 24 LTS on current Playwright-supported macOS
and Windows versions. Users will not install Google Chrome. Project setup will install
the pinned managed Chromium build for the current OS and CPU.

Planned commands:

```text
npm run setup
npm run login
npm run scan
npm run draft
npm run apply -- --application-id <id>
npm run schedule
npm run doctor
```

The `setup`, `build`, `typecheck`, `lint`, `test`, and foundation CLI commands are
implemented. Browser login, scanning, drafting, scheduling, and submission remain
future tasks.

## Start here

1. Review `docs/PROJECT_SPEC.md`.
2. Review module specifications under `docs/specs/`.
3. Review `tasks/plan.md` and `tasks/todo.md`.
4. Review T-001 evidence, then start Task `T-002` for managed-browser setup.

## Authoritative sources

- Node.js release status: <https://nodejs.org/en/about/previous-releases>
- Playwright installation and support: <https://playwright.dev/docs/intro>
- Playwright browser management: <https://playwright.dev/docs/browsers>
- TypeScript 5.9: <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html>
- Codex authentication: <https://learn.chatgpt.com/docs/auth>
- Codex scheduled tasks: <https://learn.chatgpt.com/docs/automations?surface=app>
- Codex non-interactive mode: <https://learn.chatgpt.com/docs/non-interactive-mode>

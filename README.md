# Wellfound Application Orchestrator

This is the independent successor project for safe, local Wellfound application
automation. It is intentionally separate from the reference clone.

## Current state

`LOCAL AUTOMATION SLICES IMPLEMENTED / WINDOWS VALIDATION ON HOLD`

The repository structure, accepted architecture, module specifications, implementation
plan, and task backlog exist. The local fixture-backed scan, draft, approval, and
single-application submission slices are implemented. Live Wellfound use remains a
manual gated pilot, and hosted Windows validation is intentionally on hold.

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
npm run submit -- --application-id <id>
npm run schedule
npm run doctor
```

The `setup`, `build`, `typecheck`, `lint`, `test`, scan, draft, approval, and fixture
submission paths are implemented. Login, scheduling, live-provider validation, and
Codex integration remain future tasks.

## Start here

1. Review `docs/PROJECT_SPEC.md`.
2. Review module specifications under `docs/specs/`.
3. Review `tasks/plan.md` and `tasks/todo.md`.
4. Review the completed task evidence, then continue with the controlled live-pilot
   checklist only when explicitly authorized.

## Authoritative sources

- Node.js release status: <https://nodejs.org/en/about/previous-releases>
- Playwright installation and support: <https://playwright.dev/docs/intro>
- Playwright browser management: <https://playwright.dev/docs/browsers>
- TypeScript 5.9: <https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html>
- Codex authentication: <https://learn.chatgpt.com/docs/auth>
- Codex scheduled tasks: <https://learn.chatgpt.com/docs/automations?surface=app>
- Codex non-interactive mode: <https://learn.chatgpt.com/docs/non-interactive-mode>

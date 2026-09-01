# Spec: github-integration

Status: `READY FOR REVIEW`

## Objective

Provide least-privilege CI, dependency/secret auditing, review, and release workflows
without attempting live Wellfound automation.

## Public contracts

- macOS and Windows validation matrix
- immutable action versions and minimal job permissions
- optional Codex Action confined to trusted engineering events and API billing

## Acceptance criteria

- CI installs, typechecks, lints, tests, builds, and launches fixture Chromium on both OSes.
- No workflow references a browser profile, candidate config, application database, or
  ChatGPT cached authentication.
- Pull-request-controlled input cannot access secrets or a personal runner.
- Release artifacts contain compiled code and notices only.

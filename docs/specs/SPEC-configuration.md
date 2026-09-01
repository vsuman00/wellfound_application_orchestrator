# Spec: configuration

Status: `READY FOR REVIEW`

## Objective

Load and validate candidate facts, job criteria, quotas, timezones, answer rules, data
paths, and feature flags before any browser or persistence side effect.

## Public contracts

- versioned `AppConfig` schema and validation errors
- candidate-fact provenance and per-answer approval classification
- safe defaults: draft-only, zero unattended submissions, explicit timezone

## Acceptance criteria

- Missing or contradictory facts fail with actionable field-level messages.
- Environment variables may reference secrets but cannot contain the complete profile.
- Unknown keys, unsafe live defaults, invalid timezones, and negative quotas fail.
- A sanitized example configuration contains no real candidate information.

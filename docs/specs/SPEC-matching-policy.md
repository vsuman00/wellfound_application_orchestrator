# Spec: matching-policy

Status: `READY FOR REVIEW`

## Objective

Deterministically filter and rank normalized jobs using explicit candidate criteria,
freshness, exclusions, deduplication, and run/daily budgets.

## Public contracts

- `MatchDecision` with score, included facts, exclusions, and explanation
- canonical normalization for title, company, location, skills, and age
- deterministic ordering with stable tie-breaking

## Acceptance criteria

- The same inputs always produce the same decision and explanation.
- Blocklists, age limits, duplicate identity, and budgets override positive scores.
- Missing information lowers confidence or requests review; it never invents a match.
- Pure unit tests require no browser, database, network, or LLM.

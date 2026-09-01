# Spec: answer-policy

Status: `IMPLEMENTED LOCALLY; WINDOWS VALIDATION ON HOLD`

## Objective

Answer only from approved candidate facts, classify unsafe questions, and use an LLM
only for bounded drafting that cannot create or approve facts.

## Public contracts

- `AnswerDecision`: exact answer, review-required, prohibited, or unsupported
- question classifier and fact-provenance record
- optional `DraftingProvider` receiving the minimum redacted context

## Acceptance criteria

- Protected-class, sensitive, legal, and unknown questions cannot reach auto-submit.
- Compensation, relocation, sponsorship, and availability require exact policy values.
- LLM text is validated and marked as a draft; it cannot change decision class.
- Tests cover adversarial job text and prompt-injection-shaped questions.

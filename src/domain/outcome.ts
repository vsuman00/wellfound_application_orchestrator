export interface ConfirmationEvidence {
  readonly evidenceId: string;
  readonly observedAt: string;
  readonly signal: string;
  readonly detail: string;
}

export type ConfirmedOutcome = {
  readonly kind: "confirmed";
  readonly evidence: ConfirmationEvidence;
};

export type SubmissionOutcome =
  | ConfirmedOutcome
  | { readonly kind: "failed-retryable"; readonly reason: string }
  | { readonly kind: "failed-terminal"; readonly reason: string }
  | { readonly kind: "outcome-unknown"; readonly reason: string };

export function confirmedOutcome(evidence: ConfirmationEvidence): ConfirmedOutcome {
  if (evidence.evidenceId.trim().length === 0) {
    throw new Error("Confirmation evidence must include an evidenceId.");
  }
  if (evidence.observedAt.trim().length === 0) {
    throw new Error("Confirmation evidence must include an observedAt timestamp.");
  }
  if (evidence.signal.trim().length === 0) {
    throw new Error("Confirmation evidence must include a signal.");
  }
  if (evidence.detail.trim().length === 0) {
    throw new Error("Confirmation evidence must include detail.");
  }

  return { kind: "confirmed", evidence };
}

export function countsTowardQuota(outcome: SubmissionOutcome): boolean {
  return outcome.kind === "confirmed";
}

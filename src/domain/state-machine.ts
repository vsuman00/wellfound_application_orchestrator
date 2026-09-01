export const applicationStates = [
  "DISCOVERED",
  "MATCHED",
  "DRAFTED",
  "REVIEW_REQUIRED",
  "APPROVED",
  "SUBMITTING",
  "CONFIRMED",
  "FAILED_RETRYABLE",
  "FAILED_TERMINAL",
  "OUTCOME_UNKNOWN"
] as const;

export type ApplicationState = (typeof applicationStates)[number];

const transitions: Readonly<Record<ApplicationState, readonly ApplicationState[]>> = {
  DISCOVERED: ["MATCHED"],
  MATCHED: ["DRAFTED"],
  DRAFTED: ["REVIEW_REQUIRED"],
  REVIEW_REQUIRED: ["APPROVED"],
  APPROVED: ["SUBMITTING"],
  SUBMITTING: ["CONFIRMED", "FAILED_RETRYABLE", "FAILED_TERMINAL", "OUTCOME_UNKNOWN"],
  CONFIRMED: [],
  FAILED_RETRYABLE: ["SUBMITTING"],
  FAILED_TERMINAL: [],
  OUTCOME_UNKNOWN: ["SUBMITTING"]
};

export function canTransition(from: ApplicationState, to: ApplicationState): boolean {
  return transitions[from].includes(to);
}

export function transitionState(from: ApplicationState, to: ApplicationState): ApplicationState {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid application transition: ${from} -> ${to}.`);
  }

  return to;
}

import {
  transitionState,
  type ApplicationState
} from "./state-machine.js";
import {
  confirmedOutcome,
  type ConfirmationEvidence
} from "./outcome.js";

export interface ApplicationRecord {
  readonly id: string;
  readonly jobId?: string;
  readonly state: ApplicationState;
  readonly confirmedEvidenceId?: string;
}

export function createApplication(id: string): ApplicationRecord {
  if (id.trim().length === 0) {
    throw new Error("Application id must not be empty.");
  }

  return { id, state: "DISCOVERED" };
}

export function transitionApplication(
  application: ApplicationRecord,
  nextState: ApplicationState,
  evidence?: ConfirmationEvidence
): ApplicationRecord {
  const state = transitionState(application.state, nextState);

  if (nextState === "CONFIRMED") {
    if (evidence === undefined) {
      throw new Error("CONFIRMED requires platform confirmation evidence.");
    }

    const outcome = confirmedOutcome(evidence);
    return {
      id: application.id,
      ...(application.jobId === undefined ? {} : { jobId: application.jobId }),
      state,
      confirmedEvidenceId: outcome.evidence.evidenceId
    };
  }

  return {
    id: application.id,
    ...(application.jobId === undefined ? {} : { jobId: application.jobId }),
    state
  };
}

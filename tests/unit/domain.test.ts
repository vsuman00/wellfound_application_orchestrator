import { describe, expect, it } from "vitest";
import {
  canTransition,
  transitionState,
  type ApplicationState
} from "../../src/domain/state-machine.js";
import {
  confirmedOutcome,
  countsTowardQuota,
  type ConfirmationEvidence
} from "../../src/domain/outcome.js";
import {
  createApplication,
  transitionApplication
} from "../../src/domain/application.js";

const evidence: ConfirmationEvidence = {
  evidenceId: "evidence-123",
  observedAt: "2026-09-01T10:00:00.000Z",
  signal: "confirmation-page",
  detail: "Application received"
};

describe("application state machine", () => {
  it("allows the safe draft-to-confirmed path", () => {
    const path: readonly ApplicationState[] = [
      "DISCOVERED",
      "MATCHED",
      "DRAFTED",
      "REVIEW_REQUIRED",
      "APPROVED",
      "SUBMITTING",
      "CONFIRMED"
    ];

    for (let index = 1; index < path.length; index += 1) {
      expect(canTransition(path[index - 1]!, path[index]!)).toBe(true);
    }
  });

  it("rejects skipping review or moving out of terminal states", () => {
    expect(canTransition("DRAFTED", "APPROVED")).toBe(false);
    expect(canTransition("CONFIRMED", "SUBMITTING")).toBe(false);
    expect(() => transitionState("DRAFTED", "APPROVED")).toThrow(
      "Invalid application transition: DRAFTED -> APPROVED."
    );
  });

  it("permits retryable and unknown outcomes to re-enter submission only", () => {
    expect(canTransition("FAILED_RETRYABLE", "SUBMITTING")).toBe(true);
    expect(canTransition("OUTCOME_UNKNOWN", "SUBMITTING")).toBe(true);
    expect(canTransition("FAILED_TERMINAL", "SUBMITTING")).toBe(false);
    expect(canTransition("OUTCOME_UNKNOWN", "CONFIRMED")).toBe(false);
  });
});

describe("application outcomes", () => {
  it("requires non-empty confirmation evidence and consumes quota only when confirmed", () => {
    const outcome = confirmedOutcome(evidence);

    expect(outcome).toEqual({ kind: "confirmed", evidence });
    expect(countsTowardQuota(outcome)).toBe(true);
    expect(countsTowardQuota({ kind: "outcome-unknown", reason: "timeout" })).toBe(false);
    expect(() => confirmedOutcome({ ...evidence, evidenceId: "" })).toThrow(
      "Confirmation evidence must include an evidenceId."
    );
  });
});

describe("application transitions", () => {
  it("requires evidence to enter CONFIRMED and stores its identifier", () => {
    const application = createApplication("application-1");
    const submitting = transitionApplication(
      transitionApplication(
        transitionApplication(
          transitionApplication(
            transitionApplication(application, "MATCHED"),
            "DRAFTED"
          ),
          "REVIEW_REQUIRED"
        ),
        "APPROVED"
      ),
      "SUBMITTING"
    );

    expect(() => transitionApplication(submitting, "CONFIRMED")).toThrow(
      "CONFIRMED requires platform confirmation evidence."
    );

    expect(transitionApplication(submitting, "CONFIRMED", evidence)).toEqual({
      id: "application-1",
      state: "CONFIRMED",
      confirmedEvidenceId: "evidence-123"
    });
  });
});

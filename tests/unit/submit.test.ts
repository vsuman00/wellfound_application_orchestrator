import { describe, expect, it } from "vitest";
import { approveDraft, type ApprovalRecord } from "../../src/domain/approval.js";
import { createApplication, transitionApplication, type ApplicationRecord } from "../../src/domain/application.js";
import type { AuditEvent } from "../../src/domain/audit.js";
import type {
  ApplicationRepository,
  ApprovalRepository,
  AuditPort,
  Clock,
  LockLease,
  QuotaLease,
  QuotaPort,
  RunLockPort,
  SubmissionAttempt,
  SubmissionRepository,
  UnitOfWork
} from "../../src/domain/ports.js";
import { submitApprovedApplication } from "../../src/orchestrator/submit.js";

const now = "2026-09-01T10:30:00.000Z";

function approvedApplication(): ApplicationRecord {
  let application = createApplication("application-1");
  for (const state of ["MATCHED", "DRAFTED", "REVIEW_REQUIRED", "APPROVED"] as const) {
    application = transitionApplication(application, state);
  }
  return application;
}

function approval(): ApprovalRecord {
  return approveDraft({
    applicationId: "application-1",
    draftId: "draft-1",
    draftRevision: "revision-1",
    approvedBy: "local-user",
    approvedAt: "2026-09-01T10:00:00.000Z",
    expiresAt: "2026-09-01T11:00:00.000Z"
  });
}

function dependencies(application: ApplicationRecord) {
  let stored = application;
  const events: AuditEvent[] = [];
  const attempts: SubmissionAttempt[] = [];
  const evidence: string[] = [];
  const leases: string[] = [];
  const applicationRepository: ApplicationRepository = {
    async getById() { return stored; },
    async save(record) { stored = record; }
  };
  const approvals: ApprovalRepository = { async getByApplicationId() { return approval(); }, async save() {} };
  const audit: AuditPort = { async append(event) { events.push(event); } };
  const submission: SubmissionRepository = {
    async nextAttemptNumber() { return attempts.length + 1; },
    async saveEvidence(_applicationId, value) { evidence.push(value.evidenceId); },
    async saveAttempt(attempt) { attempts.push(attempt); }
  };
  const lock: RunLockPort = {
    async acquire(key, owner) {
      const lease: LockLease = { key, owner, expiresAt: "2026-09-01T10:31:00.000Z" };
      leases.push(`acquire:${key}`);
      return lease;
    },
    async release() { leases.push("release"); }
  };
  const quota: QuotaPort = {
    async acquire() { leases.push("quota-acquire"); return { applicationId: application.id, runId: "run-1" } satisfies QuotaLease; },
    async consume() { leases.push("quota-consume"); },
    async release() { leases.push("quota-release"); }
  };
  const clock: Clock = { now: () => now };
  const unitOfWork: UnitOfWork = { async run(work) { return work(); } };
  return {
    persistence: { applications: applicationRepository, approvals, audit, submission, lock, quota, clock, unitOfWork },
    getState: () => stored,
    events,
    attempts,
    evidence,
    leases
  };
}

describe("submission orchestrator", () => {
  it("reacquires lock and quota, persists one confirmation, and consumes quota", async () => {
    const deps = dependencies(approvedApplication());
    const result = await submitApprovedApplication({
      applicationId: "application-1",
      draftId: "draft-1",
      draftRevision: "revision-1",
      runId: "run-1",
      limits: { perRun: 1, perDay: 1 },
      submit: async () => ({ evidence: {
        evidenceId: "confirmation-1",
        observedAt: now,
        signal: "confirmation-page",
        detail: "Application received"
      } })
    }, deps.persistence);

    expect(result.kind).toBe("confirmed");
    expect(deps.getState()).toEqual({ id: "application-1", state: "CONFIRMED", confirmedEvidenceId: "confirmation-1" });
    expect(deps.evidence).toEqual(["confirmation-1"]);
    expect(deps.attempts).toHaveLength(1);
    expect(deps.attempts[0]?.outcome.kind).toBe("confirmed");
    expect(deps.events.map((event) => `${event.from}->${event.to}`)).toEqual(["APPROVED->SUBMITTING", "SUBMITTING->CONFIRMED"]);
    expect(deps.leases).toEqual(["acquire:application:application-1", "quota-acquire", "quota-consume", "release"]);
  });

  it("records an ambiguous adapter result as outcome-unknown without consuming quota", async () => {
    const deps = dependencies(approvedApplication());
    const result = await submitApprovedApplication({
      applicationId: "application-1",
      draftId: "draft-1",
      draftRevision: "revision-1",
      runId: "run-1",
      limits: { perRun: 1, perDay: 1 },
      submit: async () => ({ evidence: null })
    }, deps.persistence);

    expect(result).toEqual({ kind: "outcome-unknown", reason: "Confirmation signal was not observed." });
    expect(deps.getState()).toEqual({ id: "application-1", state: "OUTCOME_UNKNOWN" });
    expect(deps.attempts[0]?.outcome).toEqual(result);
    expect(deps.leases).toEqual(["acquire:application:application-1", "quota-acquire", "quota-release", "release"]);
  });
});

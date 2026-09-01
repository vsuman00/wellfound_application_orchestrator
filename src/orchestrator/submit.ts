import { isApprovalValid, type ApprovalRecord } from "../domain/approval.js";
import { transitionApplication, type ApplicationRecord } from "../domain/application.js";
import type { ConfirmationEvidence, SubmissionOutcome } from "../domain/outcome.js";
import { confirmedOutcome } from "../domain/outcome.js";
import type {
  ApprovalRepository,
  ApplicationRepository,
  AuditPort,
  Clock,
  QuotaLimits,
  QuotaPort,
  RunLockPort,
  SubmissionRepository,
  UnitOfWork
} from "../domain/ports.js";

export interface SubmitRequest {
  readonly applicationId: string;
  readonly approval?: ApprovalRecord;
  readonly draftId: string;
  readonly draftRevision: string;
  readonly runId?: string;
  readonly limits: QuotaLimits;
  readonly lockTtlMs?: number;
  readonly commandId?: string;
  readonly submit: (approval: ApprovalRecord, now: string) => Promise<{ readonly evidence: ConfirmationEvidence | null }>;
}

export interface SubmitPersistence {
  readonly applications: ApplicationRepository;
  readonly approvals: ApprovalRepository;
  readonly submission: SubmissionRepository;
  readonly audit: AuditPort;
  readonly unitOfWork: UnitOfWork;
  readonly lock: RunLockPort;
  readonly quota: QuotaPort;
  readonly clock: Clock;
}

const UNKNOWN_REASON = "Confirmation signal was not observed.";

function assertSubmitState(application: ApplicationRecord): void {
  if (application.state !== "APPROVED" && application.state !== "FAILED_RETRYABLE" && application.state !== "OUTCOME_UNKNOWN") {
    throw new Error(`Application ${application.id} is not ready for submission from state ${application.state}.`);
  }
}

function auditEvent(
  applicationId: string,
  from: ApplicationRecord["state"],
  to: ApplicationRecord["state"],
  idempotencyKey: string
  ) {
  return {
    type: "application.state_changed" as const,
    applicationId,
    from,
    to,
    metadata: {
      idempotencyKey,
      actor: { kind: "system" as const, reference: "submit-orchestrator" },
      source: { kind: "cli" as const, command: "submit" }
    }
  };
}

export async function submitApprovedApplication(
  request: SubmitRequest,
  persistence: SubmitPersistence
): Promise<SubmissionOutcome> {
  if (request.applicationId.trim().length === 0 || request.applicationId.includes("*")) {
    throw new Error("Submission requires one explicit application id; wildcard targets are not allowed.");
  }

  const application = await persistence.applications.getById(request.applicationId);
  if (application === null) {
    throw new Error(`Application not found: ${request.applicationId}`);
  }
  assertSubmitState(application);

  const approval = request.approval ?? await persistence.approvals.getByApplicationId(request.applicationId);
  if (approval === null || approval.applicationId !== request.applicationId || approval.draftId !== request.draftId) {
    throw new Error("Submission requires an approval for this exact application and draft.");
  }
  const now = persistence.clock.now();
  if (!isApprovalValid(approval, request.draftRevision, now)) {
    throw new Error("Submission requires a valid approval for this exact application and draft revision.");
  }

  const runId = request.runId ?? `submit:${request.applicationId}`;
  const lock = await persistence.lock.acquire(
    `application:${request.applicationId}`,
    `submit:${runId}`,
    request.lockTtlMs ?? 120_000
  );
  if (lock === null) {
    throw new Error("Submission is already running for this application.");
  }

  let quotaLease: Awaited<ReturnType<QuotaPort["acquire"]>> = null;
  const idempotencyKey = request.commandId ?? `submit:${request.applicationId}:${request.draftRevision}`;
  try {
    quotaLease = await persistence.quota.acquire({
      applicationId: request.applicationId,
      runId,
      limits: request.limits,
      now
    });
    if (quotaLease === null) {
      throw new Error("Submission quota is exhausted or already reserved.");
    }

    const submitting = transitionApplication(application, "SUBMITTING");
    await persistence.unitOfWork.run(async () => {
      await persistence.applications.save(submitting);
      await persistence.audit.append(auditEvent(application.id, application.state, "SUBMITTING", idempotencyKey));
    });

    let evidence: ConfirmationEvidence | null = null;
    try {
      evidence = (await request.submit(approval, now)).evidence;
    } catch {
      evidence = null;
    }

    if (evidence === null) {
      const outcome: SubmissionOutcome = { kind: "outcome-unknown", reason: UNKNOWN_REASON };
      await persistOutcome(submitting, outcome, request, persistence, idempotencyKey, runId);
      await persistence.quota.release(quotaLease);
      quotaLease = null;
      return outcome;
    }

    let outcome: SubmissionOutcome;
    try {
      outcome = confirmedOutcome(evidence);
    } catch {
      outcome = { kind: "outcome-unknown", reason: UNKNOWN_REASON };
    }
    if (outcome.kind !== "confirmed") {
      await persistOutcome(submitting, outcome, request, persistence, idempotencyKey, runId);
      await persistence.quota.release(quotaLease);
      quotaLease = null;
      return outcome;
    }

    const attemptNumber = await persistence.submission.nextAttemptNumber(request.applicationId);
    const confirmed = transitionApplication(submitting, "CONFIRMED", outcome.evidence);
    await persistence.unitOfWork.run(async () => {
      await persistence.submission.saveEvidence(request.applicationId, outcome.evidence);
      await persistence.submission.saveAttempt({
        id: `${request.applicationId}:attempt:${attemptNumber}`,
        applicationId: request.applicationId,
        attemptNumber,
        runId,
        outcome,
        createdAt: now
      });
      await persistence.applications.save(confirmed);
      await persistence.audit.append(auditEvent(request.applicationId, "SUBMITTING", "CONFIRMED", idempotencyKey));
    });
    await persistence.quota.consume(quotaLease);
    quotaLease = null;
    return outcome;
  } finally {
    if (quotaLease !== null) {
      await persistence.quota.release(quotaLease);
    }
    await persistence.lock.release(lock);
  }
}

async function persistOutcome(
  submitting: ApplicationRecord,
  outcome: SubmissionOutcome,
  request: SubmitRequest,
  persistence: SubmitPersistence,
  idempotencyKey: string,
  runId: string
): Promise<void> {
  const attemptNumber = await persistence.submission.nextAttemptNumber(request.applicationId);
  const nextState = outcome.kind === "failed-retryable"
    ? "FAILED_RETRYABLE"
    : outcome.kind === "failed-terminal"
      ? "FAILED_TERMINAL"
      : "OUTCOME_UNKNOWN";
  const next = transitionApplication(submitting, nextState);
  await persistence.unitOfWork.run(async () => {
    await persistence.submission.saveAttempt({
      id: `${request.applicationId}:attempt:${attemptNumber}`,
      applicationId: request.applicationId,
      attemptNumber,
      runId,
      outcome,
      createdAt: persistence.clock.now()
    });
    await persistence.applications.save(next);
    await persistence.audit.append(auditEvent(request.applicationId, "SUBMITTING", nextState, idempotencyKey));
  });
}

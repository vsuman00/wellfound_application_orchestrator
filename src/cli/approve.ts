import { resolveRuntimePaths } from "../config/paths.js";
import { openDatabase, closeDatabase } from "../persistence/database.js";
import { createApplicationRepository, createApprovalRepository, createDraftRepository, createJobRepository } from "../persistence/repositories.js";
import { assertSingleApprovalTarget, renderApprovalReview } from "../orchestrator/approve.js";
import { approveDraft } from "../domain/approval.js";

export async function runApproveCommand(applicationId: string, confirm = false): Promise<string> {
  assertSingleApprovalTarget(applicationId);
  const database = openDatabase(resolveRuntimePaths().database);
  try {
    const application = await createApplicationRepository(database).getById(applicationId);
    if (application === null) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    const draft = await createDraftRepository(database).getByApplicationId(applicationId);
    if (draft === null) {
      throw new Error(`Draft not found for application: ${applicationId}`);
    }
    const job = application.jobId === undefined
      ? null
      : await createJobRepository(database).getById(application.jobId);
    if (job === null) {
      throw new Error("Approval review cannot load the linked job metadata.");
    }
    const answers = draft.answers.map((answer) => {
      const decision = answer.decision;
      return decision.kind === "exact" ? `${answer.key} = ${decision.value}` : `${answer.key}: ${decision.reason}`;
    });
    const review = renderApprovalReview({
      applicationId,
      draftId: draft.id,
      draftRevision: draft.idempotencyKey,
      jobTitle: job.title,
      company: job.company,
      answers,
      risks: draft.reviewReasons
    });
    if (!confirm) {
      return review;
    }
    const approvedAt = new Date().toISOString();
    const expiresAt = new Date(Date.parse(approvedAt) + 3_600_000).toISOString();
    const approval = approveDraft({
      applicationId,
      draftId: draft.id,
      draftRevision: draft.idempotencyKey,
      approvedBy: "local-cli",
      approvedAt,
      expiresAt
    });
    await createApprovalRepository(database).save(approval);
    return `${review}\n\nApproval recorded for this exact revision. Submission remains a separate explicit command.`;
  } finally {
    closeDatabase(database);
  }
}

import { openManagedSession, closeManagedSession } from "../browser/session.js";
import { submitApproved } from "../adapters/wellfound/submit.js";
import { defaultConfig } from "../config/schema.js";
import { resolveRuntimePaths } from "../config/paths.js";
import { openDatabase, closeDatabase } from "../persistence/database.js";
import { createSqliteRunLock } from "../persistence/locks.js";
import { createSqliteQuota } from "../persistence/quotas.js";
import {
  createApplicationRepository,
  createApprovalRepository,
  createDraftRepository,
  createJobRepository,
  createSqliteAuditPort,
  createSqliteUnitOfWork,
  createSubmissionRepository
} from "../persistence/repositories.js";
import { submitApprovedApplication } from "../orchestrator/submit.js";

function assertLoopbackUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Submission requires a valid absolute HTTP loopback job URL.");
  }
  if (url.protocol !== "http:" || (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")) {
    throw new Error("Submission is limited to HTTP loopback fixtures until the live pilot is approved.");
  }
  return url;
}

export async function runSubmitCommand(applicationId: string): Promise<string> {
  if (applicationId.trim().length === 0 || applicationId.includes("*")) {
    throw new Error("Submission requires one explicit application id; wildcard targets are not allowed.");
  }
  const paths = resolveRuntimePaths();
  const database = openDatabase(paths.database);
  let context: Awaited<ReturnType<typeof openManagedSession>> | undefined;
  try {
    const applications = createApplicationRepository(database);
    const application = await applications.getById(applicationId);
    if (application === null) {
      throw new Error(`Application not found: ${applicationId}`);
    }
    const draft = await createDraftRepository(database).getByApplicationId(applicationId);
    const approval = await createApprovalRepository(database).getByApplicationId(applicationId);
    const job = application.jobId === undefined ? null : await createJobRepository(database).getById(application.jobId);
    if (draft === null || approval === null || job === null) {
      throw new Error("Submission requires a stored job, draft, and approval for this application.");
    }
    const url = assertLoopbackUrl(job.href);
    context = await openManagedSession({ profileDirectory: paths.browserProfile, headless: true });
    const page = await context.newPage();
    await page.goto(url.toString(), { waitUntil: "domcontentloaded" });
    const outcome = await submitApprovedApplication({
      applicationId,
      approval,
      draftId: draft.id,
      draftRevision: draft.idempotencyKey,
      limits: defaultConfig.quotas,
      submit: async (storedApproval, now) => submitApproved(page, applicationId, storedApproval, now)
    }, {
      applications,
      approvals: createApprovalRepository(database),
      submission: createSubmissionRepository(database),
      audit: createSqliteAuditPort(database),
      unitOfWork: createSqliteUnitOfWork(database),
      lock: createSqliteRunLock(database, { now: () => new Date().toISOString() }),
      quota: createSqliteQuota(database),
      clock: { now: () => new Date().toISOString() }
    });
    return JSON.stringify(outcome);
  } finally {
    if (context !== undefined) {
      await closeManagedSession(context);
    }
    closeDatabase(database);
  }
}

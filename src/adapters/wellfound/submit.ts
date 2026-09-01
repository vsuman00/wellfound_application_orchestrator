import type { Page } from "playwright";
import type { ApprovalRecord } from "../../domain/approval.js";
import { isApprovalValid } from "../../domain/approval.js";
import { confirmOutcome } from "./confirm.js";

export async function submitApproved(
  page: Page,
  applicationId: string,
  approval: ApprovalRecord,
  now = new Date().toISOString()
): Promise<{ readonly applicationId: string; readonly evidence: Awaited<ReturnType<typeof confirmOutcome>> }> {
  if (approval.applicationId !== applicationId || !isApprovalValid(approval, approval.draftRevision, now)) {
    throw new Error("Submission requires a valid approval for this exact application and draft revision.");
  }
  const url = new URL(page.url());
  if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost") {
    throw new Error("Submission is limited to loopback fixtures until the live pilot is approved.");
  }
  const submit = page.locator("[data-submit]");
  if (await submit.count() !== 1) {
    throw new Error("Expected exactly one submit control.");
  }
  await submit.click();
  return { applicationId, evidence: await confirmOutcome(page) };
}

export interface ApprovalRecord {
  readonly applicationId: string;
  readonly draftId: string;
  readonly draftRevision: string;
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly expiresAt: string;
}

export function approveDraft(input: ApprovalRecord): ApprovalRecord {
  if (input.applicationId.trim().length === 0 || input.draftId.trim().length === 0) {
    throw new Error("Approval requires an application and draft id.");
  }
  if (input.draftRevision.trim().length === 0) {
    throw new Error("Approval requires a draft revision.");
  }
  if (input.approvedBy.trim().length === 0) {
    throw new Error("Approval requires an approver.");
  }
  if (Date.parse(input.expiresAt) <= Date.parse(input.approvedAt)) {
    throw new Error("Approval expiry must be after approval time.");
  }
  return { ...input };
}

export function isApprovalValid(approval: ApprovalRecord, currentDraftRevision: string, now: string): boolean {
  return approval.draftRevision === currentDraftRevision && Date.parse(now) < Date.parse(approval.expiresAt);
}

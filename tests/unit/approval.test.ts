import { describe, expect, it } from "vitest";
import { approveDraft, isApprovalValid, type ApprovalRecord } from "../../src/domain/approval.js";

const approval: ApprovalRecord = {
  applicationId: "application-1",
  draftId: "draft-1",
  draftRevision: "revision-1",
  approvedBy: "local-user",
  approvedAt: "2026-09-01T10:00:00.000Z",
  expiresAt: "2026-09-01T11:00:00.000Z"
};

describe("draft approval contract", () => {
  it("binds approval to one immutable draft revision", () => {
    const approved = approveDraft(approval);
    expect(isApprovalValid(approved, "revision-1", "2026-09-01T10:30:00.000Z")).toBe(true);
    expect(isApprovalValid(approved, "revision-2", "2026-09-01T10:30:00.000Z")).toBe(false);
  });

  it("expires deterministically and rejects malformed approval windows", () => {
    expect(isApprovalValid(approval, "revision-1", "2026-09-01T11:00:00.000Z")).toBe(false);
    expect(() => approveDraft({ ...approval, expiresAt: approval.approvedAt })).toThrow(
      "Approval expiry must be after approval time."
    );
    expect(() => approveDraft({ ...approval, draftRevision: "" })).toThrow("Approval requires a draft revision.");
  });
});

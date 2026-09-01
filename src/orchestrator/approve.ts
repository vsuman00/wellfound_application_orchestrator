export interface ApprovalReview {
  readonly applicationId: string;
  readonly draftId: string;
  readonly draftRevision: string;
  readonly jobTitle: string;
  readonly company: string;
  readonly answers: readonly string[];
  readonly risks: readonly string[];
}

export function renderApprovalReview(review: ApprovalReview): string {
  const answers = review.answers.length === 0 ? "(none)" : review.answers.join("\n  - ");
  const risks = review.risks.length === 0 ? "(none)" : review.risks.join("\n  - ");
  return [
    `Application: ${review.applicationId}`,
    `Draft: ${review.draftId}`,
    `Revision: ${review.draftRevision}`,
    `Job: ${review.jobTitle}`,
    `Company: ${review.company}`,
    "Answers:",
    `  - ${answers}`,
    "Risks:",
    `  - ${risks}`,
    "Next action: explicitly approve this exact draft revision before any submission."
  ].join("\n");
}

export function assertSingleApprovalTarget(applicationId: string): void {
  if (applicationId.trim().length === 0 || applicationId.includes("*")) {
    throw new Error("Approval requires one explicit application id; wildcard targets are not allowed.");
  }
}

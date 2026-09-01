import { describe, expect, it } from "vitest";
import { assertSingleApprovalTarget, renderApprovalReview } from "../../src/orchestrator/approve.js";

describe("approval review display", () => {
  it("renders job, company, answers, risks, and exact next action", () => {
    const output = renderApprovalReview({
      applicationId: "application-1",
      draftId: "draft-1",
      draftRevision: "revision-1",
      jobTitle: "Fixture Engineer",
      company: "Example Labs",
      answers: ["work-mode = Remote"],
      risks: ["salary needs review"]
    });
    expect(output).toContain("Job: Fixture Engineer");
    expect(output).toContain("Company: Example Labs");
    expect(output).toContain("work-mode = Remote");
    expect(output).toContain("salary needs review");
    expect(output).toContain("explicitly approve this exact draft revision");
  });

  it("rejects empty and wildcard approval targets", () => {
    expect(() => assertSingleApprovalTarget("")).toThrow();
    expect(() => assertSingleApprovalTarget("*")).toThrow("wildcard targets are not allowed");
    expect(() => assertSingleApprovalTarget("application-1")).not.toThrow();
  });
});

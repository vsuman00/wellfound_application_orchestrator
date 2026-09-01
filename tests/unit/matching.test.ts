import { describe, expect, it } from "vitest";
import { matchJob, type MatchCandidate, type MatchCriteria } from "../../src/policies/matching.js";

const candidate: MatchCandidate = {
  canonicalIdentity: "wellfound:fixture-job-1",
  title: "Senior TypeScript Engineer",
  company: "Example Labs",
  location: "Remote",
  skills: ["TypeScript", "Playwright"],
  publishedAt: "2026-09-01T08:00:00.000Z"
};

const criteria: MatchCriteria = {
  titleKeywords: ["engineer"],
  requiredSkills: ["TypeScript"],
  allowedLocations: ["Remote"],
  excludedCompanies: [],
  maxAgeDays: 7,
  now: "2026-09-01T10:00:00.000Z",
  existingIdentities: new Set(),
  perRunRemaining: 10,
  perDayRemaining: 50
};

describe("deterministic matching policy", () => {
  it("returns a stable included decision and explanation", () => {
    const first = matchJob(candidate, criteria);
    expect(matchJob(candidate, criteria)).toEqual(first);
    expect(first).toMatchObject({ included: true, score: 4, exclusions: [] });
    expect(first.explanation).toContain("title:engineer");
  });

  it("lets exclusions override a positive score", () => {
    expect(matchJob(candidate, { ...criteria, excludedCompanies: ["example labs"] }).exclusions)
      .toContain("excluded-company");
    expect(matchJob(candidate, { ...criteria, existingIdentities: new Set([candidate.canonicalIdentity]) }).included)
      .toBe(false);
    expect(matchJob(candidate, { ...criteria, perRunRemaining: 0 }).exclusions)
      .toContain("run-budget-exhausted");
  });

  it("rejects stale or incomplete evidence without inventing a match", () => {
    expect(matchJob({ ...candidate, publishedAt: "2026-08-01T10:00:00.000Z" }, criteria).exclusions)
      .toContain("stale");
    expect(matchJob({ ...candidate, publishedAt: "not-a-date" }, criteria).exclusions)
      .toContain("invalid-published-at");
    expect(matchJob({ ...candidate, title: "Unrelated role", skills: [] }, criteria))
      .toMatchObject({ included: false, score: 1, exclusions: [] });
  });
});

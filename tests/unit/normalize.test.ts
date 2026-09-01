import { describe, expect, it } from "vitest";
import { normalizeJob } from "../../src/adapters/wellfound/normalize.js";

describe("Wellfound job normalization", () => {
  it("creates a canonical identity from complete sanitized facts", () => {
    expect(normalizeJob({
      id: "fixture-job-1",
      title: "Fixture Engineer",
      company: "Example Labs",
      location: "Remote",
      href: "/scenario/job-detail"
    })).toEqual({
      id: "fixture-job-1",
      canonicalIdentity: "wellfound:fixture-job-1",
      title: "Fixture Engineer",
      company: "Example Labs",
      location: "Remote",
      href: "/scenario/job-detail"
    });
  });

  it("rejects missing or whitespace-only facts", () => {
    expect(normalizeJob({ id: "fixture-job-1", title: "", company: "Example", location: "Remote", href: "/job" })).toBeNull();
    expect(normalizeJob({ id: "fixture-job-1", title: "Engineer", company: "Example", location: "Remote", href: null })).toBeNull();
  });
});

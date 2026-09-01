import { describe, expect, it } from "vitest";
import { normalizeJob } from "../../src/adapters/wellfound/normalize.js";

describe("Wellfound job normalization", () => {
  it("creates a canonical identity from complete sanitized facts", () => {
    expect(normalizeJob({
      id: "fixture-job-1",
      title: "Fixture Engineer",
      company: "Example Labs",
      location: "Remote",
      href: "/scenario/job-detail",
      publishedAt: "2026-09-01T08:00:00.000Z"
    })).toEqual({
      id: "fixture-job-1",
      canonicalIdentity: "wellfound:fixture-job-1",
      title: "Fixture Engineer",
      company: "Example Labs",
      location: "Remote",
      href: "/scenario/job-detail",
      publishedAt: "2026-09-01T08:00:00.000Z"
    });
  });

  it("rejects missing or whitespace-only facts", () => {
    expect(normalizeJob({ id: "fixture-job-1", title: "", company: "Example", location: "Remote", href: "/job", publishedAt: "2026-09-01T08:00:00.000Z" })).toBeNull();
    expect(normalizeJob({ id: "fixture-job-1", title: "Engineer", company: "Example", location: "Remote", href: null, publishedAt: "2026-09-01T08:00:00.000Z" })).toBeNull();
  });
});

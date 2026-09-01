import type { Locator, Page } from "playwright";
import { wellfoundLocators } from "./locators.js";
import { normalizeJob, type JobFacts } from "./normalize.js";

export type ScanDiagnosticCode = "blocked" | "changed-dom" | "missing-field";

export interface ScanDiagnostic {
  readonly code: ScanDiagnosticCode;
  readonly message: string;
  readonly selector: string;
}

export interface ScanResult {
  readonly jobs: readonly JobFacts[];
  readonly diagnostics: readonly ScanDiagnostic[];
}

async function readJobCard(card: Locator): Promise<JobFacts | null> {
  const raw = {
    id: await card.getAttribute("data-job-id"),
    title: await card.locator(wellfoundLocators.title).textContent(),
    company: await card.locator(wellfoundLocators.company).textContent(),
    location: await card.locator(wellfoundLocators.location).textContent(),
    href: await card.locator(wellfoundLocators.jobLink).getAttribute("href")
  };
  return normalizeJob({
    id: raw.id?.trim() ?? null,
    title: raw.title?.trim() ?? null,
    company: raw.company?.trim() ?? null,
    location: raw.location?.trim() ?? null,
    href: raw.href?.trim() ?? null
  });
}

export async function scanFeed(page: Page): Promise<ScanResult> {
  if (await page.locator(wellfoundLocators.verification).count() > 0) {
    return {
      jobs: [],
      diagnostics: [{
        code: "blocked",
        message: "Verification-required page detected; scan stopped.",
        selector: wellfoundLocators.verification
      }]
    };
  }

  if (await page.locator(wellfoundLocators.feed).count() === 0) {
    return {
      jobs: [],
      diagnostics: [{
        code: "changed-dom",
        message: "Expected job feed was not found; scan stopped.",
        selector: wellfoundLocators.feed
      }]
    };
  }

  const cards = page.locator(wellfoundLocators.jobCard);
  const jobs = new Map<string, JobFacts>();
  const diagnostics: ScanDiagnostic[] = [];
  for (let index = 0; index < await cards.count(); index += 1) {
    const job = await readJobCard(cards.nth(index));
    if (job === null) {
      diagnostics.push({
        code: "missing-field",
        message: "Job card is missing a required normalized field.",
        selector: wellfoundLocators.jobCard
      });
      continue;
    }
    jobs.set(job.canonicalIdentity, job);
  }

  return { jobs: [...jobs.values()], diagnostics };
}

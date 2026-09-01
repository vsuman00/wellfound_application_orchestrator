import type { Page } from "playwright";
import type { ConfirmationEvidence } from "../../domain/outcome.js";

export async function confirmOutcome(page: Page): Promise<ConfirmationEvidence | null> {
  const confirmation = page.locator("[data-confirmation]");
  if (await confirmation.count() === 0) {
    return null;
  }
  const evidenceId = (await page.locator("[data-confirmation-id]").textContent())?.trim() ?? "";
  if (evidenceId.length === 0) {
    return null;
  }
  return {
    evidenceId,
    observedAt: new Date().toISOString(),
    signal: "confirmation-page",
    detail: (await confirmation.textContent())?.trim() ?? ""
  };
}

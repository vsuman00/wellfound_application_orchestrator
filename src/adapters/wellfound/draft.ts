import type { Page } from "playwright";
import type { AnswerDecision, ApprovedFact } from "../../domain/answer.js";
import { decideAnswer } from "../../policies/answers.js";

export interface DraftAnswer {
  readonly key: string;
  readonly decision: AnswerDecision;
}

export interface DraftResult {
  readonly answers: readonly DraftAnswer[];
  readonly reviewRequired: boolean;
}

export async function draftApplication(page: Page, facts: readonly ApprovedFact[]): Promise<DraftResult> {
  const controls = page.locator("[data-question]");
  const answers: DraftAnswer[] = [];
  let reviewRequired = false;
  for (let index = 0; index < await controls.count(); index += 1) {
    const control = controls.nth(index);
    const key = (await control.getAttribute("data-question"))?.trim() ?? "";
    const text = await control.evaluate((element) => element.closest("label")?.textContent ?? element.getAttribute("aria-label") ?? "");
    const decision = decideAnswer({ key, text: text.trim() }, facts);
    answers.push({ key, decision });
    if (decision.kind !== "exact") {
      reviewRequired = true;
      continue;
    }

    const tagName = await control.evaluate((element) => element.tagName.toLowerCase());
    if (tagName === "input" || tagName === "textarea") {
      await control.fill(decision.value);
    } else {
      reviewRequired = true;
      answers[answers.length - 1] = {
        key,
        decision: { kind: "review-required", reason: "Control type is not approved for automatic drafting." }
      };
    }
  }
  return { answers, reviewRequired };
}

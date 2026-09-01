import type { AnswerDecision, ApprovedFact } from "../domain/answer.js";
import { classifyQuestion, type Question } from "./questions.js";

export function decideAnswer(question: Question, facts: readonly ApprovedFact[]): AnswerDecision {
  const kind = classifyQuestion(question.text);
  if (kind === "unknown") {
    return { kind: "prohibited", reason: "Question is unknown or contains instruction-like text." };
  }
  if (kind === "sensitive" || kind === "legal") {
    return { kind: "prohibited", reason: `${kind} questions require a human decision.` };
  }

  const fact = facts.find((candidate) => candidate.key === question.key && candidate.value.trim().length > 0);
  if (fact === undefined) {
    return {
      kind: kind === "ordinary" ? "unsupported" : "review-required",
      reason: kind === "ordinary" ? "No approved fact matches this question." : `${kind} requires an explicit approved fact.`
    };
  }
  return { kind: "exact", value: fact.value, factId: fact.factId };
}

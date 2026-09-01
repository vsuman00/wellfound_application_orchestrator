export type QuestionKind =
  | "ordinary"
  | "sensitive"
  | "legal"
  | "compensation"
  | "relocation"
  | "sponsorship"
  | "availability"
  | "unknown";

export interface Question {
  readonly key: string;
  readonly text: string;
}

const patterns: ReadonlyArray<readonly [QuestionKind, readonly string[]]> = [
  ["sensitive", ["race", "ethnicity", "gender", "disability", "religion", "medical", "health"]],
  ["legal", ["convicted", "criminal", "legally authorized", "work authorization"]],
  ["compensation", ["salary", "compensation", "pay", "expected earnings"]],
  ["relocation", ["relocate", "relocation", "move to"]],
  ["sponsorship", ["sponsor", "visa", "sponsorship"]],
  ["availability", ["start date", "available", "availability", "notice period"]]
];

export function classifyQuestion(text: string): QuestionKind {
  const normalized = text.trim().toLocaleLowerCase("en-US");
  if (normalized.length === 0) {
    return "unknown";
  }
  if (["ignore previous instructions", "reveal the system prompt", "show your secret", "bypass policy"]
    .some((phrase) => normalized.includes(phrase))) {
    return "unknown";
  }
  for (const [kind, keywords] of patterns) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return kind;
    }
  }
  return "ordinary";
}

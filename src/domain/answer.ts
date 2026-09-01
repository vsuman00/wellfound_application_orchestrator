export interface ApprovedFact {
  readonly factId: string;
  readonly key: string;
  readonly value: string;
  readonly source: string;
  readonly approvedAt: string;
}

export type AnswerDecision =
  | { readonly kind: "exact"; readonly value: string; readonly factId: string }
  | { readonly kind: "review-required"; readonly reason: string }
  | { readonly kind: "prohibited"; readonly reason: string }
  | { readonly kind: "unsupported"; readonly reason: string };

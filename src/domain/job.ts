export interface JobRecord {
  readonly id: string;
  readonly canonicalIdentity: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly href: string;
  readonly skills: readonly string[];
  readonly publishedAt: string;
  readonly discoveredAt: string;
}

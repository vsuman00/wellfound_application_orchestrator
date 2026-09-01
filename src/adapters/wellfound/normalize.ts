export interface JobFacts {
  readonly id: string;
  readonly canonicalIdentity: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly href: string;
  readonly publishedAt: string;
}

export interface RawJobFacts {
  readonly id: string | null;
  readonly title: string | null;
  readonly company: string | null;
  readonly location: string | null;
  readonly href: string | null;
  readonly publishedAt: string | null;
}

export function normalizeJob(raw: RawJobFacts): JobFacts | null {
  const values = [raw.id, raw.title, raw.company, raw.location, raw.href, raw.publishedAt];
  if (values.some((value) => value === null || value.trim().length === 0)) {
    return null;
  }

  return {
    id: raw.id as string,
    canonicalIdentity: `wellfound:${raw.id as string}`,
    title: raw.title as string,
    company: raw.company as string,
    location: raw.location as string,
    href: raw.href as string,
    publishedAt: raw.publishedAt as string
  };
}

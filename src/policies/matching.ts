export interface MatchCandidate {
  readonly canonicalIdentity: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly skills: readonly string[];
  readonly publishedAt: string;
}

export interface MatchCriteria {
  readonly titleKeywords: readonly string[];
  readonly requiredSkills: readonly string[];
  readonly allowedLocations: readonly string[];
  readonly excludedCompanies: readonly string[];
  readonly maxAgeDays: number;
  readonly now: string;
  readonly existingIdentities: ReadonlySet<string>;
  readonly perRunRemaining: number;
  readonly perDayRemaining: number;
}

export interface MatchDecision {
  readonly included: boolean;
  readonly score: number;
  readonly matchedCriteria: readonly string[];
  readonly exclusions: readonly string[];
  readonly explanation: string;
}

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase("en-US");
}

function containsKeyword(value: string, keyword: string): boolean {
  return normalized(value).includes(normalized(keyword));
}

export function matchJob(candidate: MatchCandidate, criteria: MatchCriteria): MatchDecision {
  const exclusions: string[] = [];
  const matchedCriteria: string[] = [];
  let score = 0;

  if (criteria.existingIdentities.has(candidate.canonicalIdentity)) {
    exclusions.push("duplicate-identity");
  }
  if (criteria.excludedCompanies.some((company) => normalized(company) === normalized(candidate.company))) {
    exclusions.push("excluded-company");
  }
  if (criteria.allowedLocations.length > 0 && !criteria.allowedLocations.some((location) => containsKeyword(candidate.location, location))) {
    exclusions.push("location-not-allowed");
  }

  const publishedEpoch = Date.parse(candidate.publishedAt);
  const nowEpoch = Date.parse(criteria.now);
  if (Number.isNaN(publishedEpoch) || Number.isNaN(nowEpoch)) {
    exclusions.push("invalid-published-at");
  } else if (nowEpoch - publishedEpoch > criteria.maxAgeDays * 86_400_000) {
    exclusions.push("stale");
  }
  if (criteria.perRunRemaining <= 0) {
    exclusions.push("run-budget-exhausted");
  }
  if (criteria.perDayRemaining <= 0) {
    exclusions.push("day-budget-exhausted");
  }

  for (const keyword of criteria.titleKeywords) {
    if (containsKeyword(candidate.title, keyword)) {
      score += 2;
      matchedCriteria.push(`title:${normalized(keyword)}`);
    }
  }
  for (const skill of criteria.requiredSkills) {
    if (candidate.skills.some((candidateSkill) => normalized(candidateSkill) === normalized(skill))) {
      score += 1;
      matchedCriteria.push(`skill:${normalized(skill)}`);
    }
  }
  if (criteria.allowedLocations.some((location) => containsKeyword(candidate.location, location))) {
    score += 1;
    matchedCriteria.push(`location:${normalized(candidate.location)}`);
  }

  const hasRoleMatch = matchedCriteria.some((criterion) => criterion.startsWith("title:") || criterion.startsWith("skill:"));
  const included = exclusions.length === 0 && score > 0 && hasRoleMatch;
  const explanation = included
    ? `Included with score ${score}: ${matchedCriteria.join(", ")}.`
    : `Excluded: ${exclusions.length > 0 ? exclusions.join(", ") : "no matching criteria"}.`;
  return { included, score, matchedCriteria, exclusions, explanation };
}

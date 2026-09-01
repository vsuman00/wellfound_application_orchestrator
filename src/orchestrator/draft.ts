import type { AuditPort, ApplicationRepository, Clock, DraftRepository, UnitOfWork } from "../domain/ports.js";
import type { ApplicationRecord } from "../domain/application.js";
import type { DraftRecord } from "../domain/draft.js";
import { summarizeDraftRun, type DraftRunSummary } from "./run-summary.js";

export interface DraftPersistence {
  readonly applications: ApplicationRepository;
  readonly drafts: DraftRepository;
  readonly audit: AuditPort;
  readonly unitOfWork: UnitOfWork;
  readonly clock: Clock;
}

export type PersistDraftResult =
  | { readonly status: "created"; readonly record: DraftRecord }
  | { readonly status: "existing"; readonly record: DraftRecord };

export async function persistDraft(
  application: ApplicationRecord,
  draft: DraftRecord,
  persistence: DraftPersistence
): Promise<PersistDraftResult> {
  const existing = await persistence.drafts.getByIdempotencyKey(draft.idempotencyKey);
  if (existing !== null) {
    return { status: "existing", record: existing };
  }

  return persistence.unitOfWork.run(async () => {
    const alreadyPersisted = await persistence.drafts.getByIdempotencyKey(draft.idempotencyKey);
    if (alreadyPersisted !== null) {
      return { status: "existing", record: alreadyPersisted };
    }
    await persistence.applications.save(application);
    await persistence.drafts.save(draft);
    await persistence.audit.append({
      type: "application.state_changed",
      applicationId: application.id,
      from: null,
      to: application.state,
      metadata: {
        idempotencyKey: draft.idempotencyKey,
        actor: { kind: "system", reference: "draft-orchestrator" },
        source: { kind: "test", command: "draft" }
      }
    });
    return { status: "created", record: draft };
  });
}

export interface DraftJourneyCandidate {
  readonly application: ApplicationRecord;
  readonly identity: string;
}

export interface DraftJourneyDependencies extends DraftPersistence {
  readonly discover: () => Promise<readonly DraftJourneyCandidate[]>;
  readonly match: (candidate: DraftJourneyCandidate) => Promise<boolean>;
  readonly draft: (candidate: DraftJourneyCandidate) => Promise<DraftRecord>;
}

export async function runDraftJourney(dependencies: DraftJourneyDependencies): Promise<DraftRunSummary> {
  const dispositions: DraftRecord["disposition"][] = [];
  for (const candidate of await dependencies.discover()) {
    if (!(await dependencies.match(candidate))) {
      dispositions.push("skipped");
      continue;
    }
    try {
      const draft = await dependencies.draft(candidate);
      const result = await persistDraft(candidate.application, draft, dependencies);
      dispositions.push(result.record.disposition);
    } catch {
      dispositions.push("failed");
    }
  }
  return summarizeDraftRun(dispositions);
}

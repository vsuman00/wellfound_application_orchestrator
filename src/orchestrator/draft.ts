import type { AuditPort, ApplicationRepository, Clock, DraftRepository, UnitOfWork } from "../domain/ports.js";
import type { ApplicationRecord } from "../domain/application.js";
import type { DraftRecord } from "../domain/draft.js";

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

import type { DatabaseSync } from "node:sqlite";
import type { ApplicationState } from "../domain/state-machine.js";
import type { ApplicationRepository, ApprovalRepository, AuditPort, DraftRepository, UnitOfWork } from "../domain/ports.js";
import type { AuditEvent } from "../domain/audit.js";
import type { JobRepository } from "../domain/ports.js";
import type { JobRecord } from "../domain/job.js";
import type { DraftRecord } from "../domain/draft.js";

interface ApplicationRow {
  readonly id: string;
  readonly job_id: string | null;
  readonly state: ApplicationState;
  readonly confirmed_evidence_id: string | null;
}

export function createApplicationRepository(database: DatabaseSync): ApplicationRepository {
  const read = database.prepare(
    "SELECT id, job_id, state, confirmed_evidence_id FROM applications WHERE id = ?"
  );
  const write = database.prepare(`
    INSERT INTO applications (id, job_id, state, confirmed_evidence_id)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      job_id = excluded.job_id,
      state = excluded.state,
      confirmed_evidence_id = excluded.confirmed_evidence_id,
      updated_at = CURRENT_TIMESTAMP
  `);

  return {
    async getById(id) {
      const row = read.get(id) as ApplicationRow | undefined;
      if (row === undefined) {
        return null;
      }
      return {
        id: row.id,
        ...(row.job_id === null ? {} : { jobId: row.job_id }),
        state: row.state,
        ...(row.confirmed_evidence_id === null ? {} : { confirmedEvidenceId: row.confirmed_evidence_id })
      };
    },
    async save(record) {
      write.run(record.id, record.jobId ?? null, record.state, record.confirmedEvidenceId ?? null);
    }
  };
}

export function createSqliteUnitOfWork(database: DatabaseSync): UnitOfWork {
  return {
    async run<T>(work: () => Promise<T>): Promise<T> {
      database.exec("BEGIN IMMEDIATE;");
      try {
        const result = await work();
        database.exec("COMMIT;");
        return result;
      } catch (error) {
        database.exec("ROLLBACK;");
        throw error;
      }
    }
  };
}

interface JobRow {
  readonly id: string;
  readonly canonical_identity: string;
  readonly title: string;
  readonly company: string;
  readonly location: string;
  readonly href: string;
  readonly skills_json: string;
  readonly published_at: string;
  readonly discovered_at: string;
}

export function createJobRepository(database: DatabaseSync): JobRepository {
  const read = database.prepare("SELECT * FROM jobs WHERE canonical_identity = ?");
  const readById = database.prepare("SELECT * FROM jobs WHERE id = ?");
  const write = database.prepare(`
    INSERT INTO jobs
      (id, canonical_identity, title, company, location, href, skills_json, published_at, discovered_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(canonical_identity) DO UPDATE SET
      title = excluded.title,
      company = excluded.company,
      location = excluded.location,
      href = excluded.href,
      skills_json = excluded.skills_json,
      published_at = excluded.published_at,
      discovered_at = excluded.discovered_at
  `);

  const mapJob = (row: JobRow | undefined): JobRecord | null => {
      if (row === undefined) {
        return null;
      }
      return {
        id: row.id,
        canonicalIdentity: row.canonical_identity,
        title: row.title,
        company: row.company,
        location: row.location,
        href: row.href,
        skills: JSON.parse(row.skills_json) as string[],
        publishedAt: row.published_at,
        discoveredAt: row.discovered_at
      };
  };
  return {
    async getByCanonicalIdentity(identity) {
      return mapJob(read.get(identity) as JobRow | undefined);
    },
    async getById(id) {
      return mapJob(readById.get(id) as JobRow | undefined);
    },
    async upsert(record: JobRecord) {
      write.run(
        record.id,
        record.canonicalIdentity,
        record.title,
        record.company,
        record.location,
        record.href,
        JSON.stringify(record.skills),
        record.publishedAt,
        record.discoveredAt
      );
    }
  };
}

interface DraftRow {
  readonly id: string;
  readonly application_id: string;
  readonly idempotency_key: string | null;
  readonly disposition: DraftRecord["disposition"];
  readonly review_reasons_json: string;
  readonly created_at: string;
}

interface AnswerRow {
  readonly key: string;
  readonly decision_kind: string;
  readonly answer: string | null;
  readonly fact_id: string | null;
  readonly reason: string | null;
}

export function createDraftRepository(database: DatabaseSync): DraftRepository {
  const read = database.prepare("SELECT * FROM drafts WHERE idempotency_key = ?");
  const readByApplication = database.prepare("SELECT * FROM drafts WHERE application_id = ? ORDER BY id DESC LIMIT 1");
  const readAnswers = database.prepare("SELECT question_key AS key, decision_kind, answer, fact_id, reason FROM answers WHERE draft_id = ? ORDER BY id");
  const writeDraft = database.prepare(`
    INSERT INTO drafts (id, application_id, created_at, idempotency_key, disposition, review_reasons_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const writeAnswer = database.prepare(`
    INSERT INTO answers (id, draft_id, question_key, decision_kind, answer, fact_id, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const writeAttempt = database.prepare(`
    INSERT INTO application_attempts
      (id, application_id, attempt_number, outcome_kind, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const mapDraft = (row: DraftRow | undefined): DraftRecord | null => {
      if (row === undefined || row.idempotency_key === null) {
        return null;
      }
      const answers = (readAnswers.all(row.id) as unknown as AnswerRow[]).map((answer) => ({
        key: answer.key,
        decision: answer.decision_kind === "exact"
          ? { kind: "exact" as const, value: answer.answer ?? "", factId: answer.fact_id ?? "" }
          : answer.decision_kind === "prohibited"
            ? { kind: "prohibited" as const, reason: answer.reason ?? "" }
            : answer.decision_kind === "review-required"
              ? { kind: "review-required" as const, reason: answer.reason ?? "" }
              : { kind: "unsupported" as const, reason: answer.reason ?? "" }
      }));
      return {
        id: row.id,
        applicationId: row.application_id,
        idempotencyKey: row.idempotency_key,
        disposition: row.disposition,
        answers,
        reviewReasons: JSON.parse(row.review_reasons_json) as string[],
        createdAt: row.created_at
      };
  };
  return {
    async getByIdempotencyKey(key) {
      return mapDraft(read.get(key) as DraftRow | undefined);
    },
    async getByApplicationId(applicationId) {
      return mapDraft(readByApplication.get(applicationId) as DraftRow | undefined);
    },
    async save(record) {
      writeAttempt.run(`${record.id}:attempt`, record.applicationId, 1, record.disposition, record.createdAt);
      writeDraft.run(record.id, record.applicationId, record.createdAt, record.idempotencyKey, record.disposition, JSON.stringify(record.reviewReasons));
      for (const [index, answer] of record.answers.entries()) {
        const decision = answer.decision;
        writeAnswer.run(
          `${record.id}:answer:${index}`,
          record.id,
          answer.key,
          decision.kind,
          decision.kind === "exact" ? decision.value : null,
          decision.kind === "exact" ? decision.factId : null,
          decision.kind === "exact" ? null : decision.reason
        );
      }
    }
  };
}

export function createSqliteAuditPort(database: DatabaseSync): AuditPort {
  const write = database.prepare(`
    INSERT INTO audit_events
      (event_type, application_id, from_state, to_state, idempotency_key, actor_kind, actor_reference, source_kind, source_command)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return {
    async append(event: AuditEvent) {
      write.run(
        event.type,
        event.applicationId,
        event.from,
        event.to,
        event.metadata.idempotencyKey,
        event.metadata.actor.kind,
        event.metadata.actor.reference,
        event.metadata.source.kind,
        event.metadata.source.command
      );
    }
  };
}

export function createApprovalRepository(database: DatabaseSync): ApprovalRepository {
  interface ApprovalRow {
    readonly application_id: string;
    readonly draft_id: string;
    readonly draft_revision: string;
    readonly approved_by: string;
    readonly approved_at: string;
    readonly expires_at: string;
  }
  const read = database.prepare("SELECT * FROM approvals WHERE application_id = ?");
  const write = database.prepare(`
    INSERT INTO approvals (application_id, draft_id, draft_revision, approved_by, approved_at, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  return {
    async getByApplicationId(applicationId) {
      const row = read.get(applicationId) as ApprovalRow | undefined;
      return row === undefined ? null : {
        applicationId: row.application_id,
        draftId: row.draft_id,
        draftRevision: row.draft_revision,
        approvedBy: row.approved_by,
        approvedAt: row.approved_at,
        expiresAt: row.expires_at
      };
    },
    async save(record) {
      write.run(record.applicationId, record.draftId, record.draftRevision, record.approvedBy, record.approvedAt, record.expiresAt);
    }
  };
}

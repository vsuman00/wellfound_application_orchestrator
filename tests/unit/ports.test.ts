import { describe, expect, it } from "vitest";
import { createApplication, transitionApplication } from "../../src/domain/application.js";
import type { AuditEvent, CommandMetadata } from "../../src/domain/audit.js";
import type {
  ApplicationRepository,
  AuditPort,
  Clock,
  IdentifierPort,
  RunLockPort,
  UnitOfWork
} from "../../src/domain/ports.js";

const metadata: CommandMetadata = {
  idempotencyKey: "draft:application-1",
  actor: { kind: "user", reference: "local-user" },
  source: { kind: "cli", command: "draft" }
};

describe("domain ports", () => {
  it("supports a complete fake scan-to-draft journey with audit metadata", async () => {
    const application = createApplication("application-1");
    const records = new Map<string, typeof application>();
    const events: AuditEvent[] = [];
    const repository: ApplicationRepository = {
      async getById(id) {
        return records.get(id) ?? null;
      },
      async save(record) {
        records.set(record.id, record);
      }
    };
    const audit: AuditPort = {
      async append(event) {
        events.push(event);
      }
    };

    await repository.save(application);
    await audit.append({
      type: "application.state_changed",
      applicationId: application.id,
      from: null,
      to: application.state,
      metadata
    });

    const matched = transitionApplication(application, "MATCHED");
    const drafted = transitionApplication(transitionApplication(matched, "DRAFTED"), "REVIEW_REQUIRED");
    await repository.save(drafted);
    await audit.append({
      type: "application.state_changed",
      applicationId: drafted.id,
      from: "DRAFTED",
      to: drafted.state,
      metadata
    });

    expect(await repository.getById("application-1")).toEqual(drafted);
    expect(events).toHaveLength(2);
    expect(events.every((event) => event.metadata.idempotencyKey.length > 0)).toBe(true);
    expect(events[0]?.metadata.actor).toEqual({ kind: "user", reference: "local-user" });
    expect(events[0]?.metadata.source).toEqual({ kind: "cli", command: "draft" });
  });

  it("keeps infrastructure ports as implementation-free contracts", async () => {
    const clock: Clock = { now: () => "2026-09-01T10:00:00.000Z" };
    const identifiers: IdentifierPort = { next: (prefix) => `${prefix ?? "id"}-1` };
    const lock: RunLockPort = {
      async acquire() {
        return { key: "run-1", owner: "owner-1", expiresAt: clock.now() };
      },
      async release() {}
    };
    const unitOfWork: UnitOfWork = {
      run: async (work) => work()
    };

    expect(clock.now()).toBe("2026-09-01T10:00:00.000Z");
    expect(identifiers.next("application")).toBe("application-1");
    expect(await lock.acquire("run", "owner", 1)).toEqual({
      key: "run-1",
      owner: "owner-1",
      expiresAt: "2026-09-01T10:00:00.000Z"
    });
    await expect(unitOfWork.run(async () => "ok")).resolves.toBe("ok");
  });
});

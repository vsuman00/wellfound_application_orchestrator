import type { ApplicationState } from "./state-machine.js";

export interface RedactedActor {
  readonly kind: "user" | "system" | "codex";
  readonly reference: string;
}

export interface RedactedSource {
  readonly kind: "cli" | "scheduler" | "codex" | "test";
  readonly command: string;
}

export interface CommandMetadata {
  readonly idempotencyKey: string;
  readonly actor: RedactedActor;
  readonly source: RedactedSource;
}

export interface AuditEvent {
  readonly type: "application.state_changed";
  readonly applicationId: string;
  readonly from: ApplicationState | null;
  readonly to: ApplicationState;
  readonly metadata: CommandMetadata;
}

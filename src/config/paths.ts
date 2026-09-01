import { homedir } from "node:os";
import { isAbsolute, relative, resolve, join } from "node:path";

export interface RuntimePaths {
  readonly root: string;
  readonly browserProfile: string;
  readonly database: string;
  readonly logs: string;
  readonly backups: string;
}

export function resolveRuntimePaths(homeDirectory: string = homedir()): RuntimePaths {
  const root = resolve(homeDirectory, ".wellfound-application-orchestrator");
  return {
    root,
    browserProfile: join(root, "browser-profile"),
    database: join(root, "state.sqlite3"),
    logs: join(root, "logs"),
    backups: join(root, "backups")
  };
}

function isWithin(candidate: string, parent: string): boolean {
  const childPath = resolve(candidate);
  const parentPath = resolve(parent);
  const distance = relative(parentPath, childPath);
  return distance === "" || (!distance.startsWith("..") && !isAbsolute(distance));
}

export function assertOutsideRepository(paths: RuntimePaths, repositoryDirectory: string): void {
  for (const [name, value] of Object.entries(paths)) {
    if (isWithin(value, repositoryDirectory)) {
      throw new Error(`Runtime path ${name} must be outside the repository.`);
    }
  }
}

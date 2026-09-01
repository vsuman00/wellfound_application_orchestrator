import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { DatabaseSync } from "node:sqlite";

test("built-in SQLite supports transactions and WAL on the supported runtime", async () => {
  const directory = await mkdtemp(join(tmpdir(), "wellfound-sqlite-"));
  const databasePath = join(directory, "state.sqlite");
  const database = new DatabaseSync(databasePath);

  try {
    database.exec("PRAGMA journal_mode = WAL;");
    database.exec("CREATE TABLE records (id INTEGER PRIMARY KEY, value TEXT NOT NULL);");
    const insert = database.prepare("INSERT INTO records (value) VALUES (?)");
    database.exec("BEGIN;");
    insert.run("first");
    database.exec("ROLLBACK;");
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM records").get().count, 0);
    database.exec("BEGIN;");
    insert.run("first");
    insert.run("second");
    database.exec("COMMIT;");
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM records").get().count, 2);
    assert.equal(database.prepare("PRAGMA journal_mode").get().journal_mode, "wal");
  } finally {
    database.close();
    await rm(directory, { recursive: true, force: true });
  }
});

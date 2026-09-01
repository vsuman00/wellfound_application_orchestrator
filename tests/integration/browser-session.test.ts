import { createServer, type Server } from "node:http";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { closeManagedSession, openManagedSession } from "../../src/browser/session.js";

const temporaryDirectories: string[] = [];
const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
  await Promise.all(servers.splice(0).map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});

describe("managed browser session", () => {
  it("persists a local fixture session across context restarts", async () => {
    const directory = await mkdtemp(join(tmpdir(), "wellfound-session-"));
    temporaryDirectories.push(directory);
    const server = createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html" });
      response.end("<html><body><main>Local Wellfound fixture</main></body></html>");
    });
    servers.push(server);
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
    const address = server.address();
    if (address === null || typeof address === "string") {
      throw new Error("Fixture server did not expose a TCP address.");
    }
    const url = `http://127.0.0.1:${address.port}`;

    const first = await openManagedSession({ profileDirectory: directory, headless: true });
    const firstPage = await first.newPage();
    await firstPage.goto(url);
    await firstPage.evaluate(() => localStorage.setItem("fixture-session", "authenticated"));
    await closeManagedSession(first);

    const second = await openManagedSession({ profileDirectory: directory, headless: true });
    const secondPage = await second.newPage();
    await secondPage.goto(url);
    await expect(secondPage.evaluate(() => localStorage.getItem("fixture-session"))).resolves.toBe("authenticated");
    await closeManagedSession(second);
  }, 30_000);
});

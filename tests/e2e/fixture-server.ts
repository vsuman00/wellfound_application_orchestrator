import { createServer } from "node:http";
import { fixtureHtml, fixtureScenarios, type FixtureScenario } from "../fixtures/wellfound/scenarios.js";

export interface FixtureServer {
  readonly baseUrl: string;
  readonly close: () => Promise<void>;
}

export async function startFixtureServer(): Promise<FixtureServer> {
  const server = createServer((request, response) => {
    const scenarioName = request.url?.split("/").filter(Boolean).at(-1);
    if (scenarioName === undefined || !fixtureScenarios.includes(scenarioName as FixtureScenario)) {
      response.writeHead(404, { "content-type": "text/plain" });
      response.end("fixture not found");
      return;
    }
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(fixtureHtml(scenarioName as FixtureScenario));
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", () => resolve()));
  const address = server.address();
  if (address === null || typeof address === "string") {
    server.close();
    throw new Error("Fixture server did not expose a TCP address.");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

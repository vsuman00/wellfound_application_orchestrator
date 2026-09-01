export const fixtureScenarios = [
  "feed",
  "job-detail",
  "modal",
  "questions",
  "submit",
  "confirmation",
  "blocked",
  "changed-dom"
] as const;

export type FixtureScenario = (typeof fixtureScenarios)[number];

const scenarioContent: Readonly<Record<FixtureScenario, string>> = {
  feed: `
    <main data-fixture-scenario="feed">
      <section data-job-feed>
        <article data-job-card data-job-id="fixture-job-1"><a data-job-link href="/scenario/job-detail">Fixture Engineer</a><span data-company>Example Labs</span><span data-location>Remote</span></article>
        <article data-job-card data-job-id="fixture-job-2"><a data-job-link href="/scenario/job-detail">Fixture Product Engineer</a><span data-company>Sample Systems</span><span data-location>Remote</span></article>
      </section>
    </main>
  `,
  "job-detail": `
    <main data-fixture-scenario="job-detail"><article data-job-detail data-job-id="fixture-job-1"><h1 data-job-title>Fixture Engineer</h1><p data-company>Example Labs</p><p data-description>Sanitized fixture description.</p></article></main>
  `,
  modal: `
    <main data-fixture-scenario="modal"><button data-open-modal type="button">Open details</button><dialog data-job-modal><p>Sanitized modal content.</p></dialog></main>
  `,
  questions: `
    <main data-fixture-scenario="questions"><form data-application-form><label>Why this role?<textarea data-question="motivation"></textarea></label><label>Years of experience<input data-question="years" type="number"></label></form></main>
  `,
  submit: `
    <main data-fixture-scenario="submit"><form data-application-form><input data-question="name" value="Fixture Candidate"><button data-submit type="submit">Submit application</button></form></main>
  `,
  confirmation: `
    <main data-fixture-scenario="confirmation"><h1 data-confirmation>Application received</h1><p data-confirmation-id>fixture-confirmation-1</p></main>
  `,
  blocked: `
    <main data-fixture-scenario="blocked"><section data-verification-required><h1>Verification required</h1><p>This sanitized fixture represents a blocked page.</p></section></main>
  `,
  "changed-dom": `
    <main data-fixture-scenario="changed-dom"><section data-unexpected-layout><div>Fixture DOM changed.</div></section></main>
  `
};

export function fixtureHtml(scenario: FixtureScenario): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>Wellfound local fixture</title></head><body>${scenarioContent[scenario]}</body></html>`;
}

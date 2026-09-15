/**
 * Unit tests for src/proxy.ts — edge-cache headers (US-008, ADR-0002).
 *
 * Only the three public HTML routes may carry the edge cache header.
 * /api/*, /_next/*, and anything else must stay untouched so draft
 * previews and form posts can never be cached.
 */

const HEADER = "public, s-maxage=300, stale-while-revalidate=86400";

function makeRequest(path: string) {
  return {
    nextUrl: { pathname: path },
  } as never;
}

describe("proxy — edge cache headers (US-008)", () => {
  let setHeader: jest.Mock;
  let response: { headers: { set: jest.Mock } };

  beforeEach(() => {
    setHeader = jest.fn();
    response = { headers: { set: setHeader } };
    jest.doMock("next/server", () => ({
      NextResponse: { next: () => response },
    }));
  });

  afterEach(() => jest.resetModules());

  async function run(path: string) {
    const { proxy } = await import("@/proxy");
    return proxy(makeRequest(path));
  }

  it.each(["/", "/portfolio", "/portfolio/some-project"])(
    "sets the public edge cache header on %s",
    async (path) => {
      await run(path);
      expect(setHeader).toHaveBeenCalledWith("Cache-Control", HEADER);
    },
  );

  it.each(["/api/preview", "/api/v1/anything", "/_next/static/chunk.js", "/random-page"])(
    "does not set the header on %s",
    async (path) => {
      await run(path);
      expect(setHeader).not.toHaveBeenCalled();
    },
  );
});


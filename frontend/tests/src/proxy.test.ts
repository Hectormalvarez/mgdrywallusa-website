/**
 * Unit tests for src/proxy.ts — edge-cache headers (US-008, ADR-0002).
 *
 * Only the three public HTML routes may carry the edge cache header.
 * /api/*, /_next/*, and anything else must stay untouched so draft
 * previews and form posts can never be cached.
 *
 * Directive contract (revised 2026-09-26, cache-analytics review F3): the
 * header must NOT carry s-maxage / must-revalidate / no-cache, because
 * Cloudflare reads those as implying proxy-revalidate and then refuses to
 * serve stale — which silently disabled stale-while-revalidate in production.
 * The edge TTL comes from the Cache Rule (scripts/cf-cache-rule.sh), not from
 * this header.
 */

const HEADER = "public, max-age=0, stale-while-revalidate=86400";

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

  it("keeps edge stale-serving usable in the real header", async () => {
    await run("/");
    const header = String(setHeader.mock.calls[0]?.[1] ?? "");
    expect(header).toContain("max-age=0");
    expect(header).toContain("stale-while-revalidate=");
    // s-maxage implies proxy-revalidate (RFC 9111 §4.2.4); must-revalidate,
    // no-cache, no-store and private likewise stop the shared cache from
    // serving stale — each one would silently re-disable stale-serving.
    expect(header).not.toMatch(
      /s-maxage|must-revalidate|no-cache|no-store|private/,
    );
  });
});


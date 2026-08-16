import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock next/headers — draftMode().enable() must be callable.
jest.mock("next/headers", () => ({
  draftMode: jest.fn().mockResolvedValue({ enable: jest.fn() }),
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() }),
}));

function makeRequest(url: string): NextRequest {
  return new NextRequest(new URL(url), { method: "GET" });
}

describe("POST /api/preview — content-type allowlist", () => {
  const BASE = "http://localhost:3000/api/preview";

  it("accepts the lowercase content_type that wagtail-headless-preview sends", async () => {
    // wagtail_headless_preview uses cls.__name__.lower() → "home.homepage"
    // A prior bug used "home.HomePage" in the allowlist, which silently
    // rejected every preview with {"error":"Unsupported content type"}.
    const req = makeRequest(
      `${BASE}?content_type=home.homepage&token=abc123`,
    );
    const res = await GET(req);

    // Should NOT be 400 — it should redirect (307) into draft mode.
    expect(res.status).not.toBe(400);
  });

  it("returns 401 when token is missing", async () => {
    const req = makeRequest(`${BASE}?content_type=home.homepage`);
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 for an unknown content_type", async () => {
    const req = makeRequest(
      `${BASE}?content_type=blog.blogpost&token=abc123`,
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

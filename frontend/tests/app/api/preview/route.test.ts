import { NextRequest } from "next/server";
import { GET } from "@/app/api/preview/route";

// Mock next/headers — draftMode().enable() must be callable.
jest.mock("next/headers", () => ({
  draftMode: jest.fn().mockResolvedValue({ enable: jest.fn() }),
  cookies: jest.fn().mockResolvedValue({ get: jest.fn() }),
}));

function makeRequest(url: string, headers?: Record<string, string>): NextRequest {
  return new NextRequest(new URL(url), { method: "GET", headers });
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

describe("POST /api/preview — redirect URL", () => {
  const BASE = "http://localhost:3000/api/preview";

  it("redirects to the public origin from Host header, not internal container address", async () => {
    // Inside Docker, request.url resolves to 0.0.0.0:3000 (internal bind).
    // The redirect must use the public Host header instead.
    const req = makeRequest(
      `${BASE}?content_type=home.homepage&token=abc123`,
      { host: "usrv-01:8101" },
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe("http://usrv-01:8101/");
    expect(location).not.toContain("0.0.0.0");
  });

  it("redirects to HTTPS when X-Forwarded-Proto is set", async () => {
    // Behind Nginx/Cloudflare, the original protocol is HTTPS.
    const req = makeRequest(
      `${BASE}?content_type=home.homepage&token=abc123`,
      {
        host: "mgdrywallusa.taylormadetech.net",
        "x-forwarded-proto": "https",
      },
    );
    const res = await GET(req);

    expect(res.status).toBe(307);
    const location = res.headers.get("location");
    expect(location).toBe("https://mgdrywallusa.taylormadetech.net/");
  });

  it("prefers FRONTEND_URL env var over headers", async () => {
    const originalEnv = process.env.FRONTEND_URL;
    process.env.FRONTEND_URL = "https://example.com";

    try {
      const req = makeRequest(
        `${BASE}?content_type=home.homepage&token=abc123`,
        { host: "internal-host:3000" },
      );
      const res = await GET(req);

      expect(res.status).toBe(307);
      const location = res.headers.get("location");
      expect(location).toBe("https://example.com/");
    } finally {
      process.env.FRONTEND_URL = originalEnv;
    }
  });
});

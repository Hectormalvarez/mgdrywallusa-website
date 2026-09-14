/**
 * Unit tests for the real @/lib/api server-side helpers.
 *
 * global.fetch is mocked — tests verify URL construction, header forwarding,
 * error handling, and data normalization for the functions that power SSR.
 */

describe("@/lib/api — server-side helpers", () => {
  let fetchSpy: jest.SpyInstance;
  beforeEach(() => {
    jest.resetModules();
    fetchSpy = jest.spyOn(global, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
  });

  const OK = (data: unknown) => ({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
  const FAIL = (status = 500) => ({ ok: false, status });

  // ---------------------------------------------------------------------------
  // fetchPortfolioItemsServer
  // ---------------------------------------------------------------------------
  describe("fetchPortfolioItemsServer", () => {
    it("fetches the internal Wagtail URL with X-Forwarded-Proto header", async () => {
      const body = {
        meta: { total_count: 1 },
        items: [{ id: 1, slug: "proj", title: "Proj", meta: {} }],
      };
      fetchSpy.mockResolvedValue(OK(body));

      const { fetchPortfolioItemsServer } = await import("@/lib/api");
      const result = await fetchPortfolioItemsServer({ limit: 6 });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/pages/?type=portfolio.PortfolioItem&fields=*");
      expect(url).toContain("limit=6");
      expect((init?.headers as Record<string, string>)["X-Forwarded-Proto"]).toBe(
        "https",
      );
      expect(result.meta.total_count).toBe(1);
      // Normalizes slug from meta into top-level
      expect(result.items[0].slug).toBe("proj");
    });
  });

  // ---------------------------------------------------------------------------
  // fetchSiteSettings
  // ---------------------------------------------------------------------------
  describe("fetchSiteSettings", () => {
    it("returns chrome from the homepage payload on success", async () => {
      const settings = { site_name: "Live Site", nav: [] };
      fetchSpy.mockResolvedValue(OK({ items: [settings] }));

      const { fetchSiteSettings } = await import("@/lib/api");
      const result = await fetchSiteSettings();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain("type=home.HomePage");
      expect(url).toContain("fields=site_name");
      expect(result.site_name).toBe("Live Site");
    });

    it("returns hard-coded fallback on network error", async () => {
      fetchSpy.mockRejectedValue(new Error("ECONNREFUSED"));

      const { fetchSiteSettings } = await import("@/lib/api");
      const result = await fetchSiteSettings();

      expect(result.site_name).toBe("MG Drywall USA");
    });

    it("fetches the unsaved preview payload in draft mode with a token", async () => {
      const settings = { site_name: "Unsaved Preview", nav: [] };
      fetchSpy.mockResolvedValue(OK(settings));

      const { fetchSiteSettings } = await import("@/lib/api");
      const result = await fetchSiteSettings(true, "tok-123");

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain("/preview/tok-123/");
      expect(result.site_name).toBe("Unsaved Preview");
    });

    it("fetches published settings in draft mode when no token is given", async () => {
      fetchSpy.mockResolvedValue(OK({ items: [{ site_name: "Live Site", nav: [] }] }));

      const { fetchSiteSettings } = await import("@/lib/api");
      const result = await fetchSiteSettings(true);

      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain("type=home.HomePage");
      expect(url).not.toContain("/preview/");
      expect(result.site_name).toBe("Live Site");
    });

    it("falls back to the hard-coded defaults when the preview token has expired", async () => {
      fetchSpy.mockResolvedValue(FAIL(404));

      const { fetchSiteSettings } = await import("@/lib/api");
      const result = await fetchSiteSettings(true, "expired-token");

      expect(result.site_name).toBe("MG Drywall USA");
    });
  });

  // ---------------------------------------------------------------------------
  // fetchHomePage
  // ---------------------------------------------------------------------------
  describe("fetchHomePage", () => {
    it("fetches published homepage (first item in pages response)", async () => {
      const page = { hero_heading: "CMS Heading" };
      fetchSpy.mockResolvedValue(OK({ items: [page] }));

      const { fetchHomePage } = await import("@/lib/api");
      const result = await fetchHomePage(false);

      expect(result).toEqual(page);
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain("type=home.HomePage");
    });

    it("fetches draft homepage via preview token", async () => {
      const page = { hero_heading: "Draft Heading" };
      fetchSpy.mockResolvedValue(OK(page));

      const { fetchHomePage } = await import("@/lib/api");
      const result = await fetchHomePage(true, "tok-abc");

      expect(result).toEqual(page);
      const [url] = fetchSpy.mock.calls[0] as [string];
      expect(url).toContain("/preview/tok-abc/");
    });

    it("returns null when backend returns non-ok status", async () => {
      fetchSpy.mockResolvedValue(FAIL(503));

      const { fetchHomePage } = await import("@/lib/api");
      const result = await fetchHomePage(false);

      expect(result).toBeNull();
    });

    it("returns null on network error", async () => {
      fetchSpy.mockRejectedValue(new Error("fetch failed"));

      const { fetchHomePage } = await import("@/lib/api");
      const result = await fetchHomePage(false);

      expect(result).toBeNull();
    });
  });
});

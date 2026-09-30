import type { Metadata } from "next";
import PortfolioSection from "@/components/sections/PortfolioSection";
import { fetchPortfolioItemsServer } from "@/lib/api";
import { e2eScenarioHeaders } from "@/lib/e2e-headers";
import { getSiteSettings } from "@/lib/settings.server";

export const dynamic = "force-dynamic";

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  "/api/v1/pages/?type=portfolio.PortfolioItem&fields=*";

// Description comes from the CMS tagline (ADR-0004) — no hardcoded brand copy.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: "Our Work",
    description: settings.tagline,
  };
}

export default async function PortfolioPage() {
  // Pre-fetch first page server-side so portfolio renders without client JS.
  const portfolioData = await fetchPortfolioItemsServer(
    { limit: 6 },
    await e2eScenarioHeaders(),
  ).catch(() => null);

  return (
    <main id="main-content">
      <PortfolioSection
        initialItems={portfolioData?.items}
        initialTotalCount={portfolioData?.meta.total_count}
        apiUrl={PORTFOLIO_API_URL}
        heading="Our Work"
        pageLimit={6}
        backLink={{ href: "/", label: "Back to Home" }}
      />
    </main>
  );
}

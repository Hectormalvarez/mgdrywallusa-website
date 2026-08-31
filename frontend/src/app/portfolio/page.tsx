import type { Metadata } from "next";
import PortfolioSection from "@/components/sections/PortfolioSection";
import { fetchPortfolioItemsServer } from "@/lib/api";

export const dynamic = "force-dynamic";

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  "/api/v1/pages/?type=portfolio.PortfolioItem&fields=*";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Browse our portfolio of drywall projects — residential remodels, commercial buildouts, and ADU conversions.",
};

export default async function PortfolioPage() {
  // Pre-fetch first page server-side so portfolio renders without client JS.
  const portfolioData = await fetchPortfolioItemsServer({ limit: 6 }).catch(() => null);

  return (
    <main id="main-content">
      <PortfolioSection
        initialItems={portfolioData?.items}
        initialTotalCount={portfolioData?.meta.total_count}
        apiUrl={PORTFOLIO_API_URL}
        heading="Our Work"
        pageLimit={6}
      />
    </main>
  );
}

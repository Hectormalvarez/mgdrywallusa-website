import type { Metadata } from "next";
import PortfolioSection from "@/components/sections/PortfolioSection";

export const dynamic = "force-dynamic";

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  "http://localhost:8000/api/v1/pages/?type=portfolio.PortfolioItem&fields=*";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Browse our portfolio of drywall projects — residential remodels, commercial buildouts, and ADU conversions.",
};

export default async function PortfolioPage() {
  return (
    <main id="main-content">
      <PortfolioSection apiUrl={PORTFOLIO_API_URL} heading="Our Work" />
    </main>
  );
}

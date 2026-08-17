import { draftMode, cookies } from "next/headers";
import HeroSection from "@/components/sections/HeroSection";
import ServicesSection from "@/components/sections/ServicesSection";

// Prevent static prerender — this page fetches live CMS data on every request.
export const dynamic = "force-dynamic";
import PortfolioSection from "@/components/sections/PortfolioSection";
import LeadIntakeForm from "@/components/forms/LeadIntakeForm";
import { fetchHomePage } from "@/lib/api";

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  "http://localhost:8000/api/v1/pages/?type=portfolio.PortfolioItem&fields=*";

const LEAD_API_URL =
  process.env.NEXT_PUBLIC_LEAD_API_URL ??
  "http://localhost:8000/api/v1/leads/";

export default async function Home() {
  const { isEnabled: isDraft } = await draftMode();
  const previewToken = isDraft
    ? (await cookies()).get("preview_token")?.value ?? null
    : null;

  // fetchHomePage returns null on any error; HeroSection renders static
  // fallbacks when all props are undefined.
  const homeData = await fetchHomePage(isDraft, previewToken).catch(() => null);

  return (
    <main id="main-content">
      <HeroSection
        hero_kicker={homeData?.hero_kicker}
        hero_heading={homeData?.hero_heading}
        hero_subheading={homeData?.hero_subheading}
        hero_image={homeData?.hero_image}
        cta_primary_label={homeData?.cta_primary_label}
        cta_primary_url={homeData?.cta_primary_url}
        cta_secondary_label={homeData?.cta_secondary_label}
        cta_secondary_url={homeData?.cta_secondary_url}
      />
      <ServicesSection
        heading={homeData?.services_heading}
        subheading={homeData?.services_subheading}
        services={homeData?.services}
      />
      <PortfolioSection
        apiUrl={PORTFOLIO_API_URL}
        heading={homeData?.portfolio_heading}
        emptyText={homeData?.portfolio_empty_text}
      />
      <section
        id="lead-form"
        aria-label="Contact"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {homeData?.lead_section_heading ?? "Request a Quote"}
          </h2>
          <p className="mt-2 text-muted">
            {homeData?.lead_section_description ??
              "Tell us about your project and we'll get back to you promptly."}
          </p>
          <div className="mt-8">
            <LeadIntakeForm apiUrl={LEAD_API_URL} />
          </div>
        </div>
      </section>
    </main>
  );
}

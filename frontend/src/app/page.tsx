import HeroSection from "@/components/sections/HeroSection";
import PortfolioSection from "@/components/sections/PortfolioSection";
import LeadIntakeForm from "@/components/LeadIntakeForm";

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  "http://localhost:8000/api/v1/pages/?type=portfolio.PortfolioItem&fields=*";

const LEAD_API_URL =
  process.env.NEXT_PUBLIC_LEAD_API_URL ??
  "http://localhost:8000/api/v1/leads/";

export default function Home() {
  return (
    <main id="main-content">
      <HeroSection />
      <PortfolioSection apiUrl={PORTFOLIO_API_URL} />
      <section
        id="lead-form"
        aria-label="Contact"
        className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
      >
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Request a Quote
          </h2>
          <p className="mt-2 text-muted">
            Tell us about your project and we&apos;ll get back to you promptly.
          </p>
          <div className="mt-8">
            <LeadIntakeForm apiUrl={LEAD_API_URL} />
          </div>
        </div>
      </section>
    </main>
  );
}



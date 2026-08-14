import HeroSection from '@/components/HeroSection';
import PortfolioSection from '@/components/PortfolioSection';
import LeadIntakeForm from '@/components/LeadIntakeForm';

const PORTFOLIO_API_URL =
  process.env.NEXT_PUBLIC_WAGTAIL_API_URL ??
  'http://localhost:8000/api/v1/pages/?type=portfolio.PortfolioItem&fields=*';

export default function Home() {
  return (
    <main>
      <HeroSection />
      <PortfolioSection apiUrl={PORTFOLIO_API_URL} />
      <section id="lead-form" aria-label="Contact" style={{ padding: '2rem 1rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
          Request a Quote
        </h2>
        <LeadIntakeForm />
      </section>
    </main>
  );
}


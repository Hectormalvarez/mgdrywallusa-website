import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@tests/utils/axe-helper';
import HeroSection from '@/components/sections/HeroSection';

// jsdom does not implement next/image layout measurements
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt ?? ''} />;
  },
}));

describe('HeroSection', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<HeroSection />);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('renders fallback heading and subheading', () => {
    render(<HeroSection />);
    expect(
      screen.getByRole('heading', { name: /mg drywall usa/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/professional drywall installation/i)
    ).toBeInTheDocument();
  });

  it('renders CMS-provided heading and subheading', () => {
    render(
      <HeroSection
        hero_heading="Custom Heading"
        hero_subheading="Custom subheading text."
      />
    );
    expect(
      screen.getByRole('heading', { name: /custom heading/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Custom subheading text.')).toBeInTheDocument();
  });

  it('renders primary CTA with fallback href', () => {
    render(<HeroSection />);
    const primary = screen.getByRole('link', { name: /get a free quote/i });
    expect(primary).toHaveAttribute('href', '#lead-form');
  });

  it('renders secondary CTA with fallback href', () => {
    render(<HeroSection />);
    const secondary = screen.getByRole('link', { name: /view our work/i });
    expect(secondary).toHaveAttribute('href', '#portfolio');
  });

  it('renders CMS-provided CTA labels and URLs', () => {
    render(
      <HeroSection
        cta_primary_label="Call Now"
        cta_primary_url="tel:+15551234567"
        cta_secondary_label="Learn More"
        cta_secondary_url="/about"
      />
    );
    expect(screen.getByRole('link', { name: /call now/i })).toHaveAttribute(
      'href',
      'tel:+15551234567'
    );
    expect(screen.getByRole('link', { name: /learn more/i })).toHaveAttribute(
      'href',
      '/about'
    );
  });

  it('uses CMS hero_image when provided', () => {
    const { container } = render(
      <HeroSection
        hero_image={{ url: '/cms/hero.png', width: 1200, height: 630, alt: 'CMS hero' }}
      />
    );
    const img = container.querySelector('img[src="/cms/hero.png"]');
    expect(img).toBeInTheDocument();
  });

  it('falls back to default hero image when CMS image is absent', () => {
    const { container } = render(<HeroSection />);
    const img = container.querySelector('img[src="/images/hero-drywall.png"]');
    expect(img).toBeInTheDocument();
  });

  it('sanitizes hero_subheading HTML via DOMPurify', () => {
    const { container } = render(
      <HeroSection hero_subheading="Safe text<script>alert(1)</script>" />
    );
    expect(container.innerHTML).not.toContain('<script>');
    expect(screen.getByText(/safe text/i)).toBeInTheDocument();
  });
});

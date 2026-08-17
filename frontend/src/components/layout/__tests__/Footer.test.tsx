import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@/lib/test-utils/axe-helper';
import Footer from '@/components/layout/Footer';
import type { SiteSettingsData } from '@/types/settings';

const mockSettings: SiteSettingsData = {
  site_name: 'MG Drywall USA',
  tagline: 'Precision drywall framing, hanging, and Level 5 finishing.',
  phone_number: '+1-555-DRYWALL',
  contact_email: 'info@mgdrywallusa.com',
  license_number: 'TX-104928',
  logo_url: null,
  favicon_url: null,
  primary_color: '#0A3161',
  accent_color: '#B31942',
  banner_enabled: false,
  banner_text: '',
  banner_link: '#lead-form',
  google_review_url: 'https://g.page/r/review',
  yelp_url: 'https://yelp.com/biz/mg-drywall',
  facebook_url: 'https://facebook.com/mgdrywall',
  instagram_url: 'https://instagram.com/mgdrywall',
  seo: {
    address_locality: 'Austin',
    address_region: 'TX',
    postal_code: '78701',
    country: 'US',
    price_range: '$$',
  },
  nav: [
    { label: 'Services', href: '#services' },
    { label: 'Our Work', href: '#portfolio' },
    { label: 'Contact', href: '#lead-form' },
  ],
};

describe('Footer component', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Footer settings={mockSettings} />);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('renders brand identity, tagline, and current year copyright', () => {
    render(<Footer settings={mockSettings} />);
    const currentYear = new Date().getFullYear();

    expect(screen.getByRole('heading', { level: 2, name: 'MG Drywall USA' })).toBeInTheDocument();
    expect(screen.getByText('Precision drywall framing, hanging, and Level 5 finishing.')).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`© ${currentYear} MG Drywall USA`, 'i'))).toBeInTheDocument();
  });

  it('renders logo image instead of heading text when logo_url is present', () => {
    const settingsWithLogo: SiteSettingsData = {
      ...mockSettings,
      logo_url: '/media/original_images/footer-logo.png',
    };
    render(<Footer settings={settingsWithLogo} />);
    const logoImg = screen.getByRole('img', { name: 'MG Drywall USA' });
    expect(logoImg).toHaveAttribute('src', '/media/original_images/footer-logo.png');
  });

  it('renders contractor license badge when license_number is provided', () => {
    render(<Footer settings={mockSettings} />);
    expect(screen.getByText(/licensed & insured – tx-104928/i)).toBeInTheDocument();
    expect(screen.getByText(/license #tx-104928/i)).toBeInTheDocument();
  });

  it('omits license badge when license_number is empty', () => {
    const settingsNoLicense: SiteSettingsData = {
      ...mockSettings,
      license_number: '',
    };
    render(<Footer settings={settingsNoLicense} />);
    expect(screen.queryByText(/licensed & insured/i)).not.toBeInTheDocument();
  });

  it('renders phone and email links with correct URI schemes', () => {
    render(<Footer settings={mockSettings} />);
    const phoneLink = screen.getByRole('link', { name: '+1-555-DRYWALL' });
    const emailLink = screen.getByRole('link', { name: 'info@mgdrywallusa.com' });

    expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-DRYWALL');
    expect(emailLink).toHaveAttribute('href', 'mailto:info@mgdrywallusa.com');
  });

  it('renders all quick navigation links', () => {
    render(<Footer settings={mockSettings} />);
    mockSettings.nav.forEach((item) => {
      const link = screen.getByRole('link', { name: item.label });
      expect(link).toHaveAttribute('href', item.href);
    });
  });

  it('renders configured social review links with external security attributes', () => {
    render(<Footer settings={mockSettings} />);
    const googleLink = screen.getByRole('link', { name: /leave a google review/i });
    const yelpLink = screen.getByRole('link', { name: /view on yelp/i });
    const fbLink = screen.getByRole('link', { name: /follow on facebook/i });
    const igLink = screen.getByRole('link', { name: /follow on instagram/i });

    expect(googleLink).toHaveAttribute('href', 'https://g.page/r/review');
    expect(googleLink).toHaveAttribute('target', '_blank');
    expect(googleLink).toHaveAttribute('rel', 'noopener noreferrer');

    expect(yelpLink).toHaveAttribute('href', 'https://yelp.com/biz/mg-drywall');
    expect(fbLink).toHaveAttribute('href', 'https://facebook.com/mgdrywall');
    expect(igLink).toHaveAttribute('href', 'https://instagram.com/mgdrywall');
  });

  it('omits social links section when social URLs are empty strings', () => {
    const settingsNoSocials: SiteSettingsData = {
      ...mockSettings,
      google_review_url: '',
      yelp_url: '',
      facebook_url: '',
      instagram_url: '',
    };
    render(<Footer settings={settingsNoSocials} />);
    expect(screen.queryByRole('link', { name: /leave a google review/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /view on yelp/i })).not.toBeInTheDocument();
  });
});

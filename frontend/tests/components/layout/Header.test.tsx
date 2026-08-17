import { render, screen, fireEvent, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@tests/utils/axe-helper';
import Header from '@/components/layout/Header';
import type { SiteSettingsData } from '@/types/settings';

const mockSettings: SiteSettingsData = {
  site_name: 'MG Drywall USA',
  tagline: 'Professional drywall installation and repair.',
  phone_number: '+1-555-DRYWALL',
  contact_email: 'info@mgdrywallusa.com',
  license_number: 'TX-987654',
  logo_url: null,
  favicon_url: null,
  primary_color: '#0A3161',
  accent_color: '#B31942',
  banner_enabled: false,
  banner_text: '',
  banner_link: '#lead-form',
  google_review_url: '',
  yelp_url: '',
  facebook_url: '',
  instagram_url: '',
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

describe('Header component', () => {
  it('renders skip-to-content accessibility link', () => {
    render(<Header settings={mockSettings} />);
    const skipLink = screen.getByRole('link', { name: /skip to content/i });
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('renders text brand title when logo_url is null', () => {
    render(<Header settings={mockSettings} />);
    const brandLinks = screen.getAllByRole('link', { name: /mg drywall usa/i });
    expect(brandLinks.length).toBeGreaterThan(0);
  });

  it('renders brand logo image when logo_url is provided', () => {
    const settingsWithLogo: SiteSettingsData = {
      ...mockSettings,
      logo_url: '/media/original_images/logo.png',
    };
    render(<Header settings={settingsWithLogo} />);
    const logos = screen.getAllByRole('img', { name: 'MG Drywall USA' });
    expect(logos[0]).toHaveAttribute('src', '/media/original_images/logo.png');
  });

  it('renders all desktop navigation links with correct hrefs', () => {
    render(<Header settings={mockSettings} />);
    // There are two <nav aria-label="Main">: desktop (always in DOM) and mobile
    // drawer.  The first one in the tree is the desktop nav inside <header>.
    const mainNav = screen.getAllByRole('navigation', { name: 'Main' })[0];

    mockSettings.nav.forEach((item) => {
      const link = screen.getAllByRole('link', { name: item.label })[0];
      expect(mainNav).toContainElement(link);
      expect(link).toHaveAttribute('href', item.href);
    });
  });

  it('toggles mobile drawer and updates aria-expanded state', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Open drawer
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
    const dialog = screen.getByRole('dialog', { name: /main navigation/i });
    expect(dialog).toBeInTheDocument();

    // Close via close button inside the drawer (the hamburger also relabels to
    // "Close menu" when open, so scope the query to within the dialog).
    const closeBtn = within(dialog).getByRole('button', { name: /close menu/i });
    fireEvent.click(closeBtn);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes mobile drawer when Escape key is pressed', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });

    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('traps focus inside the drawer when tabbing forward', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole('dialog', { name: /main navigation/i });
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);
    const last = focusable[focusable.length - 1];
    last.focus();

    fireEvent.keyDown(document, { key: 'Tab', code: 'Tab' });
    expect(document.activeElement).toBe(focusable[0]);
  });

  it('traps focus inside the drawer when tabbing backward', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole('dialog', { name: /main navigation/i });
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    expect(focusable.length).toBeGreaterThan(0);
    const first = focusable[0];
    first.focus();

    fireEvent.keyDown(document, {
      key: 'Tab',
      code: 'Tab',
      shiftKey: true,
    });
    expect(document.activeElement).toBe(
      focusable[focusable.length - 1]
    );
  });

  it('closes drawer when backdrop is clicked', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    const backdrop = document.querySelector('div.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('locks body scroll when drawer is open and restores it on close', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });

    fireEvent.click(hamburger);
    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('renders phone link in mobile drawer footer', () => {
    render(<Header settings={mockSettings} />);
    const phoneLink = screen.getByRole('link', { name: /555-drywall/i });
    expect(phoneLink).toHaveAttribute('href', 'tel:+1-555-DRYWALL');
  });
});

describe('Header — accessibility', () => {
  it('has no accessibility violations when drawer is closed', async () => {
    const { container } = render(<Header settings={mockSettings} />);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('has no accessibility violations when drawer is open', async () => {
    const { container } = render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('hamburger has aria-controls and toggles aria-expanded', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    expect(hamburger).toHaveAttribute('aria-controls', 'mobile-menu');
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(hamburger);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');
  });

  it('returns focus to hamburger when drawer closes', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole('dialog', { name: /main navigation/i });
    const closeBtn = within(dialog).getByRole('button', { name: /close menu/i });
    fireEvent.click(closeBtn);

    expect(hamburger).toHaveFocus();
  });

  it('drawer has aria-modal when open', () => {
    render(<Header settings={mockSettings} />);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);

    const dialog = screen.getByRole('dialog', { name: /main navigation/i });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});

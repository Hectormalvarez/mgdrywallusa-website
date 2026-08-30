import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/headers', () => ({
  draftMode: jest.fn().mockResolvedValue({ isEnabled: false }),
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(null),
  }),
}));

jest.mock('@/lib/api', () => ({
  fetchHomePage: jest.fn().mockResolvedValue({
    hero_heading: 'CMS Hero Heading',
    hero_subheading: 'CMS <strong>subheading</strong> text.',
    hero_image: { url: '/cms/hero.png', width: 1200, height: 630, alt: 'CMS hero' },
    cta_primary_label: 'CMS Primary',
    cta_primary_url: '/cms-primary',
    cta_secondary_label: 'CMS Secondary',
    cta_secondary_url: '/cms-secondary',
    services_heading: 'CMS Services',
    services_subheading: 'CMS services description.',
    featured_services: [
      { name: 'CMS Service', slug: 'cms-service', short_description: 'A custom service.', icon: 'shield' },
    ],
    portfolio_heading: 'CMS Portfolio',
    portfolio_empty_text: 'No projects yet.',
    lead_section_heading: 'CMS Lead Heading',
    lead_section_description: 'CMS lead description.',
  }),
  fetchPortfolioItems: jest.fn().mockResolvedValue({
    meta: { total_count: 0 },
    items: [],
  }),
}));

import Home from '@/app/page';

describe('Home page with CMS data', () => {
  it('renders CMS hero heading', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(
      screen.getByRole('heading', { name: /cms hero heading/i })
    ).toBeInTheDocument();
  });

  it('renders CMS CTA labels and URLs', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(screen.getByRole('link', { name: /cms primary/i })).toHaveAttribute(
      'href',
      '/cms-primary'
    );
    expect(screen.getByRole('link', { name: /cms secondary/i })).toHaveAttribute(
      'href',
      '/cms-secondary'
    );
  });

  it('renders CMS services heading and items', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(
      screen.getByRole('heading', { name: /cms services/i })
    ).toBeInTheDocument();
    expect(screen.getByText('CMS Service')).toBeInTheDocument();
  });

  it('renders CMS portfolio heading and empty text', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(
      screen.getByRole('heading', { name: /cms portfolio/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('No projects yet.')).toBeInTheDocument();
    });
  });

  it('renders CMS lead section heading and description', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(
      screen.getByRole('heading', { name: /cms lead heading/i })
    ).toBeInTheDocument();
    expect(screen.getByText('CMS lead description.')).toBeInTheDocument();
  });
});

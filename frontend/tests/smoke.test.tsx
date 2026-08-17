import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock next/headers — Home is an async Server Component
jest.mock('next/headers', () => ({
  draftMode: jest.fn().mockResolvedValue({ isEnabled: false }),
  cookies: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock the API client so tests run without a live backend
jest.mock('@/lib/api', () => ({
  fetchHomePage: jest.fn().mockResolvedValue(null),
  fetchPortfolioItems: jest.fn().mockResolvedValue({
    meta: { total_count: 1 },
    items: [
      {
        id: 1,
        title: 'Kitchen Remodel',
        description: '',
        scope: 'residential',
        featured_image_url: null,
        gallery_images: [],
        finish_tags: [],
        meta: { type: 'portfolio.PortfolioItem', detail_url: '' },
      },
    ],
  }),
}));

import Home from '@/app/page';

describe('Home page', () => {
  it('renders the hero heading', async () => {
    await act(async () => {
      render(await Home());
    });
    const heading = screen.getByRole('heading', { name: /mg drywall usa/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the CTA link that anchors to the lead form', async () => {
    await act(async () => {
      render(await Home());
    });
    const cta = screen.getByRole('link', { name: /get a free quote/i });
    expect(cta).toHaveAttribute('href', '#lead-form');
  });

  it('renders the portfolio section with fetched items', async () => {
    await act(async () => {
      render(await Home());
    });
    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });
  });

  it('renders the services section', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(screen.getByRole('heading', { name: /our services/i })).toBeInTheDocument();
    expect(screen.getByText('Level 5 Finishing')).toBeInTheDocument();
  });

  it('renders the lead intake form', async () => {
    await act(async () => {
      render(await Home());
    });
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});

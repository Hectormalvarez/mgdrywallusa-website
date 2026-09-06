import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('next/headers', () => ({
  draftMode: jest.fn().mockResolvedValue({ isEnabled: false }),
}));

jest.mock('@/lib/api', () => ({
  fetchPortfolioItems: jest.fn().mockResolvedValue({
    meta: { total_count: 2 },
    items: [
      {
        id: 1,
        slug: 'kitchen-remodel',
        title: 'Test Kitchen',
        description: '<p>A kitchen project.</p>',
        scope: 'residential',
        scope_label: 'Residential',
        finish_tags: ['smooth'],
        featured_image: {
          thumbnail: '/media/thumb.png',
          card: '/media/card.png',
          full: '/media/full.png',
          alt: 'Kitchen',
        },
        gallery_images: [],
      },
      {
        id: 2,
        slug: 'office-build',
        title: 'Test Office',
        description: '<p>An office project.</p>',
        scope: 'commercial',
        scope_label: 'Commercial',
        finish_tags: [],
        featured_image: null,
        gallery_images: [],
      },
    ],
  }),
  fetchPortfolioItemsServer: jest.fn().mockResolvedValue({
    meta: { total_count: 2 },
    items: [
      {
        id: 1,
        slug: 'kitchen-remodel',
        title: 'Test Kitchen',
        description: '<p>A kitchen project.</p>',
        scope: 'residential',
        scope_label: 'Residential',
        finish_tags: ['smooth'],
        featured_image: {
          thumbnail: '/media/thumb.png',
          card: '/media/card.png',
          full: '/media/full.png',
          alt: 'Kitchen',
        },
        gallery_images: [],
      },
      {
        id: 2,
        slug: 'office-build',
        title: 'Test Office',
        description: '<p>An office project.</p>',
        scope: 'commercial',
        scope_label: 'Commercial',
        finish_tags: [],
        featured_image: null,
        gallery_images: [],
      },
    ],
  }),
}));

import PortfolioPage from '@/app/portfolio/page';

describe('Portfolio listing page', () => {
  it('renders the page heading and portfolio items', async () => {
    await act(async () => {
      render(await PortfolioPage());
    });

    expect(
      screen.getByRole('heading', { name: /our work/i })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('Test Kitchen')).toBeInTheDocument();
      expect(screen.getByText('Test Office')).toBeInTheDocument();
    });
  });

  it('does not render a View All link (it IS the listing page)', async () => {
    await act(async () => {
      render(await PortfolioPage());
    });

    await waitFor(() => {
      expect(screen.getByText('Test Kitchen')).toBeInTheDocument();
    });

    expect(
      screen.queryByRole('link', { name: /view all projects/i })
    ).not.toBeInTheDocument();
  });
});

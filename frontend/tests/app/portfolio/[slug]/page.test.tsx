import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';

const mockItem = {
  id: 1,
  slug: 'kitchen-remodel',
  title: 'Kitchen Remodel',
  description: '<p>Complete <strong>drywall installation</strong> for a kitchen.</p>',
  scope: 'residential',
  scope_label: 'Residential',
  finish_tags: ['Level 5 Smooth', 'Custom Texture'],
  featured_image: {
    thumbnail: '/media/thumb.webp',
    card: '/media/card.webp',
    full: '/media/full.webp',
    alt: 'Kitchen Remodel',
  },
  gallery_images: [
    {
      id: 1,
      image: {
        thumbnail: '/media/g-thumb.webp',
        card: '/media/g-card.webp',
        full: '/media/g-full.webp',
        alt: 'Gallery photo',
      },
      caption: 'Finished wall',
    },
    {
      id: 2,
      image: {
        thumbnail: '/media/g2-thumb.webp',
        card: '/media/g2-card.webp',
        full: '/media/g2-full.webp',
        alt: 'Gallery photo 2',
      },
      caption: '',
    },
  ],
};

jest.mock('next/headers', () => ({
  draftMode: jest.fn().mockResolvedValue({ isEnabled: false }),
}));

jest.mock('@/lib/api', () => ({
  fetchPortfolioItems: jest.fn().mockImplementation((url: string) => {
    if (url.includes('slug=kitchen-remodel')) {
      return Promise.resolve({ meta: { total_count: 1 }, items: [mockItem] });
    }
    return Promise.resolve({ meta: { total_count: 0 }, items: [] });
  }),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn().mockReturnValue({ back: jest.fn() }),
}));

import PortfolioDetailPage from '@/app/portfolio/[slug]/page';

describe('Portfolio detail page', () => {
  it('renders the project title and description', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    expect(screen.getByRole('heading', { name: 'Kitchen Remodel' })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Complete/)).toBeInTheDocument();
      expect(document.querySelector('strong')?.textContent).toBe('drywall installation');
    });
  });

  it('renders the scope badge', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    expect(screen.getByText('Residential')).toBeInTheDocument();
  });

  it('renders finish tags', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    expect(screen.getByText('Level 5 Smooth')).toBeInTheDocument();
    expect(screen.getByText('Custom Texture')).toBeInTheDocument();
  });

  it('renders featured image and gallery images', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    const images = screen.getAllByRole('img');
    // 1 featured + 2 gallery = 3
    expect(images).toHaveLength(3);
  });

  it('renders gallery captions', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    expect(screen.getByText('Finished wall')).toBeInTheDocument();
  });

  it('renders a back link to /portfolio', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'kitchen-remodel' }) }));
    });

    const backLink = screen.getByRole('link', { name: /back to portfolio/i });
    expect(backLink).toHaveAttribute('href', '/portfolio');
  });

  it('shows not found for unknown slug', async () => {
    await act(async () => {
      render(await PortfolioDetailPage({ params: Promise.resolve({ slug: 'unknown' }) }));
    });

    expect(screen.getByText(/not found/i)).toBeInTheDocument();
  });
});

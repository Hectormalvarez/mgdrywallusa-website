import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { axeCheck } from '@tests/utils/axe-helper';
import { server } from '@tests/mocks/server';
import PortfolioSection from '@/components/sections/PortfolioSection';

describe('PortfolioSection', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(
      <PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />
    );
    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('renders portfolio items fetched from the API', async () => {
    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
      expect(screen.getByText('Office Build-Out')).toBeInTheDocument();
      expect(screen.getAllByText('Residential').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Commercial').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('smooth').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('level-5').length).toBeGreaterThanOrEqual(2);

      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(4);
      expect(images[0]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test1.png');
      expect(images[1]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test1.png');
      expect(images[2]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test2.png');
      expect(images[3]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test2.png');
    });
  });

  it('renders rich HTML descriptions below the title', async () => {
    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      // The description text should be rendered (stripped of HTML tags for text matching)
      expect(screen.getByText(/Complete kitchen drywall installation/)).toBeInTheDocument();
      // The <strong> tag inside the RichTextField should be preserved
      expect(document.querySelector('strong')?.textContent).toBe('Level 5 finish');
    });
  });

  it('renders visible figure captions below gallery images', async () => {
    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Captions should be visible (not sr-only)
    const caption1 = screen.getByText('Smooth ceiling finish');
    expect(caption1.tagName).toBe('FIGCAPTION');
    expect(caption1).not.toHaveClass('sr-only');

    const caption2 = screen.getByText('Partition wall taping');
    expect(caption2.tagName).toBe('FIGCAPTION');
    expect(caption2).not.toHaveClass('sr-only');
  });

  it('has no accessibility violations with visible captions', async () => {
    const { container } = render(
      <PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />
    );
    await waitFor(() => {
      expect(screen.getByText('Smooth ceiling finish')).toBeInTheDocument();
    });
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('does not render description or caption elements when fields are empty', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.json({
          meta: { total_count: 1 },
          items: [
            {
              id: 99,
              meta: { type: 'portfolio.PortfolioItem', detail_url: '' },
              title: 'Empty Project',
              slug: 'empty-project',
              description: '',
              scope: 'residential',
              scope_label: 'Residential',
              finish_tags: [],
              featured_image: null,
              gallery_images: [
                {
                  id: 1,
                  image: {
                    thumbnail: 'http://localhost:8000/media/fill-150x150/test.png',
                    card: 'http://localhost:8000/media/fill-800x600/test.png',
                    full: 'http://localhost:8000/media/max-1600x1200/test.png',
                    alt: '',
                  },
                  caption: '',
                },
              ],
            },
          ],
        });
      })
    );

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText('Empty Project')).toBeInTheDocument();
    });

    // No description prose container should exist
    expect(document.querySelector('.prose')).not.toBeInTheDocument();
    // No figcaption elements should exist
    expect(document.querySelectorAll('figcaption')).toHaveLength(0);
  });

  it('displays an error message when the API request fails', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load portfolio/i)).toBeInTheDocument();
    });
  });

  it('displays a skeleton loading state initially', () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return new Promise(() => {}); // never resolves
      })
    );

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    expect(screen.getByRole('heading', { name: /our work/i })).toBeInTheDocument();
    const skeletonCards = document.querySelectorAll('article[aria-hidden="true"]');
    expect(skeletonCards.length).toBeGreaterThan(0);
  });

  it('renders View All link when showViewAll is true', async () => {
    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
        showViewAll
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: /view all projects/i });
    expect(link).toHaveAttribute('href', '/portfolio');
  });

  it('does not render View All link when showViewAll is false', async () => {
    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    expect(screen.queryByRole('link', { name: /view all projects/i })).not.toBeInTheDocument();
  });

  it('shows Load More button when paginated and more items exist', async () => {
    // Mock: API has 4 total items, first page returns 2
    server.use(
      http.get('*/api/v1/pages/', ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get('offset') || '0');
        const allItems = [
          {
            id: 1, slug: 'item-1', title: 'Project One', description: '<p>One</p>',
            scope: 'residential', scope_label: 'Residential', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
          {
            id: 2, slug: 'item-2', title: 'Project Two', description: '<p>Two</p>',
            scope: 'commercial', scope_label: 'Commercial', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
          {
            id: 3, slug: 'item-3', title: 'Project Three', description: '<p>Three</p>',
            scope: 'residential', scope_label: 'Residential', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
          {
            id: 4, slug: 'item-4', title: 'Project Four', description: '<p>Four</p>',
            scope: 'commercial', scope_label: 'Commercial', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
        ];
        const limit = 2;
        const page = allItems.slice(offset, offset + limit);
        return HttpResponse.json({
          meta: { total_count: allItems.length },
          items: page,
        });
      })
    );

    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
        pageLimit={2}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

    // Only 2 items rendered initially
    expect(screen.getByText('Project Two')).toBeInTheDocument();
    expect(screen.queryByText('Project Three')).not.toBeInTheDocument();

    // Load More button should be visible
    const loadMoreBtn = screen.getByRole('button', { name: /load more/i });
    expect(loadMoreBtn).toBeInTheDocument();
  });

  it('appends items and hides button when all items loaded', async () => {
    server.use(
      http.get('*/api/v1/pages/', ({ request }) => {
        const url = new URL(request.url);
        const offset = Number(url.searchParams.get('offset') || '0');
        const allItems = [
          {
            id: 1, slug: 'item-1', title: 'Project One', description: '',
            scope: 'residential', scope_label: 'Residential', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
          {
            id: 2, slug: 'item-2', title: 'Project Two', description: '',
            scope: 'commercial', scope_label: 'Commercial', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
          {
            id: 3, slug: 'item-3', title: 'Project Three', description: '',
            scope: 'residential', scope_label: 'Residential', finish_tags: [],
            featured_image: null, gallery_images: [],
          },
        ];
        const limit = 2;
        const page = allItems.slice(offset, offset + limit);
        return HttpResponse.json({
          meta: { total_count: allItems.length },
          items: page,
        });
      })
    );

    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
        pageLimit={2}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Project One')).toBeInTheDocument();
    });

    // Click Load More
    await screen.findByRole('button', { name: /load more/i });
    await screen.findByRole('button', { name: /load more/i }).then(btn => btn.click());

    await waitFor(() => {
      expect(screen.getByText('Project Three')).toBeInTheDocument();
    });

    // All 3 items visible, button gone, "all loaded" message shown
    expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    expect(screen.getByText(/all projects loaded/i)).toBeInTheDocument();
  });

  it('extracts and renders unique finish tags as filter chips', async () => {
    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Mock data has tags: 'smooth' and 'level-5'
    const tagChips = screen.getAllByRole('checkbox');
    const tagLabels = tagChips.map((el) => el.textContent?.trim());
    expect(tagLabels).toContain('smooth');
    expect(tagLabels).toContain('level-5');
  });

  it('filters items by selected finish tag', async () => {
    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Click the 'smooth' tag chip
    const smoothChip = screen.getByRole('checkbox', { name: 'smooth' });
    smoothChip.click();

    await waitFor(() => {
      // Kitchen Remodel has 'smooth', Office Build-Out does not
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
      expect(screen.queryByText('Office Build-Out')).not.toBeInTheDocument();
    });
  });

  it('shows all items when tag filter is cleared', async () => {
    render(
      <PortfolioSection
        apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    // Click 'smooth' to filter
    screen.getByRole('checkbox', { name: 'smooth' }).click();
    await waitFor(() => {
      expect(screen.queryByText('Office Build-Out')).not.toBeInTheDocument();
    });

    // Click 'smooth' again to deselect
    screen.getByRole('checkbox', { name: 'smooth' }).click();
    await waitFor(() => {
      expect(screen.getByText('Office Build-Out')).toBeInTheDocument();
    });
  });
});


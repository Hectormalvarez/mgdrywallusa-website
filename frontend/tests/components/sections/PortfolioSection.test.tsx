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
      expect(screen.getByText('residential')).toBeInTheDocument();
      expect(screen.getByText('commercial')).toBeInTheDocument();
      expect(screen.getByText('smooth')).toBeInTheDocument();
      expect(screen.getAllByText('level-5')).toHaveLength(2);

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
              description: '',
              scope: 'residential',
              finish_tags: [],
              featured_image_url: null,
              gallery_images: [
                {
                  url: 'http://localhost:8000/media/test.png',
                  width: 800,
                  height: 600,
                  alt: '',
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
});


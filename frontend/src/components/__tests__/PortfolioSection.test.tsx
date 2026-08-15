import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import PortfolioSection from '@/components/sections/PortfolioSection';

describe('PortfolioSection', () => {
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


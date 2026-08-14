import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import PortfolioSection from '@/components/PortfolioSection';

describe('PortfolioSection', () => {
  it('renders portfolio items fetched from the API', async () => {
    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete kitchen drywall installation')).toBeInTheDocument();
    expect(screen.getByText('Office Build-Out')).toBeInTheDocument();
    expect(screen.getByText('Commercial office partition walls')).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test1.png');
    expect(images[1]).toHaveAttribute('src', 'http://localhost:8000/media/fill-800x600/test2.png');
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

  it('displays a loading state initially', () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return new Promise(() => {}); // never resolves
      })
    );

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});


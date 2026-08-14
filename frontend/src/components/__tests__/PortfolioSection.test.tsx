import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioSection from '@/components/PortfolioSection';

const mockApiResponse = {
  meta: { total_count: 2 },
  items: [
    {
      id: 1,
      meta: {
        type: 'portfolio.PortfolioItem',
        detail_url: 'http://localhost:8001/api/v2/pages/1/',
      },
      title: 'Kitchen Remodel',
      description: 'Complete kitchen drywall installation',
      image_url: 'http://localhost:8001/media/fill-800x600/test1.png',
    },
    {
      id: 2,
      meta: {
        type: 'portfolio.PortfolioItem',
        detail_url: 'http://localhost:8001/api/v2/pages/2/',
      },
      title: 'Office Build-Out',
      description: 'Commercial office partition walls',
      image_url: 'http://localhost:8001/media/fill-800x600/test2.png',
    },
  ],
};

beforeEach(() => {
  jest.restoreAllMocks();
});

describe('PortfolioSection', () => {
  it('renders portfolio items fetched from the API', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockApiResponse,
    });

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });

    expect(screen.getByText('Complete kitchen drywall installation')).toBeInTheDocument();
    expect(screen.getByText('Office Build-Out')).toBeInTheDocument();
    expect(screen.getByText('Commercial office partition walls')).toBeInTheDocument();

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(images[0]).toHaveAttribute('src', 'http://localhost:8001/media/fill-800x600/test1.png');
    expect(images[1]).toHaveAttribute('src', 'http://localhost:8001/media/fill-800x600/test2.png');
  });

  it('displays an error message when the API request fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load portfolio/i)).toBeInTheDocument();
    });
  });

  it('displays a loading state initially', () => {
    global.fetch = jest.fn().mockReturnValue(new Promise(() => {})); // never resolves

    render(<PortfolioSection apiUrl="http://localhost:8001/api/v1/pages/?type=portfolio.PortfolioItem&fields=*" />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});

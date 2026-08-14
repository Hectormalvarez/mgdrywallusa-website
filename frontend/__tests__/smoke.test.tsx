import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../src/app/page';

describe('Home page', () => {
  it('renders the hero heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /mg drywall usa/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders the CTA link that anchors to the lead form', () => {
    render(<Home />);
    const cta = screen.getByRole('link', { name: /get a free quote/i });
    expect(cta).toHaveAttribute('href', '#lead-form');
  });

  it('renders the portfolio section with fetched items', async () => {
    render(<Home />);
    await waitFor(() => {
      expect(screen.getByText('Kitchen Remodel')).toBeInTheDocument();
    });
  });

  it('renders the lead intake form', () => {
    render(<Home />);
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
  });
});


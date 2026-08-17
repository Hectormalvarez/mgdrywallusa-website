import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NotFoundPage from '@/app/not-found';

describe('NotFoundPage', () => {
  it('renders 404 heading and message', () => {
    render(<NotFoundPage />);
    expect(screen.getByRole('heading', { name: /page not found/i })).toBeInTheDocument();
    expect(
      screen.getByText(/sorry, we couldn't find the page/i)
    ).toBeInTheDocument();
  });

  it('renders "Go back home" link pointing to /', () => {
    render(<NotFoundPage />);
    const link = screen.getByRole('link', { name: /go back home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});

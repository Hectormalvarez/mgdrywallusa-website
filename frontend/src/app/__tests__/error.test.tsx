import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorPage from '@/app/error';

describe('ErrorPage', () => {
  it('renders error heading and message', () => {
    render(<ErrorPage error={new Error('Boom')} reset={jest.fn()} />);
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(
      screen.getByText(/we encountered an unexpected issue/i)
    ).toBeInTheDocument();
  });

  it('calls reset when "Try again" is clicked', () => {
    const reset = jest.fn();
    render(<ErrorPage error={new Error('Boom')} reset={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('renders error digest when provided', () => {
    const error = new Error('Boom') as Error & { digest?: string };
    error.digest = 'abc123';
    render(<ErrorPage error={error} reset={jest.fn()} />);
    expect(screen.getByText(/reference:/i)).toBeInTheDocument();
    expect(screen.getByText('abc123')).toBeInTheDocument();
  });

  it('renders "Go back home" link pointing to /', () => {
    render(<ErrorPage error={new Error('Boom')} reset={jest.fn()} />);
    const link = screen.getByRole('link', { name: /go back home/i });
    expect(link).toHaveAttribute('href', '/');
  });
});

import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../src/app/page';

describe('Home page', () => {
  it('renders the heading', () => {
    render(<Home />);
    const heading = screen.getByRole('heading', { name: /mg drywall usa/i });
    expect(heading).toBeInTheDocument();
  });
});

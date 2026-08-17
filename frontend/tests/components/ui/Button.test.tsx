import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@tests/utils/axe-helper';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<Button>Label</Button>);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('renders as a <button> when no href is provided', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders as an <a> when href is provided', () => {
    render(<Button href="/about">Learn more</Button>);
    const link = screen.getByRole('link', { name: /learn more/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/about');
  });

  it('applies primary variant classes by default', () => {
    const { container } = render(<Button>Primary</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('bg-accent');
    expect(btn).toHaveClass('text-white');
  });

  it('applies outline variant classes', () => {
    const { container } = render(<Button variant="outline">Outline</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('border-brand');
    expect(btn).toHaveClass('text-brand');
    expect(btn).toHaveClass('bg-transparent');
  });

  it('applies ghost variant classes', () => {
    const { container } = render(<Button variant="ghost">Ghost</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('text-brand');
    expect(btn).toHaveClass('bg-transparent');
    expect(btn).toHaveClass('hover:bg-brand/10');
  });

  it('applies inverse variant classes', () => {
    const { container } = render(<Button variant="inverse">Inverse</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('border-white');
    expect(btn).toHaveClass('text-white');
    expect(btn).toHaveClass('bg-transparent');
  });

  it('applies md size classes by default', () => {
    const { container } = render(<Button>Medium</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('h-11');
    expect(btn).toHaveClass('px-6');
    expect(btn).toHaveClass('text-base');
  });

  it('applies lg size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const btn = container.querySelector('button');
    expect(btn).toHaveClass('h-12');
    expect(btn).toHaveClass('px-8');
    expect(btn).toHaveClass('text-lg');
  });

  it('forwards arbitrary button props', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick} aria-label="Close">
        Close
      </Button>
    );
    const btn = screen.getByRole('button', { name: /close/i });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-label', 'Close');
  });

  it('forwards arbitrary anchor props', () => {
    render(
      <Button href="/about" target="_blank" rel="noopener noreferrer">
        External
      </Button>
    );
    const link = screen.getByRole('link', { name: /external/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

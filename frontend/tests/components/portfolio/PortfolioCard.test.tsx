import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PortfolioCard from '@/components/portfolio/PortfolioCard';

const mockItem = {
  id: 1,
  slug: 'kitchen-remodel',
  title: 'Kitchen Remodel',
  description: '',
  scope: 'residential' as const,
  scope_label: 'Residential',
  finish_tags: [],
  featured_image: null,
  gallery_images: [],
};

describe('PortfolioCard', () => {
  it('renders title as a link to the detail page', () => {
    render(
      <PortfolioCard item={mockItem} onImageClick={jest.fn()} />
    );

    const link = screen.getByRole('link', { name: 'Kitchen Remodel' });
    expect(link).toHaveAttribute('href', '/portfolio/kitchen-remodel');
  });

  it('renders scope badge', () => {
    render(
      <PortfolioCard item={mockItem} onImageClick={jest.fn()} />
    );

    expect(screen.getByText('Residential')).toBeInTheDocument();
  });

  it('renders featured image when provided', () => {
    const itemWithImage = {
      ...mockItem,
      featured_image: {
        thumbnail: '/media/thumb.webp',
        card: '/media/card.webp',
        full: '/media/full.webp',
        alt: 'Kitchen photo',
      },
    };

    render(
      <PortfolioCard item={itemWithImage} onImageClick={jest.fn()} />
    );

    expect(screen.getByRole('img')).toHaveAttribute('src', '/media/card.webp');
  });

  it('calls onImageClick when featured image is clicked', () => {
    const onClick = jest.fn();
    const itemWithImage = {
      ...mockItem,
      featured_image: {
        thumbnail: '/media/thumb.webp',
        card: '/media/card.webp',
        full: '/media/full.webp',
        alt: 'Kitchen photo',
      },
    };

    render(
      <PortfolioCard item={itemWithImage} onImageClick={onClick} />
    );

    screen.getByRole('button', { name: /open lightbox/i }).click();
    expect(onClick).toHaveBeenCalledWith(0);
  });
});

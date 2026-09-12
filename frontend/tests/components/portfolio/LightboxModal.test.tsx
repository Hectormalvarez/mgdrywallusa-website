import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { ComponentProps } from 'react';
import { axeCheck } from '@tests/utils/axe-helper';
import LightboxModal from '@/components/portfolio/LightboxModal';
import type { GalleryItem } from '@/types/portfolio';

const images: GalleryItem[] = [
  {
    id: 1,
    image: {
      thumbnail: '/t1.webp',
      card: '/c1.webp',
      full: '/f1.webp',
      alt: 'First photo',
    },
    caption: 'First caption',
  },
  {
    id: 2,
    image: {
      thumbnail: '/t2.webp',
      card: '/c2.webp',
      full: '/f2.webp',
      alt: 'Second photo',
    },
    caption: 'Second caption',
  },
  {
    id: 3,
    image: {
      thumbnail: '/t3.webp',
      card: '/c3.webp',
      full: '/f3.webp',
      alt: '',
    },
    caption: '',
  },
];

function renderLightbox(
  overrides: Partial<ComponentProps<typeof LightboxModal>> = {}
) {
  const onClose = jest.fn();
  const utils = render(
    <LightboxModal
      images={images}
      initialIndex={0}
      isOpen
      onClose={onClose}
      {...overrides}
    />
  );
  return { onClose, ...utils };
}

describe('LightboxModal', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <LightboxModal
        images={images}
        initialIndex={0}
        isOpen={false}
        onClose={jest.fn()}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the initial image, caption, and step indicator', () => {
    renderLightbox();

    expect(screen.getByRole('img')).toHaveAttribute('src', '/f1.webp');
    expect(screen.getByText('First caption')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
  });

  it('advances and rewinds through images, wrapping at the ends', () => {
    const { container } = renderLightbox();

    fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/f2.webp');
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3');

    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(screen.getByRole('img')).toHaveAttribute('src', '/f1.webp');

    fireEvent.click(screen.getByRole('button', { name: 'Previous image' }));
    expect(container.querySelector('img')).toHaveAttribute('src', '/f3.webp');
    expect(screen.getByRole('status')).toHaveTextContent('3 / 3');
  });

  it('navigates with the arrow keys', () => {
    renderLightbox();

    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(screen.getByRole('status')).toHaveTextContent('2 / 3');

    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(screen.getByRole('status')).toHaveTextContent('1 / 3');
  });

  it('calls onClose when Escape is pressed', () => {
    const { onClose } = renderLightbox();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not when the image is clicked', () => {
    const { onClose } = renderLightbox();

    fireEvent.click(screen.getByRole('img'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('hides the navigation controls for a single image', () => {
    renderLightbox({ images: [images[0]] });

    expect(
      screen.queryByRole('button', { name: 'Next image' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous image' })
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('1 / 1');
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const { unmount } = renderLightbox();
    expect(document.body.style.overflow).toBe('hidden');

    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('moves focus into the dialog on open and restores it on close', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const onClose = jest.fn();
    const { rerender } = render(
      <LightboxModal
        images={images}
        initialIndex={0}
        isOpen
        onClose={onClose}
      />
    );
    expect(screen.getByRole('dialog')).toHaveFocus();

    rerender(
      <LightboxModal
        images={images}
        initialIndex={0}
        isOpen={false}
        onClose={onClose}
      />
    );
    expect(trigger).toHaveFocus();

    trigger.remove();
  });

  it('traps Tab focus inside the dialog', () => {
    renderLightbox();

    const closeButton = screen.getByRole('button', { name: 'Close lightbox' });
    const nextButton = screen.getByRole('button', { name: 'Next image' });

    nextButton.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(closeButton).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(nextButton).toHaveFocus();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderLightbox();
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  describe('project context', () => {
    const project = {
      title: 'Kitchen Remodel',
      slug: 'kitchen-remodel',
      scopeLabel: 'Residential',
      finishTags: ['smooth', 'level-5'],
    };

    it('links to the project and names its scope and finish tags', () => {
      renderLightbox({ project });

      const titleLink = screen.getByRole('link', { name: 'Kitchen Remodel' });
      expect(titleLink).toHaveAttribute('href', '/portfolio/kitchen-remodel');
      expect(screen.getByText('Residential')).toBeInTheDocument();
      expect(screen.getByText('smooth')).toBeInTheDocument();
      expect(screen.getByText('level-5')).toBeInTheDocument();
    });

    it('shows the caption and the photo description together', () => {
      renderLightbox({ project, initialIndex: 0 });

      expect(screen.getByText('First caption')).toBeInTheDocument();
      expect(screen.getByText('First photo')).toBeInTheDocument();
    });

    it('does not repeat the text when the caption and description match', () => {
      renderLightbox({
        project,
        images: [
          {
            id: 7,
            image: { ...images[0].image, alt: 'Taped seams' },
            caption: 'Taped seams',
          },
        ],
      });

      expect(screen.getAllByText('Taped seams')).toHaveLength(1);
    });

    it('does not echo a generic photo description next to the generic label', () => {
      renderLightbox({
        project,
        images: [
          { id: 9, image: { ...images[0].image, alt: 'Gallery photo' }, caption: '' },
        ],
      });

      // Only the "Gallery photo" label renders — not a second identical line.
      expect(screen.getAllByText('Gallery photo')).toHaveLength(1);
    });

    it('falls back to the caption for the alt text when the CMS has none', () => {
      renderLightbox({
        project,
        images: [
          { id: 8, image: { ...images[0].image, alt: '' }, caption: 'Taped seams' },
        ],
      });

      expect(screen.getByRole('img')).toHaveAttribute('alt', 'Taped seams');
    });

    it('identifies a photo that has no caption or description', () => {
      renderLightbox({ project, initialIndex: 2 });

      // Third fixture image has neither a caption nor alt text.
      expect(screen.getByText('Gallery photo 3 of 3')).toBeInTheDocument();
    });

    it('marks the featured image and numbers the gallery photos', () => {
      renderLightbox({
        project,
        images: [
          { ...images[0], id: -1, isFeatured: true, caption: '' },
          images[1],
          images[2],
        ],
      });

      expect(screen.getByText('Featured photo')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
      expect(screen.getByText('Gallery photo 1 of 2')).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: 'Next image' }));
      expect(screen.getByText('Gallery photo 2 of 2')).toBeInTheDocument();
    });

    it('has no accessibility violations with the project context', async () => {
      const { container } = renderLightbox({ project });
      expect(await axeCheck(container)).toHaveNoViolations();
    });
  });
});

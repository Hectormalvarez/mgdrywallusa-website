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
});

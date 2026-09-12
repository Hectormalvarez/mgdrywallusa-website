"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { GalleryItem } from "@/types/portfolio";

interface LightboxModalProps {
  images: GalleryItem[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LightboxModal({
  images,
  initialIndex,
  isOpen,
  onClose,
}: LightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Move focus into the dialog on open and restore it on close
  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    return () => {
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();

      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKey);
    // Prevent body scroll when modal is open
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, goNext, goPrev]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      diff > 0 ? goNext() : goPrev();
    }
  };

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 focus:outline-none"
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white/80 hover:text-white text-3xl leading-none"
        aria-label="Close lightbox"
      >
        &times;
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 text-white/80 hover:text-white text-4xl leading-none select-none"
          aria-label="Previous image"
        >
          &#8249;
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 text-white/80 hover:text-white text-4xl leading-none select-none"
          aria-label="Next image"
        >
          &#8250;
        </button>
      )}

      {/* Image container */}
      <div
        className="relative max-h-[80vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          unoptimized
          width={1600}
          height={1200}
          src={current.image.full}
          alt={current.image.alt || ""}
          className="max-h-[80vh] w-auto object-contain"
          priority
        />

        {/* Caption and step indicator */}
        <div className="mt-3 flex items-center justify-between text-sm text-white/70">
          {current.caption && (
            <span>{current.caption}</span>
          )}
          <span className="ml-auto">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      </div>
    </div>
  );
}

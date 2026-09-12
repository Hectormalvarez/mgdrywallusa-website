"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ImageRendition } from "@/types/portfolio";

/** A single image shown in the lightbox. */
export interface LightboxSlide {
  id: number;
  image: ImageRendition;
  caption: string;
  /** True for the project's featured image rather than a gallery photo. */
  isFeatured?: boolean;
}

/** The project a set of slides belongs to. */
export interface LightboxProject {
  title: string;
  slug: string;
  scopeLabel?: string;
  finishTags?: string[];
}

interface LightboxModalProps {
  images: LightboxSlide[];
  /**
   * Project the images belong to. Rendered under every slide so a visitor who
   * opened an arbitrary photo still learns what they are looking at.
   */
  project?: LightboxProject;
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function LightboxModal({
  images,
  project,
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

  // Human-readable label per slide, e.g. "Gallery photo 2 of 5".
  const slideLabels = useMemo(() => {
    const galleryTotal = images.filter((image) => !image.isFeatured).length;
    return images.map((image, index) => {
      if (image.isFeatured) return "Featured photo";
      // 1-based position among the gallery photos only, ignoring the featured shot.
      const position = images
        .slice(0, index + 1)
        .filter((candidate) => !candidate.isFeatured).length;
      return galleryTotal > 1
        ? `Gallery photo ${position} of ${galleryTotal}`
        : "Gallery photo";
    });
  }, [images]);

  if (!isOpen || images.length === 0) return null;

  const current = images[currentIndex];
  const caption = (current.caption ?? "").trim();
  const altText = (current.image.alt ?? "").trim();
  const slideLabel = slideLabels[currentIndex];
  // Fall back to the caption/project title so the image is never announced bare.
  const imageAlt = altText || caption || project?.title || "";
  // Only surface the CMS description when it adds something beyond the caption
  // or the generic "Gallery photo"/"Featured photo" label.
  const showAltText = altText !== "" && altText !== caption && altText !== slideLabel;

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
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-2xl leading-none text-white/90 transition-colors hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Close lightbox"
      >
        &times;
      </button>

      {/* Previous button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-3xl leading-none text-white/90 transition-colors select-none hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Previous image"
        >
          &#8249;
        </button>
      )}

      {/* Next button */}
      {images.length > 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-black/50 text-3xl leading-none text-white/90 transition-colors select-none hover:bg-black/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Next image"
        >
          &#8250;
        </button>
      )}

      {/* Image container */}
      <figure
        className="relative m-0 max-h-[80vh] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          unoptimized
          width={1600}
          height={1200}
          src={current.image.full}
          alt={imageAlt}
          className="max-h-[70vh] w-auto object-contain"
          priority
        />

        {/* Project context, image caption, and step indicator */}
        <figcaption className="mt-3 flex flex-col gap-3 rounded-lg bg-black/60 px-4 py-3 text-sm text-white/85 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/60">
              {slideLabel}
            </p>

            {project && (
              <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <Link
                  href={`/portfolio/${project.slug}`}
                  className="rounded text-base font-semibold text-white underline-offset-2 transition-colors hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  {project.title}
                </Link>
                {project.scopeLabel && (
                  <span className="rounded bg-white/15 px-2 py-0.5 text-xs font-medium">
                    {project.scopeLabel}
                  </span>
                )}
                {project.finishTags?.map((tag) => (
                  <span
                    key={tag}
                    className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/75"
                  >
                    {tag}
                  </span>
                ))}
              </p>
            )}

            {caption && <p className="mt-1.5">{caption}</p>}
            {showAltText && <p className="mt-1 text-white/60">{altText}</p>}
          </div>

          <span
            role="status"
            aria-live="polite"
            className="shrink-0 self-start rounded-full bg-black/50 px-2.5 py-0.5 text-xs"
          >
            {currentIndex + 1} / {images.length}
          </span>
        </figcaption>
      </figure>
    </div>
  );
}

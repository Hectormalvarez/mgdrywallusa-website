"use client";

import Image from "next/image";
import type { PortfolioItem } from "@/types/portfolio";

interface PortfolioCardProps {
  item: PortfolioItem;
  onImageClick: (galleryIndex: number) => void;
}

export default function PortfolioCard({
  item,
  onImageClick,
}: PortfolioCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border border-border">
      {item.featured_image && (
        <button
          type="button"
          onClick={() => onImageClick(0)}
          className="block w-full relative aspect-video cursor-pointer"
          aria-label={`Open lightbox for ${item.title}`}
        >
          <Image
            unoptimized
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            src={item.featured_image.card}
            alt={item.featured_image.alt || item.title}
            className="object-cover"
          />
        </button>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-ink">{item.title}</h3>
        {item.scope_label && (
          <span className="mt-1 inline-block rounded bg-brand-tint/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-brand">
            {item.scope_label}
          </span>
        )}
        {item.description && (
          <div
            className="mt-2 text-sm text-muted leading-relaxed prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: item.description }}
          />
        )}
        {item.finish_tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {item.finish_tags.map((tag) => (
              <span
                key={tag}
                className="rounded bg-accent-tint/50 px-2 py-0.5 text-xs text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {item.gallery_images.length > 0 && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            {item.gallery_images.map((galleryItem, index) => (
              <figure key={`${item.id}-gallery-${index}`}>
                <button
                  type="button"
                  onClick={() => onImageClick(index + 1)}
                  className="relative aspect-square overflow-hidden rounded cursor-pointer block w-full"
                  aria-label={`View gallery image ${index + 1} for ${item.title}`}
                >
                  <Image
                    unoptimized
                    fill
                    sizes="(min-width: 1024px) 17vw, (min-width: 768px) 25vw, 50vw"
                    src={galleryItem.image.card}
                    alt={galleryItem.image.alt || item.title}
                    className="object-cover"
                  />
                </button>
                {galleryItem.caption && (
                  <figcaption className="mt-1 text-center text-xs text-muted">
                    {galleryItem.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

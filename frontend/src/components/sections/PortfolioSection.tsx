'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { fetchPortfolioItems, type PortfolioItem } from '@/lib/api';
import PortfolioSkeleton from '@/components/sections/PortfolioSkeleton';

interface PortfolioSectionProps {
  apiUrl: string;
  heading?: string;
  emptyText?: string;
}

export default function PortfolioSection({
  apiUrl,
  heading = "Our Work",
  emptyText = "No projects to display yet.",
}: PortfolioSectionProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPortfolioItems(apiUrl)
      .then((data) => {
        setItems(data.items);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message ?? 'Failed to load portfolio');
        setLoading(false);
      });
  }, [apiUrl]);

  return (
    <section
      id="portfolio"
      aria-labelledby="portfolio-heading"
      className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <h2
          id="portfolio-heading"
          className="text-2xl sm:text-3xl font-bold tracking-tight text-ink"
        >
          {heading}
        </h2>

        {loading && (
          <div className="mt-8">
            <PortfolioSkeleton />
          </div>
        )}

        {error && (
          <p className="mt-8 text-muted" role="alert">
            Failed to load portfolio
          </p>
        )}

        {!loading && !error && items.length === 0 && (
          <p className="mt-8 text-muted">{emptyText}</p>
        )}

        {!loading && !error && items.length > 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                {item.featured_image_url && (
                  <div className="relative aspect-video">
                    <Image
                      unoptimized
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      src={item.featured_image_url}
                      alt={item.title}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-ink">
                    {item.title}
                  </h3>
                  {item.scope && (
                    <span className="mt-1 inline-block rounded bg-brand-tint/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-brand">
                      {item.scope}
                    </span>
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
                      {item.gallery_images.map((image, index) => (
                        <figure
                          key={`${item.id}-gallery-${index}`}
                          className="relative aspect-square overflow-hidden rounded"
                        >
                          <Image
                            unoptimized
                            fill
                            sizes="(min-width: 1024px) 17vw, (min-width: 768px) 25vw, 50vw"
                            src={image.url}
                            alt={image.alt || item.title}
                            className="object-cover"
                          />
                          {image.caption && (
                            <figcaption className="sr-only">
                              {image.caption}
                            </figcaption>
                          )}
                        </figure>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


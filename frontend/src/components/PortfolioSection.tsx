'use client';

import { useEffect, useState } from 'react';
import { fetchPortfolioItems, type PortfolioItem } from '@/lib/api';

interface PortfolioSectionProps {
  apiUrl: string;
}

export default function PortfolioSection({ apiUrl }: PortfolioSectionProps) {
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

  if (loading) {
    return <section aria-label="Portfolio"><p>Loading...</p></section>;
  }

  if (error) {
    return <section aria-label="Portfolio"><p>Failed to load portfolio</p></section>;
  }

  return (
    <section aria-label="Portfolio" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-12">
        {items.map((item) => (
          <article key={item.id} className="border rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold">{item.title}</h3>
            {item.scope && (
              <span className="inline-block mt-2 rounded bg-gray-100 px-2 py-1 text-xs font-medium uppercase tracking-wide">
                {item.scope}
              </span>
            )}
            {item.finish_tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2" aria-label="Finish tags">
                {item.finish_tags.map((tag) => (
                  <span key={tag} className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div
              className="prose mt-4 max-w-none"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
            {item.featured_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.featured_image_url}
                alt={item.title}
                className="mt-4 w-full max-w-md rounded"
              />
            )}
            {item.gallery_images.length > 0 && (
              <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {item.gallery_images.map((image, index) => (
                  <figure key={`${item.id}-gallery-${index}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image.url}
                      alt={image.alt || item.title}
                      width={image.width}
                      height={image.height}
                      className="rounded"
                    />
                    {image.caption && (
                      <figcaption className="mt-1 text-center text-sm text-gray-600">
                        {image.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

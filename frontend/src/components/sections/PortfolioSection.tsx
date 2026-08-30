'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPortfolioItems, type PortfolioItem } from '@/lib/api';
import type { PortfolioScope } from '@/types/portfolio';
import PortfolioSkeleton from '@/components/sections/PortfolioSkeleton';
import ScopeFilterTabs from '@/components/ui/ScopeFilterTabs';
import LightboxModal from '@/components/portfolio/LightboxModal';
import PortfolioGrid from '@/components/portfolio/PortfolioGrid';

interface PortfolioSectionProps {
  apiUrl: string;
  heading?: string;
  emptyText?: string;
  showViewAll?: boolean;
}

export default function PortfolioSection({
  apiUrl,
  heading = "Our Work",
  emptyText = "No projects to display yet.",
  showViewAll = false,
}: PortfolioSectionProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeScope, setActiveScope] = useState<PortfolioScope | 'all'>('all');

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<PortfolioItem['gallery_images']>([]);

  const openLightbox = useCallback((item: PortfolioItem, startIndex: number) => {
    // Build gallery: featured image + gallery items
    const allImages = [
      ...(item.featured_image
        ? [{ id: -1, image: item.featured_image, caption: "" }]
        : []),
      ...item.gallery_images,
    ];
    setLightboxImages(allImages);
    setLightboxIndex(startIndex);
    setLightboxOpen(true);
  }, []);

  const filteredItems = useMemo(() => {
    if (activeScope === 'all') return items;
    return items.filter((item) => item.scope === activeScope);
  }, [items, activeScope]);

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

        {!loading && !error && items.length > 0 && (
          <ScopeFilterTabs activeScope={activeScope} onScopeChange={setActiveScope} />
        )}

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
          <>
            <PortfolioGrid items={filteredItems} onImageClick={openLightbox} />
            {filteredItems.length === 0 && items.length > 0 && (
              <p className="mt-6 text-center text-muted">
                No projects match this filter.
              </p>
            )}
            {showViewAll && (
              <div className="mt-8 text-center">
                <a
                  href="/portfolio"
                  className="inline-flex items-center text-sm font-semibold text-brand hover:text-brand-strong transition-colors"
                >
                  View All Projects
                  <span className="ml-1" aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </>
        )}

        <LightboxModal
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
        />
      </div>
    </section>
  );
}


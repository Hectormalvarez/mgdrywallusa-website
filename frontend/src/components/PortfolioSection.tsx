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
    <section aria-label="Portfolio">
      {items.map((item) => (
        <article key={item.id}>
          {item.image_url && (
            <img src={item.image_url} alt={item.title} />
          )}
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </article>
      ))}
    </section>
  );
}

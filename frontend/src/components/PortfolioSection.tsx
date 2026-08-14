'use client';

import { useEffect, useState } from 'react';

export interface WagtailPageMeta {
  type: string;
  detail_url: string;
}

export interface PortfolioItem {
  id: number;
  meta: WagtailPageMeta;
  title: string;
  description: string;
  image_url: string;
}

export interface PortfolioApiResponse {
  meta: { total_count: number };
  items: PortfolioItem[];
}

interface PortfolioSectionProps {
  apiUrl: string;
}

export default function PortfolioSection({ apiUrl }: PortfolioSectionProps) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load portfolio: ${res.status}`);
        }
        return res.json();
      })
      .then((data: PortfolioApiResponse) => {
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

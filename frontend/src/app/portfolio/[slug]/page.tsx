import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPortfolioItems, INTERNAL_FETCH_HEADERS } from "@/lib/api";
import type { PortfolioItem } from "@/lib/api";

export const dynamic = "force-dynamic";

const WAGTAIL_API_BASE =
  process.env.WAGTAIL_API_BASE_URL ?? "http://backend:8000/api/v1";

const PORTFOLIO_API_URL = `${WAGTAIL_API_BASE}/pages/?type=portfolio.PortfolioItem&fields=*`;

async function getItem(slug: string): Promise<PortfolioItem | null> {
  try {
    const url = `${PORTFOLIO_API_URL}&slug=${encodeURIComponent(slug)}`;
    const data = await fetchPortfolioItems(url, undefined, { headers: INTERNAL_FETCH_HEADERS });
    return data.items?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = await getItem(slug);
  if (!item) return { title: "Project Not Found" };

  const plainDesc = item.description.replace(/<[^>]+>/g, "").slice(0, 160);
  return {
    title: item.title,
    description: plainDesc,
    openGraph: {
      title: item.title,
      description: plainDesc,
      images: item.featured_image
        ? [{ url: item.featured_image.full, alt: item.featured_image.alt }]
        : [],
    },
  };
}

export default async function PortfolioDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getItem(slug);

  if (!item) {
    return (
      <main id="main-content" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Project Not Found
          </h1>
          <p className="mt-4 text-muted">
            The project you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link
            href="/portfolio"
            className="mt-6 inline-flex items-center text-sm font-semibold text-brand hover:text-brand-strong transition-colors"
          >
            ← Back to Portfolio
          </Link>
        </div>
      </main>
    );
  }

  // Build full gallery: featured image first, then gallery items
  const allImages = [
    ...(item.featured_image
      ? [{ id: -1, image: item.featured_image, caption: "" }]
      : []),
    ...item.gallery_images,
  ];

  return (
    <main id="main-content" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/portfolio"
          className="inline-flex items-center text-sm font-semibold text-brand hover:text-brand-strong transition-colors mb-8"
        >
          ← Back to Portfolio
        </Link>

        <article>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            {item.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            {item.scope_label && (
              <span className="inline-block rounded bg-brand-tint/20 px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand">
                {item.scope_label}
              </span>
            )}
          </div>

          {item.description && (
            <div
              className="mt-6 text-muted leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: item.description }}
            />
          )}

          {item.finish_tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
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

          {allImages.length > 0 && (
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {allImages.map((img, index) => (
                <figure key={img.id} className="overflow-hidden rounded-lg">
                  <div className="relative aspect-video">
                    <Image
                      unoptimized
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      src={img.image.card}
                      alt={img.image.alt || item.title}
                      className="object-cover"
                      priority={index < 2}
                    />
                  </div>
                  {img.caption && (
                    <figcaption className="mt-2 text-sm text-muted">
                      {img.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </article>
      </div>
    </main>
  );
}

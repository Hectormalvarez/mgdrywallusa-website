/**
 * Portfolio types matching the Wagtail backend API schema.
 */

export type PortfolioScope = "residential" | "commercial" | "adu_renovation";

/** Pre-generated image rendition set returned by the backend serializer. */
export interface ImageRendition {
  thumbnail: string;
  card: string;
  full: string;
  alt: string;
}

/** A single gallery image item. */
export interface GalleryItem {
  id: number;
  image: ImageRendition;
  caption: string;
}

/** A portfolio project returned by the Wagtail API. */
export interface PortfolioItem {
  id: number;
  title: string;
  slug: string;
  scope: PortfolioScope;
  scope_label: string;
  description: string;
  finish_tags: string[];
  featured_image: ImageRendition | null;
  gallery_images: GalleryItem[];
}

/** Wagtail pages API response wrapper. */
export interface PortfolioApiResponse {
  meta: { total_count: number };
  items: PortfolioItem[];
}

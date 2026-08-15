/**
 * Typed API client for the Wagtail backend.
 */

export interface WagtailPageMeta {
  type: string;
  detail_url: string;
}

export interface GalleryImage {
  url: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
}

export interface PortfolioItem {
  id: number;
  meta: WagtailPageMeta;
  title: string;
  description: string;
  scope: string;
  finish_tags: string[];
  featured_image_url: string | null;
  gallery_images: GalleryImage[];
}

export interface PortfolioApiResponse {
  meta: { total_count: number };
  items: PortfolioItem[];
}

/**
 * Fetch portfolio items from the Wagtail API.
 */
export async function fetchPortfolioItems(
  apiUrl: string
): Promise<PortfolioApiResponse> {
  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error(`Failed to load portfolio: ${response.status}`);
  }
  return response.json();
}

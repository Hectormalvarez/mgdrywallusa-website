/**
 * Resolve the public site URL at runtime.
 *
 * Priority:
 *   1. `NEXT_PUBLIC_SITE_URL` (inlined at build time for client components)
 *   2. `SITE_URL` (read at runtime in server components / standalone mode)
 *   3. `http://localhost:3000` (safe default for local development)
 *
 * Used by layout metadata, robots, sitemap, and any module that needs the
 * canonical public origin.
 */
export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}

/**
 * Navigation href resolution for the single-page landing layout.
 *
 * The CMS seeds nav links as same-page hash anchors (e.g. "#services") that
 * only resolve on the home page. On any sub-route (e.g. "/portfolio") those
 * anchors would drop onto the wrong URL and never return the visitor home.
 *
 * resolveNavHref rewrites hash anchors into home-rooted targets ("/#services")
 * when the current pathname is not the home page. Everything else — absolute
 * URLs, mailto/tel schemes, and regular paths — passes through untouched.
 */
export function resolveNavHref(href: string, pathname: string | null): string {
  return href.startsWith("#") && pathname && pathname !== "/"
    ? `/${href}`
    : href;
}

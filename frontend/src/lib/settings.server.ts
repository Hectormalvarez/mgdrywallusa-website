/**
 * Server-only wrapper around `fetchSiteSettings` (US-007).
 *
 * Lives apart from `@/lib/api` because it depends on `next/headers`, which is
 * forbidden in client components (`LeadIntakeForm` imports `@/lib/api`).
 * Reads Draft Mode and the page-preview token cookie — site chrome previews
 * ride the same page-preview mechanism as page content — then delegates to
 * the draft-aware fetcher.
 */
import { cache } from "react";
import { cookies, draftMode } from "next/headers";

import { fetchSiteSettings } from "@/lib/api";

export const getSiteSettings = cache(async () => {
  const isDraft = (await draftMode()).isEnabled;
  const token = isDraft
    ? ((await cookies()).get("preview_token")?.value ?? undefined)
    : undefined;
  return fetchSiteSettings(isDraft, token);
});
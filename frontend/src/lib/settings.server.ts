/**
 * Server-only wrapper around `fetchSiteSettings` (US-006).
 *
 * Lives apart from `@/lib/api` because it depends on `next/headers`, which is
 * forbidden in client components (`LeadIntakeForm` imports `@/lib/api`).
 * Reads Draft Mode and the settings preview cookie, then delegates to the
 * draft-aware fetcher.
 */
import { cache } from "react";
import { cookies, draftMode } from "next/headers";

import { fetchSiteSettings } from "@/lib/api";

export const getSiteSettings = cache(async () => {
  const isDraft = (await draftMode()).isEnabled;
  const token = isDraft
    ? ((await cookies()).get("settings_preview_token")?.value ?? undefined)
    : undefined;
  return fetchSiteSettings(isDraft, token);
});
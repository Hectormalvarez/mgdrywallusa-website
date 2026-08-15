import { Button } from "@/components/ui/Button";
import type { SiteSettingsData } from "@/types/settings";

const currentYear = new Date().getFullYear();

interface FooterProps {
  settings: SiteSettingsData;
}

export default function Footer({ settings }: FooterProps) {
  const hasSocialLinks =
    settings.google_review_url ||
    settings.yelp_url ||
    settings.facebook_url ||
    settings.instagram_url;

  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand column */}
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              {settings.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt={settings.site_name}
                  className="h-8 w-auto"
                />
              ) : (
                settings.site_name
              )}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80 max-w-xs">
              {settings.tagline}
            </p>
            {settings.license_number && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90 bg-white/10 rounded-full px-3 py-1">
                <svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Licensed &amp; Insured – {settings.license_number}
              </p>
            )}
          </div>

          {/* Quick links column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Quick Links
            </h3>
            <ul className="mt-4 flex flex-col gap-1">
              {settings.nav.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="inline-flex items-center h-11 text-sm text-white/90 transition-colors hover:text-white hover:underline underline-offset-4"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact column */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/60">
              Contact Us
            </h3>
            <address className="mt-4 not-italic flex flex-col gap-1 text-sm">
              <a
                href={`tel:${settings.phone_number}`}
                className="inline-flex items-center h-11 text-white/90 transition-colors hover:text-white hover:underline underline-offset-4"
              >
                {settings.phone_number}
              </a>
              <a
                href={`mailto:${settings.contact_email}`}
                className="inline-flex items-center h-11 text-white/90 transition-colors hover:text-white hover:underline underline-offset-4"
              >
                {settings.contact_email}
              </a>
            </address>

            {hasSocialLinks && (
              <div className="mt-4 flex items-center gap-3">
                {settings.google_review_url && (
                  <a
                    href={settings.google_review_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Leave a Google Review"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </a>
                )}
                {settings.facebook_url && (
                  <a
                    href={settings.facebook_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow on Facebook"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                )}
                {settings.instagram_url && (
                  <a
                    href={settings.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Follow on Instagram"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                )}
                {settings.yelp_url && (
                  <a
                    href={settings.yelp_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View on Yelp"
                    className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308c.312-.464.95-.43 1.22.058.54.976.24 2.05-.954 2.447zM11.28 3.126c.654-1.164-.055-2.574-1.37-2.87l-4.256-.97C4.468-.938 3.052.19 3.212 1.53l.82 6.87c.09.758.972 1.19 1.634.74l3.076-2.092c.582-.026 1.096.392 1.19 1.022l.17 1.152a1.28 1.28 0 001.114 1.11l4.18.618c1.22.18 2.22-1.06 1.72-2.22l-1.86-4.4c-.344-.82-1.188-1.28-2.06-1.026z" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            <div className="mt-6">
              <Button href="#lead-form" variant="inverse" size="md">
                Get a Free Quote
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 border-t border-white/20 pt-6">
          <p className="text-xs text-white/60">
            &copy; {currentYear} {settings.site_name}. All rights reserved.
            {settings.license_number && (
              <> License #{settings.license_number}.</>
            )}
          </p>
        </div>
      </div>
    </footer>
  );
}

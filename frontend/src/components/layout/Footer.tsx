import { Button } from "@/components/ui/Button";
import type { SiteSettingsData } from "@/types/settings";

const currentYear = new Date().getFullYear();

interface FooterProps {
  settings: SiteSettingsData;
}

export default function Footer({ settings }: FooterProps) {
  return (
    <footer className="bg-brand text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand column */}
          <div>
            <h2 className="text-lg font-extrabold tracking-tight">
              {settings.site_name}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/80 max-w-xs">
              {settings.tagline}
            </p>
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
          </p>
        </div>
      </div>
    </footer>
  );
}

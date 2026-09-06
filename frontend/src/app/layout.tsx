import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getSiteUrl } from "@/lib/site-url";
import { fetchSiteSettings } from "@/lib/api";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = getSiteUrl();

export async function generateMetadata(): Promise<Metadata> {
  const settings = await fetchSiteSettings();
  return {
    metadataBase: new URL(siteUrl),
    title: {
      template: `%s | ${settings.site_name}`,
      default: settings.site_name,
    },
    description: settings.tagline,
    alternates: { canonical: siteUrl },
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: settings.site_name,
      title: settings.site_name,
      description: settings.tagline,
      images: [
        {
          url: "/images/hero-drywall.png",
          width: 1200,
          height: 630,
          alt: `${settings.site_name} – Professional Drywall Services`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: settings.site_name,
      description: settings.tagline,
      images: ["/images/hero-drywall.png"],
    },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const settings = await fetchSiteSettings();
  return { themeColor: settings.primary_color };
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await fetchSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["DrywallContractor", "HomeAndConstructionBusiness"],
    name: settings.site_name,
    telephone: settings.phone_number,
    email: settings.contact_email,
    address: {
      "@type": "PostalAddress",
      addressLocality: settings.seo.address_locality,
      addressRegion: settings.seo.address_region,
      postalCode: settings.seo.postal_code,
      addressCountry: settings.seo.country,
    },
    priceRange: settings.seo.price_range,
    areaServed: {
      "@type": "State",
      name: settings.seo.address_region,
    },
    url: siteUrl,
  };

  // Owner-configured CSS variables injected via <style> so the frontend
  // reflects the Wagtail-picked palette without touching Tailwind config.
  // Fallbacks are hardcoded in globals.css; these override at runtime.
  const brandStyles = `
    :root {
      --color-brand: ${settings.primary_color};
      --color-brand-strong: color-mix(in srgb, ${settings.primary_color} 87%, black);
      --color-brand-tint: color-mix(in srgb, ${settings.primary_color} 20%, white);
      --color-accent: ${settings.accent_color};
      --color-accent-strong: color-mix(in srgb, ${settings.accent_color} 80%, black);
      --color-accent-tint: color-mix(in srgb, ${settings.accent_color} 12%, white);
    }
  `;

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {settings.favicon_url ? (
          <link rel="icon" href={settings.favicon_url} />
        ) : (
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        )}
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body>
        {settings.banner_enabled && settings.banner_text && (
          <div
            className="bg-accent text-white text-center text-sm font-semibold py-2 px-4"
            role="banner"
          >
            <a
              href={settings.banner_link || "#lead-form"}
              className="hover:underline underline-offset-2"
            >
              {settings.banner_text}
            </a>
          </div>
        )}
        <Header settings={settings} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}

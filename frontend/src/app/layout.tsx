import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { fetchSiteSettings } from "@/lib/api";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = "https://mgdrywallusa.taylormadetech.net";

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

  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header settings={settings} />
        {children}
        <Footer settings={settings} />
      </body>
    </html>
  );
}

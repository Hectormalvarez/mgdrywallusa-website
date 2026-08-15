import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const siteUrl = "https://mgdrywall.taylormadetech.net";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["DrywallContractor", "HomeAndConstructionBusiness"],
  name: "MG Drywall USA",
  telephone: "+1-XXX-XXX-XXXX",
  email: "info@mgdrywallusa.com",
  address: {
    "@type": "PostalAddress",
    addressLocality: "Your City",
    addressRegion: "Your State",
    postalCode: "00000",
    addressCountry: "US",
  },
  priceRange: "$$",
  areaServed: {
    "@type": "State",
    name: "Your State",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "08:00",
      closes: "17:00",
    },
  ],
  url: siteUrl,
  sameAs: [],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: "%s | MG Drywall USA",
    default: "MG Drywall USA",
  },
  description:
    "Professional Level 5 drywall installation, finishing, and repair for residential and commercial projects. Expert craftsmanship you can trust.",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "MG Drywall USA",
    title: "MG Drywall USA",
    description:
      "Professional Level 5 drywall installation, finishing, and repair for residential and commercial projects.",
    images: [
      {
        url: "/images/hero-drywall.png",
        width: 1200,
        height: 630,
        alt: "MG Drywall USA – Professional Drywall Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MG Drywall USA",
    description:
      "Professional Level 5 drywall installation, finishing, and repair for residential and commercial projects.",
    images: ["/images/hero-drywall.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { HomePageData } from "@/types/home";

/**
 * Props accepted by <HeroSection />.
 * All fields are optional — when omitted the component renders the original
 * static fallback content so the page works identically before CMS data is
 * populated.
 */
export type HeroSectionProps = Partial<
  Pick<
    HomePageData,
    | "hero_kicker"
    | "hero_heading"
    | "hero_subheading"
    | "hero_image"
    | "cta_primary_label"
    | "cta_primary_url"
    | "cta_secondary_label"
    | "cta_secondary_url"
  >
>;

const FALLBACK: Required<
  Pick<
    HomePageData,
    | "hero_kicker"
    | "hero_heading"
    | "hero_subheading"
    | "cta_primary_label"
    | "cta_primary_url"
    | "cta_secondary_label"
    | "cta_secondary_url"
  >
> = {
  hero_kicker: "Trusted drywall professionals",
  hero_heading: "MG Drywall USA",
  hero_subheading:
    "Professional drywall installation, repair, and finishing for residential and commercial projects.",
  cta_primary_label: "Get a Free Quote",
  cta_primary_url: "#lead-form",
  cta_secondary_label: "View Our Work",
  cta_secondary_url: "#portfolio",
};

export default function HeroSection(props: HeroSectionProps) {
  const kicker = props.hero_kicker || FALLBACK.hero_kicker;
  const heading = props.hero_heading || FALLBACK.hero_heading;
  const subheading = props.hero_subheading || FALLBACK.hero_subheading;
  const primaryLabel = props.cta_primary_label || FALLBACK.cta_primary_label;
  const primaryUrl = props.cta_primary_url || FALLBACK.cta_primary_url;
  const secondaryLabel = props.cta_secondary_label || FALLBACK.cta_secondary_label;
  const secondaryUrl = props.cta_secondary_url || FALLBACK.cta_secondary_url;

  const heroImageSrc = props.hero_image?.url ?? "/images/hero-drywall.png";

  return (
    <section aria-labelledby="hero-heading" className="relative isolate min-h-[480px] lg:min-h-[600px]">
      {/* Background image */}
      <Image
        src={heroImageSrc}
        alt=""
        fill
        priority
        fetchPriority="high"
        quality={80}
        sizes="100vw"
        aria-hidden="true"
        className="object-cover"
      />

      {/* High-contrast overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-slate-950/70"
      />

      {/* Content */}
      <div className="relative mx-auto max-w-7xl flex flex-col items-start justify-center min-h-[480px] lg:min-h-[600px] px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <p className="text-sm font-semibold tracking-wide text-brand-tint uppercase">
          {kicker}
        </p>

        <h1
          id="hero-heading"
          className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance"
        >
          {heading}
        </h1>

        <p
          className="mt-5 text-lg sm:text-xl leading-relaxed text-white/85 max-w-prose"
          dangerouslySetInnerHTML={{ __html: subheading }}
        />

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href={primaryUrl} variant="primary" size="lg">
            {primaryLabel}
          </Button>
          <Button href={secondaryUrl} variant="inverse" size="lg">
            {secondaryLabel}
          </Button>
        </div>
      </div>
    </section>
  );
}

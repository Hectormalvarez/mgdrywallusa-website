import Image from "next/image";
import { Button } from "@/components/ui/Button";

export default function HeroSection() {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate min-h-[480px] lg:min-h-[600px]">
      {/* Background image */}
      <Image
        src="/images/hero-drywall.png"
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
          Trusted drywall professionals
        </p>

        <h1
          id="hero-heading"
          className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white text-balance"
        >
          MG Drywall USA
        </h1>

        <p className="mt-5 text-lg sm:text-xl leading-relaxed text-white/85 max-w-prose">
          Professional drywall installation, repair, and finishing for residential and
          commercial projects.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button href="#lead-form" variant="primary" size="lg">
            Get a Free Quote
          </Button>
          <Button href="#portfolio" variant="inverse" size="lg">
            View Our Work
          </Button>
        </div>
      </div>
    </section>
  );
}

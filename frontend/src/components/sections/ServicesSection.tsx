import type { ServiceItem } from "@/types/home";

interface ServicesSectionProps {
  heading?: string;
  subheading?: string;
  services?: ServiceItem[];
}

const DEFAULT_SERVICES: ServiceItem[] = [
  {
    title: "Level 5 Finishing",
    description:
      "Flawless, glass-smooth surfaces for high-end residential interiors and architectural accent walls.",
    icon_name: "paint",
  },
  {
    title: "Drywall Repair & Patching",
    description:
      "Seamless water damage repairs, stress crack fixes, and texture-matching for ceilings and walls.",
    icon_name: "patch",
  },
  {
    title: "ADU & Renovation Framing",
    description:
      "Full-service drywall hanging and finishing for garage conversions, room additions, and basements.",
    icon_name: "wall",
  },
];

export default function ServicesSection({
  heading = "Our Services",
  subheading = "Specialized drywall installation, repair, and finishing solutions tailored to residential and commercial needs.",
  services,
}: ServicesSectionProps) {
  const items = services && services.length > 0 ? services : DEFAULT_SERVICES;

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="bg-surface py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-border"
    >
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <h2
            id="services-heading"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-ink"
          >
            {heading}
          </h2>
          {subheading && (
            <p className="mt-3 text-base sm:text-lg text-muted">
              {subheading}
            </p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((service, index) => (
            <div
              key={`${service.title}-${index}`}
              className="flex flex-col rounded-lg border border-border bg-surface p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-md bg-brand/10 text-brand font-bold">
                {index + 1}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-ink">
                {service.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

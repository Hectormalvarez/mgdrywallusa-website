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

function ServiceIcon({ name }: { name: string }) {
  switch (name.toLowerCase()) {
    case "paint":
      return (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.14 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
      );
    case "patch":
      return (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233l5.2-6.308a2.548 2.548 0 00-3.586-3.586l-6.308 5.2m4.694 4.694l-4.694-4.694" />
        </svg>
      );
    case "wall":
      return (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m16.5-18v18M6.75 6.75h10.5M6.75 12h10.5m-10.5 5.25h10.5" />
        </svg>
      );
    case "shield":
    default:
      return (
        <svg aria-hidden="true" className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
      );
  }
}

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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
                <ServiceIcon name={service.icon_name} />
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

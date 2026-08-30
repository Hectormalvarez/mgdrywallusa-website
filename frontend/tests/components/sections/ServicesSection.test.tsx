import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axeCheck } from '@tests/utils/axe-helper';
import ServicesSection from '@/components/sections/ServicesSection';
import type { ServiceItem } from '@/types/home';

describe('ServicesSection', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<ServicesSection />);
    expect(await axeCheck(container)).toHaveNoViolations();
  });

  it('renders the default heading and subheading when no props provided', () => {
    render(<ServicesSection />);
    expect(screen.getByRole('heading', { name: /our services/i })).toBeInTheDocument();
    expect(
      screen.getByText(/specialized drywall installation/i)
    ).toBeInTheDocument();
  });

  it('renders custom heading and subheading from CMS', () => {
    render(
      <ServicesSection
        heading="What We Do"
        subheading="Custom subheading text."
      />
    );
    expect(screen.getByRole('heading', { name: /what we do/i })).toBeInTheDocument();
    expect(screen.getByText('Custom subheading text.')).toBeInTheDocument();
  });

  it('renders default services when no services prop provided', () => {
    render(<ServicesSection />);
    expect(screen.getByText('Level 5 Finishing')).toBeInTheDocument();
    expect(screen.getByText('Drywall Repair & Patching')).toBeInTheDocument();
    expect(screen.getByText('ADU & Renovation Framing')).toBeInTheDocument();
  });

  it('renders CMS-provided services instead of defaults', () => {
    const cmsServices: ServiceItem[] = [
      {
        name: 'Custom Service',
        slug: 'custom-service',
        short_description: 'A bespoke service.',
        icon: 'wall',
      },
    ];
    render(<ServicesSection services={cmsServices} />);
    expect(screen.getByText('Custom Service')).toBeInTheDocument();
    expect(screen.getByText('A bespoke service.')).toBeInTheDocument();
    expect(screen.queryByText('Level 5 Finishing')).not.toBeInTheDocument();
  });

  it('renders an SVG icon for each known icon', () => {
    const services: ServiceItem[] = [
      { name: 'Paint', slug: 'paint', short_description: 'desc', icon: 'paint' },
      { name: 'Patch', slug: 'patch', short_description: 'desc', icon: 'patch' },
      { name: 'Wall', slug: 'wall', short_description: 'desc', icon: 'wall' },
      { name: 'Shield', slug: 'shield', short_description: 'desc', icon: 'shield' },
      { name: 'Unknown', slug: 'unknown', short_description: 'desc', icon: 'unknown' },
    ];
    const { container } = render(<ServicesSection services={services} />);
    const svgs = container.querySelectorAll('svg');
    expect(svgs).toHaveLength(5);
    svgs.forEach((svg) => {
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('does not render the subheading when it is empty', () => {
    render(<ServicesSection subheading="" />);
    expect(screen.getByRole('heading', { name: /our services/i })).toBeInTheDocument();
    expect(screen.queryByText(/specialized drywall/i)).not.toBeInTheDocument();
  });
});

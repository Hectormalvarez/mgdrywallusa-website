'use client';

export default function HeroSection() {
  return (
    <section aria-label="Hero" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>
        MG Drywall USA
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#555', marginBottom: '1.5rem' }}>
        Professional drywall installation, repair, and finishing for residential and commercial
        projects.
      </p>
      <a
        href="#lead-form"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#1a73e8',
          color: '#fff',
          borderRadius: '4px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        Get a Free Quote
      </a>
    </section>
  );
}

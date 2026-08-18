import { http, HttpResponse } from 'msw';
import type { PortfolioApiResponse } from '@/lib/api';

const defaultPortfolioResponse: PortfolioApiResponse = {
  meta: { total_count: 2 },
  items: [
    {
      id: 1,
      meta: {
        type: 'portfolio.PortfolioItem',
        detail_url: 'http://localhost:8000/api/v1/pages/1/',
      },
      title: 'Kitchen Remodel',
      description: '<p>Complete kitchen drywall installation with <strong>Level 5 finish</strong>.</p>',
      scope: 'residential',
      finish_tags: ['smooth', 'level-5'],
      featured_image_url: 'http://localhost:8000/media/fill-800x600/test1.png',
      gallery_images: [
        {
          url: 'http://localhost:8000/media/fill-800x600/test1.png',
          width: 800,
          height: 600,
          alt: '',
          caption: 'Smooth ceiling finish',
        },
      ],
    },
    {
      id: 2,
      meta: {
        type: 'portfolio.PortfolioItem',
        detail_url: 'http://localhost:8000/api/v1/pages/2/',
      },
      title: 'Office Build-Out',
      description: '<p>Commercial office partition walls</p>',
      scope: 'commercial',
      finish_tags: ['level-5'],
      featured_image_url: 'http://localhost:8000/media/fill-800x600/test2.png',
      gallery_images: [
        {
          url: 'http://localhost:8000/media/fill-800x600/test2.png',
          width: 800,
          height: 600,
          alt: '',
          caption: 'Partition wall taping',
        },
      ],
    },
  ],
};

export const handlers = [
  http.get('*/api/v1/settings/', () => {
    return HttpResponse.json({
      site_name: 'MG Drywall USA',
      tagline:
        'Professional drywall installation, repair, and finishing for residential and commercial projects across the nation.',
      phone_number: '+1-555-DRYWALL',
      contact_email: 'info@mgdrywallusa.com',
      license_number: '',
      logo_url: null,
      favicon_url: null,
      primary_color: '#0A3161',
      accent_color: '#B31942',
      banner_enabled: false,
      banner_text: '',
      banner_link: '#lead-form',
      google_review_url: '',
      yelp_url: '',
      facebook_url: '',
      instagram_url: '',
      seo: {
        address_locality: 'Austin',
        address_region: 'TX',
        postal_code: '78701',
        country: 'US',
        price_range: '$$',
      },
      nav: [
        { label: 'Services', href: '#services' },
        { label: 'Our Work', href: '#portfolio' },
        { label: 'Contact', href: '#lead-form' },
      ],
    });
  }),
  http.get('*/api/v1/pages/', () => {
    return HttpResponse.json(defaultPortfolioResponse);
  }),
  http.post('*/api/v1/leads/', async ({ request }) => {
    let payload: Record<string, unknown> = { id: 1, status: 'created' };
    try {
      const formData = await request.formData();
      payload = {
        ...payload,
        name: formData.get('name'),
        phone: formData.get('phone'),
        email: formData.get('email'),
        project_tier: formData.get('project_tier'),
        details: formData.get('details'),
      };
    } catch {
      // undici in jsdom may fail to parse multipart; fall through with minimal payload
    }
    return HttpResponse.json(payload, { status: 201 });
  }),
];

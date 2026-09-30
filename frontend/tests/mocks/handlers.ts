import { http, HttpResponse } from 'msw';
import type { PortfolioApiResponse } from '@/lib/api';
import { SITE_SETTINGS_FALLBACK } from '@/lib/defaults';

const defaultPortfolioResponse: PortfolioApiResponse = {
  meta: { total_count: 2 },
  items: [
    {
      id: 1,
      slug: 'kitchen-remodel',
      title: 'Kitchen Remodel',
      description: '<p>Complete kitchen drywall installation with <strong>Level 5 finish</strong>.</p>',
      scope: 'residential',
      scope_label: 'Residential',
      finish_tags: ['smooth', 'level-5'],
      featured_image: {
        thumbnail: 'http://localhost:8000/media/fill-150x150/test1.png',
        card: 'http://localhost:8000/media/fill-800x600/test1.png',
        full: 'http://localhost:8000/media/max-1600x1200/test1.png',
        alt: 'Kitchen Remodel',
      },
      gallery_images: [
        {
          id: 1,
          image: {
            thumbnail: 'http://localhost:8000/media/fill-150x150/test1.png',
            card: 'http://localhost:8000/media/fill-800x600/test1.png',
            full: 'http://localhost:8000/media/max-1600x1200/test1.png',
            alt: 'Kitchen Remodel',
          },
          caption: 'Smooth ceiling finish',
        },
      ],
    },
    {
      id: 2,
      slug: 'office-build-out',
      title: 'Office Build-Out',
      description: '<p>Commercial office partition walls</p>',
      scope: 'commercial',
      scope_label: 'Commercial',
      finish_tags: ['level-5'],
      featured_image: {
        thumbnail: 'http://localhost:8000/media/fill-150x150/test2.png',
        card: 'http://localhost:8000/media/fill-800x600/test2.png',
        full: 'http://localhost:8000/media/max-1600x1200/test2.png',
        alt: 'Office Build-Out',
      },
      gallery_images: [
        {
          id: 2,
          image: {
            thumbnail: 'http://localhost:8000/media/fill-150x150/test2.png',
            card: 'http://localhost:8000/media/fill-800x600/test2.png',
            full: 'http://localhost:8000/media/max-1600x1200/test2.png',
            alt: 'Office Build-Out',
          },
          caption: 'Partition wall taping',
        },
      ],
    },
  ],
};

export const handlers = [
  http.get('*/api/v1/pages/', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('type') === 'home.HomePage') {
      return HttpResponse.json({
        items: [
          {
            ...SITE_SETTINGS_FALLBACK,
            // navigation_items is the Wagtail response key (normalized to
            // `nav` by the client); mocks mirror the raw API shape.
            navigation_items: SITE_SETTINGS_FALLBACK.nav,
          },
        ],
      });
    }
    return HttpResponse.json(defaultPortfolioResponse);
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

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
      description: 'Complete kitchen drywall installation',
      image_url: 'http://localhost:8000/media/fill-800x600/test1.png',
    },
    {
      id: 2,
      meta: {
        type: 'portfolio.PortfolioItem',
        detail_url: 'http://localhost:8000/api/v1/pages/2/',
      },
      title: 'Office Build-Out',
      description: 'Commercial office partition walls',
      image_url: 'http://localhost:8000/media/fill-800x600/test2.png',
    },
  ],
};

export const handlers = [
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

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
];

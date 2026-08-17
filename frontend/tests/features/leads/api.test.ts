import { fetchSiteSettings, fetchHomePage, submitLead, fetchPortfolioItems } from '@/lib/api';
import { http, HttpResponse } from 'msw';
import { server } from '@tests/mocks/server';

describe('fetchSiteSettings', () => {
  it('returns fallback settings when the API errors', async () => {
    server.use(
      http.get('*/api/v1/settings/', () => {
        return HttpResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 },
        );
      }),
    );

    const settings = await fetchSiteSettings();

    // Should return hard-coded fallback settings
    expect(settings.site_name).toBe('MG Drywall USA');
    expect(settings.primary_color).toBe('#0A3161');
    expect(settings.accent_color).toBe('#B31942');
  });
});

describe('fetchHomePage', () => {
  it('returns draft data when draft=true and token is provided', async () => {
    const mockDraftData = {
      id: 1,
      title: 'Draft Home Page',
      hero_heading: 'Draft Heading',
    };

    server.use(
      http.get('*/api/v1/preview/:token/', ({ params }) => {
        if (params.token === 'test-token') {
          return HttpResponse.json(mockDraftData);
        }
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      }),
    );

    const data = await fetchHomePage(true, 'test-token');
    expect(data).toEqual(mockDraftData);
  });

  it('returns published data when draft=false', async () => {
    const mockPublishedData = {
      meta: { total_count: 1 },
      items: [
        {
          id: 1,
          title: 'Published Home Page',
          hero_heading: 'Published Heading',
        },
      ],
    };

    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.json(mockPublishedData);
      }),
    );

    const data = await fetchHomePage(false);
    expect(data).toEqual(mockPublishedData.items[0]);
  });

  it('returns null when preview returns 404', async () => {
    server.use(
      http.get('*/api/v1/preview/:token/', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      }),
    );

    const data = await fetchHomePage(true, 'invalid-token');
    expect(data).toBeNull();
  });

  it('returns null when published pages API returns 404', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      }),
    );

    const data = await fetchHomePage(false);
    expect(data).toBeNull();
  });

  it('returns null on network failure', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.error();
      }),
    );

    const data = await fetchHomePage(false);
    expect(data).toBeNull();
  });
});

describe('fetchPortfolioItems', () => {
  it('throws when the API returns a non-2xx status', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      }),
    );

    await expect(
      fetchPortfolioItems('http://localhost/api/v1/pages/')
    ).rejects.toThrow(/failed to load portfolio/i);
  });

  it('throws on network failure', async () => {
    server.use(
      http.get('*/api/v1/pages/', () => {
        return HttpResponse.error();
      }),
    );

    await expect(
      fetchPortfolioItems('http://localhost/api/v1/pages/')
    ).rejects.toThrow();
  });
});

describe('submitLead', () => {
  it('throws with status and data on non-2xx response', async () => {
    server.use(
      http.post('*/api/v1/leads/', () => {
        return HttpResponse.json(
          { phone: ['Enter a valid phone number.'] },
          { status: 422 },
        );
      }),
    );

    const formData = new FormData();
    formData.append('name', 'Jane');

    await expect(
      submitLead(formData, 'http://localhost/api/v1/leads/')
    ).rejects.toMatchObject({
      status: 422,
      data: { phone: ['Enter a valid phone number.'] },
    });
  });
});

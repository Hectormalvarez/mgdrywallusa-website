import { resolveNavHref } from '@/lib/nav';

describe('resolveNavHref', () => {
  it('leaves hash anchors untouched on the home page', () => {
    expect(resolveNavHref('#services', '/')).toBe('#services');
  });

  it('roots hash anchors at home when off the home page', () => {
    expect(resolveNavHref('#services', '/portfolio')).toBe('/#services');
    expect(resolveNavHref('#portfolio', '/portfolio/sample-project')).toBe(
      '/#portfolio'
    );
  });

  it('leaves hash anchors untouched when the pathname is unknown', () => {
    expect(resolveNavHref('#lead-form', null)).toBe('#lead-form');
  });

  it('passes through absolute, relative, and scheme hrefs', () => {
    expect(resolveNavHref('https://example.com', '/portfolio')).toBe(
      'https://example.com'
    );
    expect(resolveNavHref('/portfolio', '/portfolio')).toBe('/portfolio');
    expect(resolveNavHref('mailto:info@mgdrywallusa.com', '/portfolio')).toBe(
      'mailto:info@mgdrywallusa.com'
    );
  });
});

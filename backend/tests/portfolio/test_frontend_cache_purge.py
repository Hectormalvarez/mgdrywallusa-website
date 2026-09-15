"""US-008 — Cloudflare cache purge signals for portfolio content.

Wagtail's `frontend_cache` app purges each published page's own URL;
`portfolio/signals.py` additionally purges the index pages (home +
listing) whenever a PortfolioItem is published, unpublished, or deleted.

Notes:
- Wagtail fires `page_published` more than once per publish
  (Page.save + PageRevision.publish); the purge is idempotent, so
  duplicate calls are expected and harmless. Tests assert on the *set*
  of purged URLs.
- The site fixture in conftest guarantees a localhost site, but a reused
  dev database may hold other Site records too, so the root-URL
  derivation tests stub `_default_site_root_url` for determinism.
"""

import pytest

from portfolio import signals as portfolio_signals

_INDEX_URLS = {"http://example.org/", "http://example.org/portfolio"}


@pytest.fixture
def purged_urls(monkeypatch):
    """Capture URLs handed to PurgeBatch instead of hitting Cloudflare.

    Stubs the module's site-root helper so the assertion target is
    deterministic even on a reused dev database with extra Site records.
    """
    added = []

    def fake_add_url(self, url):
        added.append(url)

    def fake_purge(self):
        pass  # URLs already captured via add_url

    monkeypatch.setattr(portfolio_signals.PurgeBatch, "add_url", fake_add_url)
    monkeypatch.setattr(portfolio_signals.PurgeBatch, "purge", fake_purge)
    monkeypatch.setattr(portfolio_signals, "_default_site_root_url", lambda: "http://example.org")
    return added


@pytest.fixture
def no_site(monkeypatch):
    """Make _default_site_root_url find no Site record."""
    monkeypatch.setattr(portfolio_signals, "_default_site_root_url", lambda: "")


def _publish(item):
    item.save_revision().publish()


@pytest.mark.django_db
class TestPortfolioIndexPurge:
    def test_publishing_item_purges_home_and_listing(self, purged_urls, portfolio_item):
        _publish(portfolio_item)
        assert set(purged_urls) == _INDEX_URLS

    def test_unpublishing_item_purges_home_and_listing(self, purged_urls, portfolio_item):
        portfolio_item.unpublish()
        assert set(purged_urls) == _INDEX_URLS

    def test_deleting_item_purges_home_and_listing(self, purged_urls, portfolio_item):
        portfolio_item.delete()
        assert set(purged_urls) == _INDEX_URLS

    def test_purge_urls_use_default_site_root_url(self, purged_urls, portfolio_item):
        _publish(portfolio_item)
        for url in purged_urls:
            assert url.startswith("http://example.org")

    def test_failed_purge_does_not_block_publish(self, monkeypatch, portfolio_item):
        """A purge failure is logged, never raised — publish must succeed."""

        def boom(self):
            raise RuntimeError("network down")

        monkeypatch.setattr(portfolio_signals.PurgeBatch, "purge", boom)
        _publish(portfolio_item)
        assert portfolio_item.live

    def test_no_default_site_skips_purge(self, purged_urls, no_site, portfolio_item):
        _publish(portfolio_item)
        assert purged_urls == []


@pytest.mark.django_db
class TestSiteHostnameSync:
    """`seed` must keep the default Site hostname aligned with FRONTEND_URL
    so Cloudflare purge URLs resolve to the public domain (ADR-0002)."""

    def _run_seed(self):
        from django.core.management import call_command

        call_command("seed")

    def test_syncs_hostname_from_public_frontend_url(self, monkeypatch, settings, site):
        settings.FRONTEND_URL = "https://mgdrywall.example.net"
        self._run_seed()

        site.refresh_from_db()
        assert site.hostname == "mgdrywall.example.net"
        assert site.port == 443

    def test_keeps_hostname_when_frontend_url_is_local(self, monkeypatch, settings, site):
        settings.FRONTEND_URL = "http://localhost:8101"
        self._run_seed()

        site.refresh_from_db()
        assert site.hostname not in ("mgdrywall.example.net",)

    def test_idempotent_when_already_synced(self, monkeypatch, settings, site):
        settings.FRONTEND_URL = "https://mgdrywall.example.net"
        site.hostname = "mgdrywall.example.net"
        site.port = 443
        site.save()

        self._run_seed()
        site.refresh_from_db()
        assert site.hostname == "mgdrywall.example.net"

    def test_home_page_root_is_preserved(self, site):
        self._run_seed()
        site.refresh_from_db()
        assert site.root_page is not None

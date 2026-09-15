"""Cloudflare cache invalidation for portfolio content (US-008, ADR-0002).

Wagtail's `frontend_cache` app already purges a published page's own URL
on publish/unpublish/delete. This module adds the *index* URLs that
embed portfolio items — the homepage (`/`) and the portfolio listing
(`/portfolio`) — so publishing or removing an item also refreshes both
aggregating pages in a single purge request.

Purge URLs are derived from the default Wagtail Site's root_url, which
must match the public domain in production (enforced by the `seed`
command). Purge failures are logged by Wagtail's backends and never
propagate — publishing is never blocked; the frontend's bounded edge
TTL (s-maxage=300) is the fallback.
"""

import logging

from django.db.models.signals import pre_delete
from django.dispatch import receiver
from wagtail.contrib.frontend_cache.utils import PurgeBatch
from wagtail.models import Site
from wagtail.signals import page_published, page_unpublished

from .models import PortfolioItem

logger = logging.getLogger(__name__)

_INDEX_PATHS = ("/", "/portfolio")


def _default_site_root_url() -> str:
    """Root URL of the default Wagtail site, or '' when unavailable."""
    site = Site.objects.filter(is_default_site=True).first()
    if site is None:
        return ""
    return site.root_url.rstrip("/")


def purge_index_pages(**_kwargs) -> None:
    """Purge the pages that embed portfolio items (home + listing).

    Never raises: a failed purge is logged and degrades gracefully to the
    frontend's bounded edge TTL (s-maxage=300). Publishing must not be
    blocked by cache invalidation.
    """
    root_url = _default_site_root_url()
    if not root_url:
        logger.warning("frontend_cache purge skipped: no default Wagtail Site record")
        return
    try:
        batch = PurgeBatch()
        for path in _INDEX_PATHS:
            batch.add_url(f"{root_url}{path}")
        batch.purge()
    except Exception:
        logger.exception(
            "frontend_cache purge failed for portfolio index pages — "
            "the edge TTL (s-maxage=300) will expire the stale entries"
        )


@receiver(page_published, sender=PortfolioItem, dispatch_uid="portfolio.item_published_purge")
def item_published_handler(sender, **kwargs) -> None:
    purge_index_pages(**kwargs)


@receiver(page_unpublished, sender=PortfolioItem, dispatch_uid="portfolio.item_unpublished_purge")
def item_unpublished_handler(sender, **kwargs) -> None:
    purge_index_pages(**kwargs)


@receiver(pre_delete, sender=PortfolioItem, dispatch_uid="portfolio.item_deleted_purge")
def item_deleted_handler(sender, **kwargs) -> None:
    purge_index_pages(**kwargs)

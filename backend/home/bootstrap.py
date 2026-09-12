"""One-time site bootstrap that runs after migrations complete.

Fresh databases are created with Wagtail's stock "Welcome to your new Wagtail
site!" page as the default site root.  That leaves the admin's "Edit Home"
shortcut with nothing to link to -- and because ``prune_menu_items`` hides the
Pages explorer there is no other route -- while the homepage content API returns
an empty list.  This brings every environment up to the production baseline: a
HomePage rooted as the default site.

This runs on ``post_migrate`` rather than in a data migration.  Replacing a site
root creates and deletes pages, and both operations touch tables owned by apps
that define Page subclasses (``portfolio``, ``wagtail.contrib.forms``) plus
Wagtail's search index (modelsearch's handlers are not disabled during
migrations, unlike Wagtail's reference-index ones).  A data migration cannot see
those tables until their own migrations have run, and the set of affected apps
grows with every installed Wagtail app.  ``post_migrate`` fires once every table
exists.

Idempotent: a no-op wherever a HomePage already exists, including production.
"""

import logging

logger = logging.getLogger(__name__)


def ensure_site_homepage(sender, **kwargs):
    """Root the default site at a HomePage when the database has none."""
    from home.models import HomePage

    try:
        if HomePage.objects.exists():
            return
        home = HomePage.ensure_for_site()
    except Exception:
        # A bootstrap convenience must never break `manage.py migrate`, which
        # the container entrypoint runs on every start.
        logger.warning("Could not ensure a HomePage for the default site.", exc_info=True)
        return

    if home is not None:
        logger.info('Created HomePage "%s" as the default site root.', home.slug)

from wagtail import hooks


@hooks.register("insert_global_admin_css")
def inject_brand_admin_css():
    """Inject owner-configured brand colors into the Wagtail admin UI.

    Reads ``SiteSettings`` for the default site so the CMS dashboard
    reflects the owner's chosen palette without a container restart.
    """
    from wagtail.models import Site
    from home.models import SiteSettings

    site = Site.objects.filter(is_default_site=True).first()
    if not site:
        return ""

    settings = SiteSettings.for_site(site)
    if not settings:
        return ""

    return f"""<style>
  :root {{
    --w-color-primary: {settings.primary_color};
    --w-color-primary-200: {settings.primary_color}33;
    --w-color-primary-400: {settings.primary_color}99;
  }}
  .sidebar-modal__header, .w-header {{
    background-color: {settings.primary_color} !important;
  }}
</style>"""
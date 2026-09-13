"""Service layer for the site_settings app."""


def build_settings_preview_payload(site, data, files=None):
    """Bind unsaved admin form values to a transient SiteSettings cluster and
    serialize it, mirroring exactly what saving the form would produce (US-006).

    The form is bound to an *unpersisted* ``SiteSettings`` instance and the
    inline ``NavigationItem`` children are materialized in memory via
    ``save(commit=False)``, so this never writes to the database and can never
    alter the live settings.

    Returns ``(payload, None)`` on success, or ``(None, errors)`` where
    ``errors`` is a field-name → message-list dict suitable for JSON.
    """
    from wagtail.contrib.settings.views import get_setting_edit_handler

    from site_settings.models import SiteSettings
    from site_settings.serializers import SiteSettingsSerializer

    form_class = get_setting_edit_handler(SiteSettings).get_form_class()
    form = form_class(data=data, files=files, instance=SiteSettings(site=site))
    if not form.is_valid():
        return None, form.errors.get_json_data()

    obj = form.save(commit=False)
    return SiteSettingsSerializer(obj).data, None

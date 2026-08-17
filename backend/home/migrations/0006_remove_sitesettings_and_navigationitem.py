from django.db import migrations


class Migration(migrations.Migration):
    """State-only removal of SiteSettings and NavigationItem from the home app.

    The underlying PostgreSQL tables (home_sitesettings, home_navigationitem)
    are NOT dropped.  The models now live in the site_settings app with
    explicit ``db_table`` Meta options that keep them pointing at the same
    tables.
    """

    dependencies = [
        ("home", "0005_expand_sitesettings_owner_selfservice"),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterModelOptions(
                    name="navigationitem",
                    options={},
                ),
                migrations.DeleteModel(name="NavigationItem"),
                migrations.DeleteModel(name="SiteSettings"),
            ],
            database_operations=[],
        ),
    ]

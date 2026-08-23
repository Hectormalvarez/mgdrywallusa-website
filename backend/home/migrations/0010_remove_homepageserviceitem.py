"""Remove the legacy HomePageServiceItem model after data has been migrated."""

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("home", "0009_migrate_services_to_snippets"),
    ]

    operations = [
        migrations.DeleteModel(
            name="HomePageServiceItem",
        ),
    ]

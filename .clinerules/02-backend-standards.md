---
paths:
  - "backend/**/*.py"
---
# Backend Standards (Django / Wagtail / DRF)

## Architecture

- Apps live in `backend/<app>/` (`core`, `home`, `portfolio`, `leads`, `site_settings`). New domain logic goes into the matching app, following its file pattern (`models.py`, `serializers.py`, `views.py`, `wagtail_hooks.py`, `services.py`).
- Keep views thin: validate with a serializer, delegate side effects to a service class (see `leads/services.py`). Use lazy imports inside services to avoid circular imports.
- Validation errors are wrapped by `core.exceptions.custom_exception_handler` into `{"errors": {field: [messages]}}`. Do not return ad-hoc error payloads that bypass it.
- Public endpoints mount under `/api/v1/` in `core/urls.py`; Wagtail page content goes through `core/router.py` (WagtailAPIRouter). Do not invent parallel URL schemes.

## Security & Robustness

- All secrets and configuration come from environment variables (`core/settings.py` refuses to start in production without `DJANGO_SECRET_KEY`). Never hardcode config or add production-reachable fallbacks.
- Public unauthenticated endpoints require DRF throttling: define a custom `AnonRateThrottle` subclass with a named scope (see `LeadRateThrottle`).
- Public intake forms use honeypot fields (e.g. `company` → silent fake 201). Preserve this pattern for any new public form.

## Wagtail

- Page models declare `api_fields` with explicit `APIField(...)` entries — headless consumers only see declared fields.
- Admin customization belongs in the app's `wagtail_hooks.py` via `@hooks.register`; flat listing viewsets in `admin.py`.
- Data that must exist in every environment is created by idempotent `post_migrate` bootstrap (see `home/bootstrap.py`) or idempotent management commands (`seed`, `seed_portfolio`) — never in data migrations that assume other apps' tables exist. All seeds must be safe to re-run.

## Tests

- pytest with `DJANGO_SETTINGS_MODULE=core.settings_test` and `--reuse-db`. Layout mirrors apps: `tests/<app>/test_<module>.py`.
- Build model instances with `tests/factories.py` (factory-boy); reuse shared fixtures from `tests/conftest.py` (`root_page`, `home_page`, `site`, `test_image`) instead of duplicating them.
- Throttling is disabled globally by an autouse fixture; do not re-enable per test.
- Every behavior change ships with tests in the matching `tests/<app>/` folder. Run `cd backend && python -m pytest -v` (and `ruff check .` + `ruff format --check .`) before committing.
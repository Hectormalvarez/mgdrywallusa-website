"""Django settings for core project."""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Security: load secrets from environment ---
DEBUG = os.environ.get('DEBUG', 'False').lower() in ('1', 'true', 'yes')

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY', '')
if not DEBUG and not SECRET_KEY:
    raise ValueError('DJANGO_SECRET_KEY must be set in production')
if not SECRET_KEY:
    # Local-dev fallback only — never reaches production
    SECRET_KEY = 'django-insecure-scaffold-key-not-for-production'

ALLOWED_HOSTS = [
    h.strip()
    for h in os.environ.get('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
    if h.strip()
]

CSRF_TRUSTED_ORIGINS = [
    o.strip()
    for o in os.environ.get('CSRF_TRUSTED_ORIGINS', 'http://localhost:3000,http://localhost:8000').split(',')
    if o.strip()
]

# --- Proxy trust (for Nginx reverse proxy) ---
# When behind Nginx, trust the forwarded headers so Django knows the real
# public hostname and protocol (HTTP vs HTTPS).
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# --- Django core apps ---
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',
    'corsheaders',
    'rest_framework',
    'wagtail.contrib.forms',
    'wagtail.contrib.redirects',
    'wagtail.contrib.settings',
    'wagtail.embeds',
    'wagtail.sites',
    'wagtail.users',
    'wagtail.snippets',
    'wagtail.documents',
    'wagtail.images',
    'wagtail.search',
    'wagtail.admin',
    'wagtail',
    'wagtail.api.v2',
    'wagtail_headless_preview',
    'modelcluster',
    'taggit',
    'home',
    'portfolio',
    'leads',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'wagtail.contrib.redirects.middleware.RedirectMiddleware',
]

ROOT_URLCONF = 'core.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                'django.template.context_processors.media',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# --- Database: credentials from environment, no hardcoded fallback ---
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ['DB_NAME'],
        'USER': os.environ['DB_USER'],
        'PASSWORD': os.environ['DB_PASSWORD'],
        'HOST': os.environ['DB_HOST'],
        'PORT': os.environ['DB_PORT'],
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

SITE_ID = 1

WAGTAIL_SITE_NAME = 'MG Drywall USA'
WAGTAIL_ENABLE_UPDATE_CHECK = False
WAGTAILADMIN_BASE_URL = os.environ.get('WAGTAILADMIN_BASE_URL', 'http://localhost:8000')

# --- Headless Preview ---
# The preview redirect URL must be browser-reachable (public origin), NOT an
# internal Docker hostname like backend/frontend or a container ID. SSR/API
# calls use WAGTAIL_API_BASE_URL (Docker DNS); this is exclusively for the
# Wagtail admin → browser redirect chain.
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
WAGTAIL_PREVIEW_URL = os.environ.get(
    'WAGTAIL_PREVIEW_URL',
    f"{FRONTEND_URL.rstrip('/')}/api/preview",
)


def _validate_wagtail_preview_url(url: str, debug: bool) -> None:
    """Validate that the headless preview URL is browser-reachable."""
    if debug:
        return
    lower = url.lower()
    if not lower.startswith('https://'):
        raise ValueError(
            f"WAGTAIL_PREVIEW_URL must use HTTPS in production. "
            f"Got: {url}. "
            f"Set it to the public frontend origin (e.g. https://example.com/api/preview)."
        )
    bad_hosts = ('0.0.0.0', '127.0.0.1', 'localhost', 'backend', 'frontend', '::1')
    if any(h in lower for h in bad_hosts):
        raise ValueError(
            f"WAGTAIL_PREVIEW_URL contains a non-public hostname. "
            f"Got: {url}. "
            f"It must be a browser-resolvable URL, not a Docker network name."
        )


_validate_wagtail_preview_url(WAGTAIL_PREVIEW_URL, DEBUG)

WAGTAIL_HEADLESS_PREVIEW = {
    'CLIENT_URLS': {
        'default': WAGTAIL_PREVIEW_URL,
    },
    'REDIRECT_ON_PREVIEW': True,
    'ENFORCE_TRAILING_SLASH': False,
}

# --- CORS ---
CORS_ALLOWED_ORIGINS = [FRONTEND_URL]

# --- Media uploads ---
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# --- Email ---
EMAIL_BACKEND = os.environ.get(
    'EMAIL_BACKEND', 'django.core.mail.backends.console.EmailBackend'
)
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@example.com')
LEAD_NOTIFICATION_EMAILS = [
    email.strip()
    for email in os.environ.get('LEAD_NOTIFICATION_EMAILS', '').split(',')
    if email.strip()
]

# --- DRF ---
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
}

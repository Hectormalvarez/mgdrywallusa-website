"""Test settings for Django/Wagtail.

- Local dev: uses SQLite in-memory (no Docker required)
- CI: uses PostgreSQL when DB_* env vars are set
"""

import os

# Guarantee DB_* env vars and DJANGO_SECRET_KEY exist before settings.py reads them
# with os.environ[...] so that SQLite local-dev runs don't KeyError on the
# unconditional DB config block or the production secret-key guard.
for _key in ('DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_HOST', 'DB_PORT', 'DJANGO_SECRET_KEY'):
    os.environ.setdefault(_key, 'test-secret-key-not-for-production')

# Provide a test-safe preview URL so validation passes when DEBUG=False.
os.environ.setdefault('WAGTAIL_PREVIEW_URL', 'https://example.com/api/preview')

from core.settings import *  # noqa: F401, E402

# Test-safe secret key
SECRET_KEY = 'test-secret-key-not-for-production'

# Allow Django test client and localhost
ALLOWED_HOSTS = ['*']

# Disable debug for tests
DEBUG = False

# Faster password hashing for tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Disable Wagtail image feature detection (requires libimagequant)
WAGTAILIMAGES_FEATURE_DETECTION = False

# Disable rate limiting in tests so they don't interfere with each other
REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = []

# Disable SSL redirect in tests (test client uses HTTP, not HTTPS)
SECURE_SSL_REDIRECT = False

# Use PostgreSQL in CI (DB_HOST + GITHUB_ACTIONS are set by the runner), SQLite otherwise
if os.environ.get('DB_HOST') and os.environ.get('GITHUB_ACTIONS') == 'true':
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('DB_NAME', 'mgdrywall'),
            'USER': os.environ.get('DB_USER', 'mgdrywall'),
            'PASSWORD': os.environ.get('DB_PASSWORD', ''),
            'HOST': os.environ['DB_HOST'],
            'PORT': os.environ.get('DB_PORT', '5432'),
        }
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',
        }
    }

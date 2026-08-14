"""Test settings for Django/Wagtail.

- Local dev: uses SQLite in-memory (no Docker required)
- CI: uses PostgreSQL when DB_* env vars are set
"""

import os

from core.settings import *  # noqa: F401, F403

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

# Use PostgreSQL in CI (when DB_HOST is set), SQLite otherwise
if os.environ.get('DB_HOST'):
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

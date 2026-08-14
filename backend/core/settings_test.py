"""Test settings for Django/Wagtail - uses SQLite for fast local testing."""

from core.settings import *  # noqa: F401, F403

# Use SQLite for tests - fast and no Docker required
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

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
import sys
import os
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import Base
from seed import seed_database
from services.auth_service import generate_auth_token

def _auth_wrapper(client, token):
    """Wraps a Flask test client so every request carries a Bearer token."""
    for meth in ('get', 'post', 'put', 'delete', 'patch'):
        original = getattr(client, meth)
        def make_wrapper(orig):
            def wrapped(*args, **kwargs):
                headers = dict(kwargs.get('headers') or {})
                headers.setdefault('Authorization', f'Bearer {token}')
                kwargs['headers'] = headers
                return orig(*args, **kwargs)
            return wrapped
        setattr(client, meth, make_wrapper(original))
    return client

@pytest.fixture(scope='function')
def app():
    app = create_app('testing')
    with app.app_context():
        # Seed test database
        seed_database(app.db_session)
        yield app
        # Teardown
        app.db_session.remove()

@pytest.fixture(scope='function')
def client(app):
    """Test client that authenticates every request as admin by default."""
    with app.app_context():
        token = generate_auth_token('admin', 'Tester')
    return _auth_wrapper(app.test_client(), token)

@pytest.fixture(scope='function')
def anon_client(app):
    """Test client WITHOUT authentication - for auth/security tests."""
    return app.test_client()

@pytest.fixture(scope='function')
def auth_token(app):
    with app.app_context():
        return generate_auth_token('admin', 'Tester')

@pytest.fixture(scope='function')
def db_session(app):
    return app.db_session
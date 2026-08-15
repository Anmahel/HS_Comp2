import sys
import os
import pytest

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import create_app
from database import Base
from seed import seed_database

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
    return app.test_client()

@pytest.fixture(scope='function')
def db_session(app):
    return app.db_session

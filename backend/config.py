import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hc-comp-dev-secret-key-only-for-local-dev')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(BASE_DIR, 'hc_comp.db')}"
    )

class TestingConfig(Config):
    TESTING = True
    DEBUG = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'hc-comp-test-secret-key')
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'TEST_DATABASE_URL',
        'sqlite:///:memory:'
    )

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        f"sqlite:///{os.path.join(BASE_DIR, 'hc_comp_prod.db')}"
    )

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
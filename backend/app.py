import os
from flask import Flask
from flask_cors import CORS
from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool
from config import config_by_name
from database import Base
from routes import catalogs_bp, inventory_bp, orders_bp, analytics_bp, system_bp

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    # CORS configuration
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        expose_headers=["Content-Disposition"]
    )

    # Database engine and scoped session setup
    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    engine_kwargs = {}
    if 'sqlite' in db_uri:
        engine_kwargs['connect_args'] = {'check_same_thread': False}
        if ':memory:' in db_uri:
            engine_kwargs['poolclass'] = StaticPool
    elif 'mysql' in db_uri or 'postgres' in db_uri:
        engine_kwargs['pool_pre_ping'] = True

    engine = create_engine(db_uri, **engine_kwargs)
    db_session = scoped_session(
        sessionmaker(autocommit=False, autoflush=False, bind=engine)
    )

    # Attach db_session and engine to app
    app.db_session = db_session
    app.db_engine = engine

    # Create tables
    Base.metadata.create_all(bind=engine)

    # Register Blueprints
    app.register_blueprint(catalogs_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(orders_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(system_bp)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app

if __name__ == '__main__':
    env = os.environ.get('FLASK_ENV', 'development')
    app = create_app(env)
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config.get('DEBUG', False))

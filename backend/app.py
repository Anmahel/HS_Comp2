import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, event
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.pool import StaticPool
from config import config_by_name
from database import Base
from routes import catalogs_bp, inventory_bp, orders_bp, analytics_bp, system_bp

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    if config_name == 'production' and not app.config.get('SECRET_KEY'):
        raise RuntimeError('SECRET_KEY é obrigatório em produção (defina a variável de ambiente SECRET_KEY).')

    # Upload Limit (16 MB max)
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    # CORS configuration
    allowed_origins = os.environ.get('ALLOWED_ORIGINS', 'http://localhost:5173,http://127.0.0.1:5173').split(',')
    CORS(
        app,
        resources={r"/api/*": {"origins": allowed_origins if config_name == 'production' else "*"}},
        expose_headers=["Content-Disposition", "Authorization"]
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

    # Enable SQLite WAL mode, foreign keys, and busy timeout
    if 'sqlite' in db_uri and ':memory:' not in db_uri:
        @event.listens_for(engine, "connect")
        def set_sqlite_pragma(dbapi_connection, connection_record):
            cursor = dbapi_connection.cursor()
            try:
                cursor.execute("PRAGMA journal_mode=WAL")
                cursor.execute("PRAGMA synchronous=NORMAL")
                cursor.execute("PRAGMA busy_timeout=5000")
                cursor.execute("PRAGMA foreign_keys=ON")
            finally:
                cursor.close()

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

    # Security Headers Middleware
    @app.after_request
    def add_security_headers(response):
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'SAMEORIGIN'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        response.headers['Content-Security-Policy'] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; "
            "frame-ancestors 'self'; base-uri 'self'; form-action 'self'"
        )
        if request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
        return response

    # Global Error Handlers
    @app.errorhandler(413)
    def request_entity_too_large(error):
        return jsonify({'error': 'Arquivo excede o limite máximo permitido de 16MB'}), 413

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Recurso não encontrado'}), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({'error': 'Método não permitido para este recurso'}), 405

    @app.errorhandler(500)
    def internal_error(error):
        current_app.logger.error(f"Erro interno não tratado: {error}")
        return jsonify({'error': 'Erro interno do servidor'}), 500

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        db_session.remove()

    return app

if __name__ == '__main__':
    env = os.environ.get('FLASK_ENV', 'development')
    app = create_app(env)
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '127.0.0.1')
    app.run(host=host, port=port, debug=app.config.get('DEBUG', False))

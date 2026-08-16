import os
from functools import wraps
from flask import request, jsonify, current_app

VALID_ROLES = {'soporte', 'separacion', 'geral', 'jefe', 'admin', 'ing'}
ADMIN_ROLES = {'jefe', 'admin', 'ing'}
ORDER_PROCESS_ROLES = {'soporte', 'jefe', 'admin', 'ing'}

def get_current_user_context():
    """
    Extracts authenticated or validated user context from request headers/auth.
    """
    role = request.headers.get('X-User-Role', 'geral').strip().lower()
    name = request.headers.get('X-User-Name', 'Operador').strip()
    
    # Fallback to general if role is invalid
    if role not in VALID_ROLES:
        role = 'geral'
        
    return {
        'role': role,
        'name': name,
        'is_admin': role in ADMIN_ROLES
    }

def require_roles(allowed_roles):
    """
    Decorator that enforces role-based access control (RBAC).
    Rejects requests with HTTP 403 Forbidden if user's role is not permitted.
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            ctx = get_current_user_context()
            role = ctx['role']
            
            # Check if role is in permitted set
            allowed_set = {r.lower() for r in allowed_roles}
            if role not in allowed_set:
                return jsonify({
                    'error': f"Acesso negado. O perfil '{role}' não possui permissão para executar esta ação.",
                    'required_roles': list(allowed_set)
                }), 403
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def verify_admin_seed_auth():
    """
    Validates authorization for database reset/seed operations.
    In testing and development environments with DEBUG=True, access is allowed.
    In production environments, a valid X-Admin-Key header matching ADMIN_SEED_SECRET is required.
    """
    env = os.environ.get('FLASK_ENV', 'development').lower()
    is_testing = current_app.config.get('TESTING', False)
    is_debug = current_app.config.get('DEBUG', False)
    
    if is_testing or (is_debug and env != 'production'):
        return True
        
    admin_secret = os.environ.get('ADMIN_SEED_SECRET')
    if not admin_secret:
        return False
        
    provided_key = request.headers.get('X-Admin-Key', '')
    return provided_key == admin_secret

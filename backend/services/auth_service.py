import os
import hmac
import hashlib
import threading
import time
from collections import defaultdict, deque
from functools import wraps
from flask import request, jsonify, current_app
from itsdangerous import URLSafeTimedSerializer, SignatureExpired, BadSignature

VALID_ROLES = {'soporte', 'separacion', 'geral', 'jefe', 'admin', 'ing', 'imprenta'}
ADMIN_ROLES = {'jefe', 'admin', 'ing'}
ORDER_PROCESS_ROLES = {'soporte', 'jefe', 'admin', 'ing'}
CATALOG_WRITE_ROLES = {'soporte', 'jefe', 'admin', 'ing'}
INVENTORY_WRITE_ROLES = {'soporte', 'jefe', 'admin', 'ing'}

_PBKDF2_ITERATIONS = 600_000


# ---------------------------------------------------------
# Password Hashing (PBKDF2-HMAC-SHA256, stdlib only)
# ---------------------------------------------------------
def hash_password(password):
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, _PBKDF2_ITERATIONS)
    return f"pbkdf2_sha256${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"

def verify_password(password, stored_hash):
    try:
        algo, iterations, salt_hex, digest_hex = stored_hash.split('$')
        if algo != 'pbkdf2_sha256':
            return False
        salt = bytes.fromhex(salt_hex)
        expected = bytes.fromhex(digest_hex)
        digest = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, int(iterations))
        return hmac.compare_digest(digest, expected)
    except (ValueError, TypeError):
        return False


# ---------------------------------------------------------
# Token Signing / Verification
# ---------------------------------------------------------
def get_auth_serializer():
    secret_key = current_app.config.get('SECRET_KEY')
    if not secret_key:
        raise RuntimeError('SECRET_KEY não configurada no servidor')
    return URLSafeTimedSerializer(secret_key, salt='hc-auth-token-salt')

def generate_auth_token(role, name='Operador', expires_in=86400):
    s = get_auth_serializer()
    role_clean = role.strip().lower() if role else 'geral'
    if role_clean not in VALID_ROLES:
        role_clean = 'geral'

    payload = {
        'role': role_clean,
        'name': name.strip() if name else 'Operador',
        'iat': int(time.time()),
        'exp_in': expires_in
    }
    return s.dumps(payload)

def verify_auth_token(token):
    if not token:
        return None
    s = get_auth_serializer()
    try:
        data = s.loads(token, max_age=86400 * 7)
        role = data.get('role', 'geral')
        if role not in VALID_ROLES:
            return None
        return {
            'role': role,
            'name': data.get('name', 'Operador'),
            'is_admin': role in ADMIN_ROLES
        }
    except (SignatureExpired, BadSignature, Exception):
        return None


# ---------------------------------------------------------
# Auth Context (Bearer token ONLY - no header spoofing fallback)
# ---------------------------------------------------------
def get_current_user_context():
    auth_header = request.headers.get('Authorization', '')
    if not auth_header.startswith('Bearer '):
        return None
    return verify_auth_token(auth_header[7:].strip())


# ---------------------------------------------------------
# Authorization Helpers
# ---------------------------------------------------------
def check_auth_roles(allowed_roles):
    """
    Returns a (response, status) tuple when access is denied, or None when allowed.
    Usable inside mixed GET/POST handlers to protect only mutating methods.
    """
    ctx = get_current_user_context()
    if ctx is None:
        return jsonify({'error': 'Autenticação necessária. Envie um token válido em Authorization: Bearer <token>'}), 401

    role = ctx['role']
    allowed_set = {r.lower() for r in allowed_roles}
    if role not in allowed_set:
        return jsonify({
            'error': f"Acesso negado. O perfil '{role}' não possui permissão para executar esta ação.",
            'required_roles': list(allowed_set)
        }), 403
    return None

def require_any_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        denied = check_auth_roles(VALID_ROLES)
        if denied:
            return denied
        return f(*args, **kwargs)
    return decorated_function

def require_roles(allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            denied = check_auth_roles(allowed_roles)
            if denied:
                return denied
            return f(*args, **kwargs)
        return decorated_function
    return decorator


# ---------------------------------------------------------
# Admin Seed Protection (constant-time comparison)
# ---------------------------------------------------------
def verify_admin_seed_auth():
    env = os.environ.get('FLASK_ENV', 'development').lower()
    is_testing = current_app.config.get('TESTING', False)
    is_debug = current_app.config.get('DEBUG', False)

    if is_testing or (is_debug and env != 'production'):
        return True

    admin_secret = os.environ.get('ADMIN_SEED_SECRET')
    if not admin_secret:
        return False

    provided_key = request.headers.get('X-Admin-Key', '')
    return hmac.compare_digest(provided_key, admin_secret)


# ---------------------------------------------------------
# Simple In-Memory Rate Limiting (per IP, sliding window)
# ---------------------------------------------------------
class RateLimiter:
    def __init__(self):
        self._hits = defaultdict(deque)
        self._lock = threading.Lock()

    def allow(self, key, limit, window_seconds):
        now = time.monotonic()
        with self._lock:
            bucket = self._hits[key]
            while bucket and now - bucket[0] > window_seconds:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True

rate_limiter = RateLimiter()

def rate_limit(limit, window_seconds, scope):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            key = f"{scope}:{request.remote_addr or 'unknown'}"
            if not rate_limiter.allow(key, limit, window_seconds):
                return jsonify({'error': 'Muitas requisições. Tente novamente em alguns instantes.'}), 429
            return f(*args, **kwargs)
        return wrapper
    return decorator
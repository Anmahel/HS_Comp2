from flask import request, jsonify, current_app
from seed import seed_database
from services.auth_service import (
    verify_admin_seed_auth, generate_auth_token, verify_password,
    rate_limit, VALID_ROLES
)
from models import User
from . import system_bp

def get_session():
    return current_app.db_session

# ---------------------------------------------------------
# HEALTH CHECK (/api/health)
# ---------------------------------------------------------
@system_bp.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'app': 'HC_comp Inventory System',
        'version': '2.0.0'
    })


# ---------------------------------------------------------
# AUTHENTICATION LOGIN (/api/auth/login)
# ---------------------------------------------------------
@system_bp.route('/api/auth/login', methods=['POST'])
@rate_limit(10, 60, 'login')
def login():
    data = request.get_json() or {}
    username = str(data.get('username', '')).strip()
    password = str(data.get('password', ''))

    if not username or not password:
        return jsonify({'error': 'Usuário e senha são obrigatórios'}), 400

    session = get_session()
    user = session.query(User).filter_by(username=username, is_active=True).first()

    if not user or not verify_password(password, user.password_hash):
        return jsonify({'error': 'Credenciais inválidas'}), 401

    if user.role not in VALID_ROLES:
        return jsonify({'error': 'Perfil de usuário inválido'}), 403

    token = generate_auth_token(user.role, user.name)
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


# ---------------------------------------------------------
# PROTECTED DATABASE SEED (/api/seed)
# ---------------------------------------------------------
@system_bp.route('/api/seed', methods=['POST', 'GET'])
@rate_limit(5, 60, 'seed')
def handle_seed():
    if not verify_admin_seed_auth():
        return jsonify({
            'error': 'Acesso não autorizado. A reinicialização do banco requer chave administrativa (X-Admin-Key).'
        }), 403

    try:
        session = get_session()
        seed_database(session)
        return jsonify({'message': 'Banco de dados semeado com sucesso'}), 200
    except Exception as e:
        current_app.logger.error(f"Error seeding database: {str(e)}")
        return jsonify({'error': 'Erro interno ao semear banco de dados'}), 500
from flask import jsonify, current_app
from seed import seed_database
from services.auth_service import verify_admin_seed_auth
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
# PROTECTED DATABASE SEED (/api/seed)
# ---------------------------------------------------------
@system_bp.route('/api/seed', methods=['POST', 'GET'])
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
        return jsonify({'error': str(e)}), 500

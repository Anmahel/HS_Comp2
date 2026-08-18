import io
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa
from services.auth_service import generate_auth_token

def test_negative_quantity_order_batch_rejected(client, db_session):
    session = db_session
    brand = session.query(Brand).first()
    cor_pre = session.query(Cor).filter_by(cor='PRE').first()
    tipo_cm = session.query(Tipo).filter_by(codigo='CM').first()
    tam_g = session.query(Tamanho).filter_by(tamanho='G').first()
    design_643 = Design(nome_design="Rita Test", codigo_estampa="643")
    session.add(design_643)
    session.flush()

    peca = PecaPronta(
        brand_id=brand.id,
        design_id=design_643.id,
        cor_id=cor_pre.id,
        tipo_id=tipo_cm.id,
        tamanho_id=tam_g.id,
        quantidade=10
    )
    session.add(peca)
    session.commit()

    # Attempt to inject negative quantity
    payload = {
        'items': [
            {'sku_original': 'CM-643-PRE-G', 'quantidade': -5}
        ]
    }
    token = generate_auth_token('admin', 'Tester')
    headers = {'Authorization': f"Bearer {token}"}

    # 1. Preview must reject
    resp_prev = client.post('/api/pedidos/previa', json=payload, headers=headers)
    assert resp_prev.status_code == 400
    assert 'maior que zero' in resp_prev.get_json()['error']

    # 2. Batch processing must reject
    resp_proc = client.post('/api/pedidos/procesar', json=payload, headers=headers)
    assert resp_proc.status_code == 400
    assert 'maior que zero' in resp_proc.get_json()['error']

    # 3. Stock must remain unchanged at 10 (not inflated to 15)
    session.refresh(peca)
    assert peca.quantidade == 10


def test_non_integer_quantity_rejected(client):
    payload = {
        'items': [
            {'sku_original': 'CM-643-PRE-G', 'quantidade': 'invalid_num'}
        ]
    }
    token = generate_auth_token('admin', 'Tester')
    headers = {'Authorization': f"Bearer {token}"}

    resp = client.post('/api/pedidos/procesar', json=payload, headers=headers)
    assert resp.status_code == 400


def test_auth_token_lifecycle_and_verification(app, client):
    # 1. Login with default seeded admin credentials
    resp_login = client.post('/api/auth/login', json={'username': 'admin', 'password': 'admin123'})
    assert resp_login.status_code == 200
    login_data = resp_login.get_json()
    token = login_data['token']
    assert token is not None
    assert login_data['user']['role'] == 'admin'

    # 2. Use token on protected route
    headers = {'Authorization': f"Bearer {token}"}
    resp = client.get('/api/pecas-prontas', headers=headers)
    assert resp.status_code == 200

    # 3. Invalid credentials rejected
    resp_bad = client.post('/api/auth/login', json={'username': 'admin', 'password': 'wrong'})
    assert resp_bad.status_code == 401

    # 4. Tampered token rejected
    tampered_headers = {'Authorization': "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.tampered.signature"}
    fake_role_resp = client.post(
        '/api/pedidos/procesar',
        json={'items': []},
        headers=tampered_headers
    )
    assert fake_role_resp.status_code == 401


def test_unauthorized_requests_rejected(anon_client):
    # No token at all -> 401 on protected endpoints
    resp = anon_client.get('/api/pecas-prontas')
    assert resp.status_code == 401

    resp2 = anon_client.post('/api/pedidos/procesar', json={'items': []})
    assert resp2.status_code == 401

    resp3 = anon_client.get('/api/movimentacoes')
    assert resp3.status_code == 401

    # Header spoofing no longer works: X-User-Role is ignored without a valid token
    resp4 = anon_client.post(
        '/api/pedidos/procesar',
        json={'items': []},
        headers={'X-User-Role': 'admin', 'X-User-Name': 'Hacker'}
    )
    assert resp4.status_code == 401

    # GET-only read endpoint also protected
    resp5 = anon_client.get('/api/verificar-disponibilidade?sku=001')
    assert resp5.status_code == 401


def test_write_endpoints_require_write_roles(app, client):
    from services.auth_service import generate_auth_token

    def bearer(role):
        with app.app_context():
            return {'Authorization': f"Bearer {generate_auth_token(role, 'Tester')}"}

    # 'separacion' cannot create catalog items
    resp = client.post('/api/brands', json={'name': 'Nova Marca', 'slug': 'NM'}, headers=bearer('separacion'))
    assert resp.status_code == 403

    # 'geral' cannot deduct stock
    resp2 = client.post('/api/usar-estoque', json={'categoria': 'peca', 'id': 1, 'quantidade': 1}, headers=bearer('geral'))
    assert resp2.status_code == 403

    # 'soporte' can create brands
    resp3 = client.post('/api/brands', json={'name': 'Nova Marca', 'slug': 'NM'}, headers=bearer('soporte'))
    assert resp3.status_code == 201


def test_zero_and_negative_pagination_resilience(client):
    # Verify page=0 and per_page=0 do not crash with ZeroDivisionError
    resp_zero = client.get('/api/pecas-prontas?page=0&per_page=0')
    assert resp_zero.status_code == 200
    data = resp_zero.get_json()
    assert 'items' in data
    assert data['page'] >= 1
    assert data['per_page'] >= 1

    # Verify negative limit in analytics does not crash
    resp_mov = client.get('/api/movimentacoes?limit=-10')
    assert resp_mov.status_code == 200


def test_escaped_wildcard_search(client):
    # Searching for %%% or ___ should not crash or error
    resp = client.get('/api/pecas-prontas?q=%%%%%')
    assert resp.status_code == 200

    resp_est = client.get('/api/estampas?q=____')
    assert resp_est.status_code == 200


def test_wildcard_search_does_not_match_everything(client):
    # Literal % must NOT act as a wildcard: a query of only % must return no rows
    resp = client.get('/api/pecas-prontas?q=%25&page=1&per_page=100')
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total'] == 0

    # Escaped underscore must not match every single-char value
    resp_est = client.get('/api/estampas?q=_&page=1&per_page=100')
    assert resp_est.status_code == 200
    data_est = resp_est.get_json()
    assert data_est['total'] == 0


def test_security_headers_present(client):
    resp = client.get('/api/health')
    assert resp.status_code == 200
    assert resp.headers.get('X-Content-Type-Options') == 'nosniff'
    assert resp.headers.get('X-Frame-Options') == 'SAMEORIGIN'
    assert resp.headers.get('Referrer-Policy') == 'strict-origin-when-cross-origin'
    assert 'default-src' in resp.headers.get('Content-Security-Policy', '')


def test_sku_creation_status_codes(client):
    sku_name = "TEST-UNIQUE-SKU-999"
    # First time -> 201
    resp1 = client.post('/api/skus', json={'sku': sku_name})
    assert resp1.status_code == 201

    # Second time -> 200
    resp2 = client.post('/api/skus', json={'sku': sku_name})
    assert resp2.status_code == 200


def test_xss_payload_not_reflected_in_body(client):
    # SQLi/XSS payloads must not be reflected and must not crash
    payload = "%00%27%22%3Cscript%3Ealert(1)%3C/script%3E"
    resp = client.get(f'/api/pecas-prontas?q={payload}')
    assert resp.status_code == 200
    body = resp.get_data(as_text=True)
    assert '<script>alert(1)</script>' not in body


def test_whatsapp_link_validates_destination(client, db_session):
    from models import LotePedido
    lote = LotePedido(nome_arquivo='test.json', status='PROCESSADO')
    db_session.add(lote)
    db_session.commit()
    lote_id = lote.id

    resp = client.get(f'/api/pedidos/lotes/{lote_id}/whatsapp-link?destinatario=abc')
    assert resp.status_code == 400

    resp2 = client.get(f'/api/pedidos/lotes/{lote_id}/whatsapp-link?destinatario=5511999999999')
    assert resp2.status_code == 200
    assert 'api.whatsapp.com/send' in resp2.get_json()['whatsapp_url']
import pytest
import json
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa, MovimentacaoEstoque

# ----------------------------------------------------------------------
# 1. CATALOG CRUD ENDPOINT TESTS
# ----------------------------------------------------------------------

def test_get_brands(client):
    res = client.get('/api/brands')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 2
    slugs = [b['slug'] for b in data]
    assert 'CR' in slugs
    assert 'RN' in slugs

def test_create_brand_success(client):
    payload = {'name': 'Heavy Style', 'slug': 'HS', 'domain': 'heavystyle.com.br'}
    res = client.post('/api/brands', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['slug'] == 'HS'
    assert data['name'] == 'Heavy Style'

def test_create_brand_duplicate_slug_error(client):
    payload = {'name': 'Duplicate Clube Rock', 'slug': 'CR'}
    res = client.post('/api/brands', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "já existe" in data['error']

def test_update_brand(client):
    res = client.get('/api/brands')
    brand_id = res.get_json()[0]['id']
    res_put = client.put(f'/api/brands/{brand_id}', json={'domain': 'updated-domain.com'})
    assert res_put.status_code == 200
    assert res_put.get_json()['domain'] == 'updated-domain.com'

def test_delete_brand(client):
    # Create brand to delete
    res_post = client.post('/api/brands', json={'name': 'Temp Brand', 'slug': 'TMP'})
    brand_id = res_post.get_json()['id']
    res_del = client.delete(f'/api/brands/{brand_id}')
    assert res_del.status_code == 200
    res_get = client.get(f'/api/brands/{brand_id}')
    assert res_get.status_code == 404

def test_get_cores(client):
    res = client.get('/api/cores')
    assert res.status_code == 200
    data = res.get_json()
    cores = [c['cor'] for c in data]
    assert 'PRE' in cores
    assert 'BRA' in cores

def test_create_cor(client):
    res = client.post('/api/cores', json={'cor': 'VERD', 'nome': 'Verde Militar'})
    assert res.status_code == 201
    assert res.get_json()['cor'] == 'VERD'

def test_update_cor(client):
    res = client.get('/api/cores')
    cor_id = res.get_json()[0]['id']
    res_put = client.put(f'/api/cores/{cor_id}', json={'nome': 'Nome Atualizado'})
    assert res_put.status_code == 200
    assert res_put.get_json()['nome'] == 'Nome Atualizado'

def test_delete_cor(client):
    res_post = client.post('/api/cores', json={'cor': 'ROX', 'nome': 'Roxo'})
    cor_id = res_post.get_json()['id']
    res_del = client.delete(f'/api/cores/{cor_id}')
    assert res_del.status_code == 200

def test_get_designs(client):
    res = client.get('/api/designs')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) >= 6

def test_create_design_success(client):
    payload = {'codigo_estampa': '007', 'nome_design': 'Iron Phoenix'}
    res = client.post('/api/designs', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['codigo_estampa'] == '007'
    assert data['nome_design'] == 'Iron Phoenix'

def test_design_name_collision_error(client):
    # 'Rock Vintage' is registered with code '001'
    payload = {'codigo_estampa': '099', 'nome_design': 'Rock Vintage'}
    res = client.post('/api/designs', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    expected_msg = "O nome 'Rock Vintage' já está cadastrado no sistema com o Cód. Estampa 001. Por favor, escolha outro nome ou use o código correto."
    assert data['error'] == expected_msg

def test_get_skus(client):
    res = client.get('/api/skus')
    assert res.status_code == 200
    assert isinstance(res.get_json(), list)

def test_create_sku(client):
    res = client.post('/api/skus', json={'sku': 'CUSTOM-SKU-999'})
    assert res.status_code == 201
    assert res.get_json()['sku'] == 'CUSTOM-SKU-999'

def test_get_tamanhos(client):
    res = client.get('/api/tamanhos')
    assert res.status_code == 200
    tamanhos = [t['tamanho'] for t in res.get_json()]
    assert 'P' in tamanhos
    assert 'G1' in tamanhos

def test_create_tamanho(client):
    res = client.post('/api/tamanhos', json={'tamanho': 'G5'})
    assert res.status_code == 201
    assert res.get_json()['tamanho'] == 'G5'

def test_get_tipos(client):
    res = client.get('/api/tipos')
    assert res.status_code == 200
    codigos = [t['codigo'] for t in res.get_json()]
    assert 'CM' in codigos
    assert 'MO' in codigos

def test_create_tipo(client):
    res = client.post('/api/tipos', json={'codigo': 'BL', 'nome': 'Blusa'})
    assert res.status_code == 201
    assert res.get_json()['codigo'] == 'BL'

# ----------------------------------------------------------------------
# 2. INVENTORY: PEÇAS PRONTAS & UPSERT RULES
# ----------------------------------------------------------------------

def test_get_pecas_prontas_filter_active_stock(client):
    res = client.get('/api/pecas-prontas')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) > 0
    for item in data:
        assert item['quantidade'] > 0

def test_get_pecas_prontas_include_zero(client, db_session):
    # Add a 0 stock item
    brand = db_session.query(Brand).first()
    tipo = db_session.query(Tipo).first()
    design = db_session.query(Design).first()
    cor = db_session.query(Cor).first()
    tamanho = db_session.query(Tamanho).filter_by(tamanho='G4').first()

    p_zero = PecaPronta(
        brand_id=brand.id,
        tipo_id=tipo.id,
        design_id=design.id,
        cor_id=cor.id,
        tamanho_id=tamanho.id,
        quantidade=0
    )
    db_session.add(p_zero)
    db_session.commit()

    # Normal get should not include 0
    res_normal = client.get('/api/pecas-prontas')
    ids_normal = [i['id'] for i in res_normal.get_json()]
    assert p_zero.id not in ids_normal

    # With include_zero=true
    res_zero = client.get('/api/pecas-prontas?include_zero=true')
    ids_zero = [i['id'] for i in res_zero.get_json()]
    assert p_zero.id in ids_zero

def test_get_pecas_prontas_pagination(client):
    res = client.get('/api/pecas-prontas?page=1&per_page=2')
    assert res.status_code == 200
    data = res.get_json()
    assert 'items' in data
    assert 'total' in data
    assert len(data['items']) <= 2
    assert data['page'] == 1

def test_create_peca_pronta_new_success(client, db_session):
    brand = db_session.query(Brand).filter_by(slug='CR').first()
    tipo = db_session.query(Tipo).filter_by(codigo='CM').first()
    cor = db_session.query(Cor).filter_by(cor='BRA').first()
    tamanho = db_session.query(Tamanho).filter_by(tamanho='GG').first()

    payload = {
        'brand_id': brand.id,
        'tipo_id': tipo.id,
        'cor_id': cor.id,
        'tamanho_id': tamanho.id,
        'codigo_estampa': '001',
        'nome_design': 'Rock Vintage',
        'quantidade': 10
    }
    res = client.post('/api/pecas-prontas', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['action'] == 'created'
    assert data['item']['quantidade'] == 10
    assert data['item']['sku'] == 'CR-CM-001-BRA-GG'

def test_create_peca_pronta_upsert_increment_quantity(client, db_session):
    # Retrieve existing seeded item
    existing = db_session.query(PecaPronta).first()
    initial_qty = existing.quantidade

    payload = {
        'brand_id': existing.brand_id,
        'tipo_id': existing.tipo_id,
        'cor_id': existing.cor_id,
        'tamanho_id': existing.tamanho_id,
        'codigo_estampa': existing.design.codigo_estampa,
        'nome_design': existing.design.nome_design,
        'quantidade': 5
    }
    res = client.post('/api/pecas-prontas', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['action'] == 'updated'
    assert data['item']['quantidade'] == initial_qty + 5

def test_create_peca_pronta_design_collision_error(client, db_session):
    brand = db_session.query(Brand).first()
    tipo = db_session.query(Tipo).first()
    cor = db_session.query(Cor).first()
    tamanho = db_session.query(Tamanho).first()

    payload = {
        'brand_id': brand.id,
        'tipo_id': tipo.id,
        'cor_id': cor.id,
        'tamanho_id': tamanho.id,
        'codigo_estampa': '999',
        'nome_design': 'Rock Vintage', # conflict with 001
        'quantidade': 5
    }
    res = client.post('/api/pecas-prontas', json=payload)
    assert res.status_code == 400
    data = res.get_json()
    assert "já está cadastrado no sistema com o Cód. Estampa 001" in data['error']

def test_create_peca_pronta_negative_quantity_error(client, db_session):
    brand = db_session.query(Brand).first()
    tipo = db_session.query(Tipo).first()
    cor = db_session.query(Cor).first()
    tamanho = db_session.query(Tamanho).first()

    payload = {
        'brand_id': brand.id,
        'tipo_id': tipo.id,
        'cor_id': cor.id,
        'tamanho_id': tamanho.id,
        'codigo_estampa': '001',
        'nome_design': 'Rock Vintage',
        'quantidade': -5
    }
    res = client.post('/api/pecas-prontas', json=payload)
    assert res.status_code == 400
    assert "negativa" in res.get_json()['error']

def test_update_peca_pronta_brand_modification_guard(client, db_session):
    peca = db_session.query(PecaPronta).first()
    other_brand = db_session.query(Brand).filter(Brand.id != peca.brand_id).first()

    # Attempt to change brand_id
    res = client.put(f'/api/pecas-prontas/{peca.id}', json={'brand_id': other_brand.id})
    assert res.status_code == 400
    data = res.get_json()
    expected_error = "A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste."
    assert data['error'] == expected_error

def test_update_peca_pronta_quantity_adjust(client, db_session):
    peca = db_session.query(PecaPronta).first()
    res = client.put(f'/api/pecas-prontas/{peca.id}', json={'quantidade': 33})
    assert res.status_code == 200
    assert res.get_json()['quantidade'] == 33

def test_delete_peca_pronta(client, db_session):
    peca = db_session.query(PecaPronta).first()
    peca_id = peca.id
    res = client.delete(f'/api/pecas-prontas/{peca_id}')
    assert res.status_code == 200
    res_get = client.get(f'/api/pecas-prontas/{peca_id}')
    assert res_get.status_code == 404

# ----------------------------------------------------------------------
# 3. INVENTORY: ESTAMPAS AVULSAS & UPSERT RULES
# ----------------------------------------------------------------------

def test_get_estampas_filter_active_stock(client):
    res = client.get('/api/estampas')
    assert res.status_code == 200
    data = res.get_json()
    assert len(data) > 0
    for item in data:
        assert item['quantidade'] > 0

def test_get_estampas_include_zero(client, db_session):
    brand = db_session.query(Brand).first()
    design = db_session.query(Design).filter_by(codigo_estampa='003').first()
    cor = db_session.query(Cor).filter_by(cor='VER').first()

    est_zero = Estampa(
        brand_id=brand.id,
        design_id=design.id,
        cor_id=cor.id,
        codigo_estampa='003',
        quantidade=0
    )
    db_session.add(est_zero)
    db_session.commit()

    res_normal = client.get('/api/estampas')
    ids_normal = [e['id'] for e in res_normal.get_json()]
    assert est_zero.id not in ids_normal

    res_zero = client.get('/api/estampas?include_zero=true')
    ids_zero = [e['id'] for e in res_zero.get_json()]
    assert est_zero.id in ids_zero

def test_create_estampa_new_success(client, db_session):
    brand = db_session.query(Brand).filter_by(slug='CR').first()
    cor = db_session.query(Cor).filter_by(cor='AZU').first()

    payload = {
        'brand_id': brand.id,
        'cor_id': cor.id,
        'codigo_estampa': '001',
        'nome_design': 'Rock Vintage',
        'quantidade': 40
    }
    res = client.post('/api/estampas', json=payload)
    assert res.status_code == 201
    data = res.get_json()
    assert data['action'] == 'created'
    assert data['item']['quantidade'] == 40

def test_create_estampa_upsert_increment_quantity(client, db_session):
    existing = db_session.query(Estampa).first()
    initial_qty = existing.quantidade

    payload = {
        'brand_id': existing.brand_id,
        'cor_id': existing.cor_id,
        'codigo_estampa': existing.design.codigo_estampa,
        'nome_design': existing.design.nome_design,
        'quantidade': 15
    }
    res = client.post('/api/estampas', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['action'] == 'updated'
    assert data['item']['quantidade'] == initial_qty + 15

def test_create_estampa_negative_quantity_error(client, db_session):
    brand = db_session.query(Brand).first()
    cor = db_session.query(Cor).first()
    payload = {
        'brand_id': brand.id,
        'cor_id': cor.id,
        'codigo_estampa': '001',
        'quantidade': -10
    }
    res = client.post('/api/estampas', json=payload)
    assert res.status_code == 400
    assert "negativa" in res.get_json()['error']

def test_update_estampa_brand_modification_guard(client, db_session):
    estampa = db_session.query(Estampa).first()
    other_brand = db_session.query(Brand).filter(Brand.id != estampa.brand_id).first()

    res = client.put(f'/api/estampas/{estampa.id}', json={'brand_id': other_brand.id})
    assert res.status_code == 400
    data = res.get_json()
    expected_error = "A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste."
    assert data['error'] == expected_error

def test_update_estampa_quantity_adjust(client, db_session):
    estampa = db_session.query(Estampa).first()
    res = client.put(f'/api/estampas/{estampa.id}', json={'quantidade': 55})
    assert res.status_code == 200
    assert res.get_json()['quantidade'] == 55

def test_delete_estampa(client, db_session):
    estampa = db_session.query(Estampa).first()
    est_id = estampa.id
    res = client.delete(f'/api/estampas/{est_id}')
    assert res.status_code == 200
    res_get = client.get(f'/api/estampas/{est_id}')
    assert res_get.status_code == 404

# ----------------------------------------------------------------------
# 4. CONCURRENCY-SAFE STOCK DEDUCTION (/api/usar-estoque)
# ----------------------------------------------------------------------

def test_usar_estoque_peca_success(client, db_session):
    peca = db_session.query(PecaPronta).filter(PecaPronta.quantidade >= 5).first()
    initial_qty = peca.quantidade

    payload = {
        'categoria': 'peca',
        'id': peca.id,
        'quantidade': 3
    }
    res = client.post('/api/usar-estoque', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['item']['quantidade'] == initial_qty - 3
    assert data['movimentacao']['tipo_movimento'] == 'SAIDA'
    assert data['movimentacao']['quantidade'] == 3

def test_usar_estoque_estampa_success(client, db_session):
    est = db_session.query(Estampa).filter(Estampa.quantidade >= 5).first()
    initial_qty = est.quantidade

    payload = {
        'categoria': 'estampa',
        'id': est.id,
        'quantidade': 2
    }
    res = client.post('/api/usar-estoque', json=payload)
    assert res.status_code == 200
    data = res.get_json()
    assert data['success'] is True
    assert data['item']['quantidade'] == initial_qty - 2
    assert data['movimentacao']['tipo_movimento'] == 'SAIDA'

def test_usar_estoque_insufficient_stock_error(client, db_session):
    peca = db_session.query(PecaPronta).first()
    payload = {
        'categoria': 'peca',
        'id': peca.id,
        'quantidade': peca.quantidade + 999
    }
    res = client.post('/api/usar-estoque', json=payload)
    assert res.status_code == 400
    assert "Estoque insuficiente" in res.get_json()['error']

def test_usar_estoque_negative_or_zero_quantity_error(client, db_session):
    peca = db_session.query(PecaPronta).first()
    res_zero = client.post('/api/usar-estoque', json={'categoria': 'peca', 'id': peca.id, 'quantidade': 0})
    assert res_zero.status_code == 400

    res_neg = client.post('/api/usar-estoque', json={'categoria': 'peca', 'id': peca.id, 'quantidade': -2})
    assert res_neg.status_code == 400

def test_usar_estoque_invalid_category_error(client):
    res = client.post('/api/usar-estoque', json={'categoria': 'invalid', 'id': 1, 'quantidade': 1})
    assert res.status_code == 400

def test_usar_estoque_nonexistent_item_error(client):
    res = client.post('/api/usar-estoque', json={'categoria': 'peca', 'id': 99999, 'quantidade': 1})
    assert res.status_code == 404

# ----------------------------------------------------------------------
# 5. SEARCH & AVAILABILITY VERIFIER (/api/verificar-disponibilidade)
# ----------------------------------------------------------------------

def test_verificar_disponibilidade_exact_sku(client):
    res = client.get('/api/verificar-disponibilidade?sku=CR-CM-001-PRE-M')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'EM_ESTOQUE'
    assert data['total_pecas'] > 0

def test_verificar_disponibilidade_regex_merged_001M(client):
    # Merged "001M" extraction
    res = client.get('/api/verificar-disponibilidade?sku=001M')
    assert res.status_code == 200
    data = res.get_json()
    assert data['extracted']['code'] == '001'
    assert data['extracted']['size'] == 'M'
    assert data['total_pecas'] > 0

def test_verificar_disponibilidade_regex_merged_006G1(client):
    # Merged "006 G1" extraction
    res = client.get('/api/verificar-disponibilidade?sku=006 G1')
    assert res.status_code == 200
    data = res.get_json()
    assert data['extracted']['code'] == '006'
    assert data['extracted']['size'] == 'G1'

def test_verificar_disponibilidade_status_estampar(client, db_session):
    # Create an estampa with code 004, but no pecas prontas for it
    brand = db_session.query(Brand).filter_by(slug='CR').first()
    design = db_session.query(Design).filter_by(codigo_estampa='004').first()
    cor = db_session.query(Cor).filter_by(cor='PRE').first()

    # Clear any pecas for design 004
    db_session.query(PecaPronta).filter_by(design_id=design.id).delete()
    db_session.commit()

    res = client.get('/api/verificar-disponibilidade?sku=004')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'ESTAMPAR'
    assert data['total_pecas'] == 0
    assert data['total_estampas'] > 0

def test_verificar_disponibilidade_status_sem_estoque(client):
    res = client.get('/api/verificar-disponibilidade?sku=NONEXISTENT-DESIGN-999')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'SEM_ESTOQUE'
    assert data['total_pecas'] == 0
    assert data['total_estampas'] == 0

def test_verificar_disponibilidade_brand_filter(client):
    res = client.get('/api/verificar-disponibilidade?sku=001&brand_prefix=CR')
    assert res.status_code == 200
    data = res.get_json()
    for p in data['pecas_prontas']:
        assert p['brand_slug'] == 'CR'

def test_verificar_disponibilidade_cor_filter_only(client):
    res = client.get('/api/verificar-disponibilidade?cor=PRE')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total_pecas'] > 0
    for p in data['pecas_prontas']:
        assert p['cor'] == 'PRE'

def test_verificar_disponibilidade_tipo_filter_only(client):
    res = client.get('/api/verificar-disponibilidade?tipo=CM')
    assert res.status_code == 200
    data = res.get_json()
    assert data['total_pecas'] > 0
    for p in data['pecas_prontas']:
        assert p['tipo_codigo'] == 'CM'

def test_verificar_disponibilidade_combined_filters(client):
    res = client.get('/api/verificar-disponibilidade?sku=001&cor=PRE&tipo=CM')
    assert res.status_code == 200
    data = res.get_json()
    for p in data['pecas_prontas']:
        assert p['codigo_estampa'] == '001'
        assert p['cor'] == 'PRE'
        assert p['tipo_codigo'] == 'CM'

# ----------------------------------------------------------------------
# 6. ANALYTICS & AUDIT ENDPOINTS
# ----------------------------------------------------------------------

def test_get_movimentacoes_list(client):
    res = client.get('/api/movimentacoes')
    assert res.status_code == 200
    data = res.get_json()
    assert isinstance(data, list)
    assert len(data) > 0

def test_get_movimentacoes_filter_category(client):
    res = client.get('/api/movimentacoes?categoria=peca')
    assert res.status_code == 200
    data = res.get_json()
    for m in data:
        assert m['categoria'] == 'peca'

def test_get_dashboard_stats(client):
    res = client.get('/api/dashboard/stats')
    assert res.status_code == 200
    data = res.get_json()
    assert 'total_pecas_quantidade' in data
    assert 'total_estampas_quantidade' in data
    assert 'brand_stats' in data
    assert len(data['brand_stats']) >= 2
    assert 'top_designs' in data
    assert 'critical_items' in data
    assert isinstance(data['critical_items'], list)

# ----------------------------------------------------------------------
# 7. BOUNDARY & SQL INJECTION RESILIENCE
# ----------------------------------------------------------------------

def test_sql_injection_resilience_search(client):
    malicious_inputs = [
        "' OR '1'='1",
        "'; DROP TABLE pecas_prontas; --",
        "1 UNION SELECT * FROM brands --",
        "admin'--"
    ]
    for injection in malicious_inputs:
        res = client.get(f'/api/pecas-prontas?q={injection}')
        assert res.status_code == 200
        res_verif = client.get(f'/api/verificar-disponibilidade?sku={injection}')
        assert res_verif.status_code == 200

def test_null_and_special_character_resilience(client):
    res = client.get('/api/pecas-prontas?q=%00%27%22%3Cscript%3E')
    assert res.status_code in [200, 400]

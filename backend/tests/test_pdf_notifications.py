import io
import pytest
from models import LotePedido, ItemPedido, NotificacaoLote

def test_pdf_emission_registration_and_notification(client):
    csv_content = """SKU,Produto,Quantidade,Data
CM-001-PRE-M,Camiseta Rock,3,2026-08-16
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'lote_notif_test.csv')
    }
    res = client.post('/api/pedidos/procesar', data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    lote_id = res.get_json()['lote']['id']

    # 2. Register PDF 1 (S) emission
    reg1_res = client.post(
        f'/api/pedidos/lotes/{lote_id}/registrar-pdf',
        json={'tipo_pdf': 'PDF1'}
    )
    assert reg1_res.status_code == 200
    data1 = reg1_res.get_json()
    assert data1['lote']['has_pdf1'] is True
    assert 'imprenta' in data1['notificacao']['roles_destino']

    # 3. Register PDF 2 (P) emission
    reg2_res = client.post(
        f'/api/pedidos/lotes/{lote_id}/registrar-pdf',
        json={'tipo_pdf': 'PDF2'}
    )
    assert reg2_res.status_code == 200
    data2 = reg2_res.get_json()
    assert data2['lote']['has_pdf2'] is True
    assert 'separacion' in data2['notificacao']['roles_destino']

    # 4. List notifications
    notif_res = client.get('/api/pedidos/notificacoes')
    assert notif_res.status_code == 200
    notifs = notif_res.get_json()
    assert len(notifs) >= 2
    assert any(n['lote_id'] == lote_id and n['tipo_pdf'] == 'PDF1' for n in notifs)
    assert any(n['lote_id'] == lote_id and n['tipo_pdf'] == 'PDF2' for n in notifs)


def test_update_item_status_and_picking_persistence(client):
    csv_content = """SKU,Produto,Quantidade,Data
CF-002-BRA-P,Baby Look Rock,2,2026-08-16
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'lote_status_test.csv')
    }
    res = client.post('/api/pedidos/procesar', data=data, content_type='multipart/form-data')
    assert res.status_code == 201
    lote_data = res.get_json()['lote']
    item_id = lote_data['itens'][0]['id']
    assert lote_data['itens'][0]['status'] == 'pendiente'

    # Update to producido
    patch_res = client.patch(f'/api/lotes/items/{item_id}/status', json={'status': 'producido'})
    assert patch_res.status_code == 200
    assert patch_res.get_json()['item']['status'] == 'producido'
    assert patch_res.get_json()['item']['updated_at'] is not None

    # Verify invalid status is rejected
    bad_res = client.patch(f'/api/lotes/items/{item_id}/status', json={'status': 'invalid_status'})
    assert bad_res.status_code == 400

    # Revert to pendiente
    revert_res = client.patch(f'/api/pedidos/items/{item_id}/status', json={'status': 'pendiente'})
    assert revert_res.status_code == 200
    assert revert_res.get_json()['item']['status'] == 'pendiente'


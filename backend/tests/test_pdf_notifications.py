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

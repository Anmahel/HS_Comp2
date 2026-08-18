import io
import pytest
import openpyxl
from app import create_app
from seed import seed_database
from models import (
    Brand, Cor, Design, Tipo, Tamanho,
    PecaPronta, Estampa, MovimentacaoEstoque,
    LotePedido, ItemPedido
)
from services.parser_service import parse_sku_details, parse_csv_content, parse_xlsx_content

@pytest.fixture
def app_instance():
    app = create_app('testing')
    with app.app_context():
        session = app.db_session
        seed_database(session)
        yield app
        app.db_session.remove()

@pytest.fixture
def client(app_instance):
    from tests.conftest import _auth_wrapper
    from services.auth_service import generate_auth_token
    with app_instance.app_context():
        token = generate_auth_token('admin', 'Tester')
    return _auth_wrapper(app_instance.test_client(), token)

@pytest.fixture
def session(app_instance):
    return app_instance.db_session

# =========================================================================
# 1. SKU & Parser Unit Tests
# =========================================================================

def test_sku_parsing_variants():
    # 5-part with brand
    p1 = parse_sku_details("CR-CM-001-PRE-M")
    assert p1['tipo_item'] == 'peca'
    assert p1['brand_slug'] == 'CR'
    assert p1['tipo_codigo'] == 'CM'
    assert p1['codigo_estampa'] == '001'
    assert p1['cor_codigo'] == 'PRE'
    assert p1['tamanho'] == 'M'

    # 4-part standard garment (Agatha's workflow)
    p2 = parse_sku_details("CF-643-PRE-G")
    assert p2['tipo_item'] == 'peca'
    assert p2['tipo_codigo'] == 'CF'
    assert p2['codigo_estampa'] == '643'
    assert p2['cor_codigo'] == 'PRE'
    assert p2['tamanho'] == 'G'

    # 4-part standalone stamp with brand
    p3 = parse_sku_details("CR-EST-643-PRE")
    assert p3['tipo_item'] == 'estampa'
    assert p3['brand_slug'] == 'CR'
    assert p3['codigo_estampa'] == '643'
    assert p3['cor_codigo'] == 'PRE'

    # 2-part standalone stamp
    p4 = parse_sku_details("643-PRE")
    assert p4['tipo_item'] == 'estampa'
    assert p4['codigo_estampa'] == '643'
    assert p4['cor_codigo'] == 'PRE'

def test_csv_and_xlsx_parsing():
    csv_data = """SKU;Produto;Quantidade;Data;Imagem
CF-643-PRE-G;Camiseta Baby Look Un Belo Dia Ria - G - Preta;2;2026-08-16;https://img.com/1.jpg
CM-001-BRA-P;Camiseta Masculina 78 Black Sabbath - P - Branca;5;2026-08-16;
"""
    items_csv = parse_csv_content(csv_data)
    assert len(items_csv) == 2
    assert items_csv[0]['sku_original'] == 'CF-643-PRE-G'
    assert items_csv[0]['quantidade'] == 2
    assert items_csv[1]['sku_original'] == 'CM-001-BRA-P'
    assert items_csv[1]['quantidade'] == 5

    # Test Excel generation & parsing
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Código SKU", "Nome do Produto", "Qtd", "Data Pedido"])
    ws.append(["CF-643-PRE-GG", "Baby Look Un Belo Dia Ria GG", 3, "2026-08-16"])
    xlsx_buf = io.BytesIO()
    wb.save(xlsx_buf)
    xlsx_bytes = xlsx_buf.getvalue()

    items_xlsx = parse_xlsx_content(xlsx_bytes)
    assert len(items_xlsx) == 1
    assert items_xlsx[0]['sku_original'] == 'CF-643-PRE-GG'
    assert items_xlsx[0]['quantidade'] == 3

# =========================================================================
# 2. Integration Tests: Preview, Cascade Deduction, PDFs & Rollback
# =========================================================================

def test_pedidos_previa_simulation(client, session):
    # Setup known stock: 1 piece of CF-643-PRE-G
    brand = session.query(Brand).first()
    cor_pre = session.query(Cor).filter_by(cor='PRE').first()
    tipo_cf = session.query(Tipo).filter_by(codigo='CF').first()
    tam_g = session.query(Tamanho).filter_by(tamanho='G').first()
    design_643 = Design(nome_design="Un Belo Dia Ria", codigo_estampa="643")
    session.add(design_643)
    session.flush()

    peca = PecaPronta(
        brand_id=brand.id,
        design_id=design_643.id,
        cor_id=cor_pre.id,
        tipo_id=tipo_cf.id,
        tamanho_id=tam_g.id,
        quantidade=1
    )
    session.add(peca)
    session.commit()

    # Request preview for 2 units
    payload = {
        'items': [
            {
                'sku_original': 'CF-643-PRE-G',
                'produto_nome': 'Camiseta Baby Look Un Belo Dia Ria - G - Preta',
                'quantidade': 2
            }
        ]
    }
    resp = client.post('/api/pedidos/previa', json=payload)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data['total_itens'] == 2
    assert data['total_descontado_pecas'] == 1
    assert data['total_descontado_estampas'] == 0
    assert data['total_necessita_impressao'] == 1

    # Verify stock in DB was NOT changed during preview
    session.refresh(peca)
    assert peca.quantidade == 1

def test_order_processing_cascade_and_pdfs(client, session):
    brand = session.query(Brand).first()
    cor_pre = session.query(Cor).filter_by(cor='PRE').first()
    cor_bra = session.query(Cor).filter_by(cor='BRA').first()
    tipo_cm = session.query(Tipo).filter_by(codigo='CM').first()
    tam_g = session.query(Tamanho).filter_by(tamanho='G').first()
    tam_m = session.query(Tamanho).filter_by(tamanho='M').first()

    # 1. Design 643 with 1 ready garment in stock
    design_643 = Design(nome_design="Un Belo Dia Ria", codigo_estampa="643")
    # 2. Design 572 with 2 standalone stamps in stock
    design_572 = Design(nome_design="Tour Guns 2025", codigo_estampa="572")
    session.add_all([design_643, design_572])
    session.flush()

    peca_643 = PecaPronta(
        brand_id=brand.id,
        design_id=design_643.id,
        cor_id=cor_pre.id,
        tipo_id=tipo_cm.id,
        tamanho_id=tam_g.id,
        quantidade=1
    )
    estampa_572 = Estampa(
        brand_id=brand.id,
        design_id=design_572.id,
        cor_id=cor_bra.id,
        quantidade=2
    )
    session.add_all([peca_643, estampa_572])
    session.commit()

    # Ingest CSV file with:
    # - 2 units of CM-643-PRE-G (1 piece available -> 1 from piece, 1 needs printing)
    # - 5 units of CM-572-BRA-M (0 pieces, 2 stamps available -> 2 from stamp, 3 need printing)
    csv_content = """SKU,Produto,Quantidade,Data
CM-643-PRE-G,Camiseta Un Belo Dia Ria G Preta,2,2026-08-16
CM-572-BRA-M,Camiseta Tour Guns 2025 M Branca,5,2026-08-16
"""
    data = {
        'file': (io.BytesIO(csv_content.encode('utf-8')), 'pedidos_agatha.csv')
    }
    headers = {
        'X-User-Role': 'soporte',
        'X-User-Name': 'Agatha'
    }

    resp = client.post('/api/pedidos/procesar', data=data, content_type='multipart/form-data', headers=headers)
    assert resp.status_code == 201
    res_data = resp.get_json()
    assert res_data['success'] is True
    lote = res_data['lote']

    lote_id = lote['id']
    assert lote['total_itens'] == 7
    assert lote['total_descontado_pecas'] == 1
    assert lote['total_descontado_estampas'] == 2
    assert lote['total_necessita_impressao'] == 4 # (1 from 643 + 3 from 572)

    # Verify inventory was deducted atomically
    session.refresh(peca_643)
    session.refresh(estampa_572)
    assert peca_643.quantidade == 0
    assert estampa_572.quantidade == 0

    # Test PDF 1 (Imprenta) Generation
    pdf1_resp = client.get(f'/api/pedidos/lotes/{lote_id}/pdf-imprenta')
    assert pdf1_resp.status_code == 200
    assert pdf1_resp.mimetype == 'application/pdf'
    assert pdf1_resp.data.startswith(b'%PDF')

    # Test PDF 2 (Separação) Generation
    pdf2_resp = client.get(f'/api/pedidos/lotes/{lote_id}/pdf-separacao')
    assert pdf2_resp.status_code == 200
    assert pdf2_resp.mimetype == 'application/pdf'
    assert pdf2_resp.data.startswith(b'%PDF')

    # Test WhatsApp link endpoint
    wa_resp = client.get(f'/api/pedidos/lotes/{lote_id}/whatsapp-link')
    assert wa_resp.status_code == 200
    assert 'whatsapp_link' in wa_resp.get_json()
    assert 'api.whatsapp.com' in wa_resp.get_json()['whatsapp_link']

def test_order_batch_cancel_and_stock_rollback(client, session):
    brand = session.query(Brand).first()
    cor_pre = session.query(Cor).filter_by(cor='PRE').first()
    tipo_cf = session.query(Tipo).filter_by(codigo='CF').first()
    tam_p = session.query(Tamanho).filter_by(tamanho='P').first()
    design = Design(nome_design="Rock Classic", codigo_estampa="777")
    session.add(design)
    session.flush()

    peca = PecaPronta(
        brand_id=brand.id,
        design_id=design.id,
        cor_id=cor_pre.id,
        tipo_id=tipo_cf.id,
        tamanho_id=tam_p.id,
        quantidade=5
    )
    session.add(peca)
    session.commit()

    # Process batch deducting 3 units
    payload = {
        'items': [
            {
                'sku_original': 'CF-777-PRE-P',
                'produto_nome': 'Baby Look Rock Classic P',
                'quantidade': 3
            }
        ]
    }
    resp = client.post('/api/pedidos/procesar', json=payload, headers={'X-User-Role': 'soporte'})
    assert resp.status_code == 201
    lote_id = resp.get_json()['lote']['id']

    session.refresh(peca)
    assert peca.quantidade == 2 # 5 - 3 = 2

    # Attempt cancel without motivo -> should fail 400
    cancel_fail = client.post(f'/api/pedidos/lotes/{lote_id}/cancelar', json={'motivo': ''}, headers={'X-User-Role': 'soporte'})
    assert cancel_fail.status_code == 400
    assert 'motivo' in cancel_fail.get_json()['error'].lower()

    # Cancel with mandatory reason
    cancel_ok = client.post(
        f'/api/pedidos/lotes/{lote_id}/cancelar',
        json={'motivo': 'Arquivo enviado duplicado por engano pela equipe de suporte.'},
        headers={'X-User-Role': 'soporte', 'X-User-Name': 'Agatha'}
    )
    assert cancel_ok.status_code == 200
    assert cancel_ok.get_json()['success'] is True

    # Check inventory was restored back to 5
    session.refresh(peca)
    assert peca.quantidade == 5

    # Check audit log contains rollback entry with reason
    movs = session.query(MovimentacaoEstoque).filter(
        MovimentacaoEstoque.observacao.like(f"%Estorno Lote #{lote_id}%")
    ).all()
    assert len(movs) >= 1
    assert movs[0].tipo_movimento == 'ENTRADA'
    assert movs[0].quantidade == 3
    assert 'duplicado' in movs[0].observacao

def test_rbac_roles_enforcement(app, client):
    from services.auth_service import generate_auth_token

    def bearer(role):
        with app.app_context():
            return {'Authorization': f"Bearer {generate_auth_token(role, 'Tester')}"}

    # Separacion cannot process or cancel batches
    resp1 = client.post(
        '/api/pedidos/procesar',
        json={'items': [{'sku_original': 'CF-001-PRE-M', 'quantidade': 1}]},
        headers=bearer('separacion')
    )
    assert resp1.status_code == 403

    resp2 = client.post(
        '/api/pedidos/lotes/1/cancelar',
        json={'motivo': 'Tentativa sem permissao'},
        headers=bearer('geral')
    )
    assert resp2.status_code == 403

    # Valid role can access
    resp3 = client.post(
        '/api/pedidos/procesar',
        json={'items': [{'sku_original': 'CF-001-PRE-M', 'quantidade': 1}]},
        headers=bearer('soporte')
    )
    assert resp3.status_code == 201


# =========================================================================
# 3. Olist / Tiny "Separação de Mercadorias" Specific Parser Tests
# =========================================================================

def test_olist_tiny_sku_and_quantity_formats():
    from services.parser_service import parse_quantity_value

    # Test SKU patterns: CM-060-PRE-P, CF-643-PRE-G2, CM-778-AMA-M
    p1 = parse_sku_details("CM-060-PRE-P")
    assert p1['tipo_codigo'] == 'CM'
    assert p1['codigo_estampa'] == '060'
    assert p1['cor_codigo'] == 'PRE'
    assert p1['tamanho'] == 'P'

    p2 = parse_sku_details("CF-643-PRE-G2")
    assert p2['tipo_codigo'] == 'CF'
    assert p2['codigo_estampa'] == '643'
    assert p2['cor_codigo'] == 'PRE'
    assert p2['tamanho'] == 'G2'

    p3 = parse_sku_details("CM-778-AMA-M")
    assert p3['tipo_codigo'] == 'CM'
    assert p3['codigo_estampa'] == '778'
    assert p3['cor_codigo'] == 'AMA'
    assert p3['tamanho'] == 'M'

    # Test Decimal Quantity notations
    assert parse_quantity_value("1,00 Pç") == 1
    assert parse_quantity_value("2,00 Pç") == 2
    assert parse_quantity_value("3,00 Pç") == 3
    assert parse_quantity_value("10,00 Pç") == 10
    assert parse_quantity_value("1.00 Pç") == 1
    assert parse_quantity_value("5,00") == 5
    assert parse_quantity_value("4") == 4


def test_olist_tiny_pdf_extraction():
    from services.parser_service import parse_pdf_content
    from reportlab.lib.pagesizes import A4
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Table, TableStyle
    from reportlab.lib.styles import getSampleStyleSheet

    # Generate a realistic synthetic Olist/Tiny "Separação de mercadorias" PDF
    pdf_buffer = io.BytesIO()
    doc = SimpleDocTemplate(pdf_buffer, pagesize=A4)
    styles = getSampleStyleSheet()

    story = [
        Paragraph("<b>Separação de mercadorias</b>", styles['Heading1']),
        Paragraph("Relatório de expedição e picking", styles['Normal']),
    ]

    table_data = [
        ["Produto", "Cód. (SKU/GTIN)", "Qtd. Un.", "Localização"],
        ["Camiseta Masculina Classic Rock - P - Preta", "CM-060-PRE-P", "1,00 Pç", "A1-02"],
        ["Camiseta Baby Look Un Belo Dia Ria - G2 - Preta", "CF-643-PRE-G2", "2,00 Pç", "B3-01"],
        ["Camiseta Masculina Sun Light - M - Amarela", "CM-778-AMA-M", "3,00 Pç", "C2-05"],
    ]

    t = Table(table_data)
    story.append(t)
    doc.build(story)

    pdf_bytes = pdf_buffer.getvalue()
    extracted_items = parse_pdf_content(pdf_bytes)

    assert len(extracted_items) == 3

    item1 = extracted_items[0]
    assert item1['sku_original'] == 'CM-060-PRE-P'
    assert item1['quantidade'] == 1
    assert item1['parsed_sku']['tipo_codigo'] == 'CM'
    assert item1['parsed_sku']['codigo_estampa'] == '060'
    assert item1['parsed_sku']['tamanho'] == 'P'

    item2 = extracted_items[1]
    assert item2['sku_original'] == 'CF-643-PRE-G2'
    assert item2['quantidade'] == 2
    assert item2['parsed_sku']['tipo_codigo'] == 'CF'
    assert item2['parsed_sku']['codigo_estampa'] == '643'
    assert item2['parsed_sku']['tamanho'] == 'G2'

    item3 = extracted_items[2]
    assert item3['sku_original'] == 'CM-778-AMA-M'
    assert item3['quantidade'] == 3
    assert item3['parsed_sku']['tipo_codigo'] == 'CM'
    assert item3['parsed_sku']['codigo_estampa'] == '778'
    assert item3['parsed_sku']['tamanho'] == 'M'


def test_olist_tiny_csv_and_xlsx_direct_export():
    # Test CSV with exact Olist/Tiny column names and 'X,00 Pç' notation
    csv_text = """Produto;Cód. (SKU/GTIN);Qtd. Un.;Localização
Camiseta Masculina Classic Rock - P - Preta;CM-060-PRE-P;1,00 Pç;A1-02
Camiseta Baby Look Un Belo Dia Ria - G2 - Preta;CF-643-PRE-G2;2,00 Pç;B3-01
Camiseta Masculina Sun Light - M - Amarela;CM-778-AMA-M;3,00 Pç;C2-05
"""
    items_csv = parse_csv_content(csv_text)
    assert len(items_csv) == 3
    assert items_csv[0]['sku_original'] == 'CM-060-PRE-P'
    assert items_csv[0]['quantidade'] == 1
    assert items_csv[1]['sku_original'] == 'CF-643-PRE-G2'
    assert items_csv[1]['quantidade'] == 2
    assert items_csv[2]['sku_original'] == 'CM-778-AMA-M'
    assert items_csv[2]['quantidade'] == 3

    # Test XLSX with exact Olist/Tiny layout
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["Produto", "Cód. (SKU/GTIN)", "Qtd. Un.", "Localização"])
    ws.append(["Camiseta Masculina Classic Rock - P - Preta", "CM-060-PRE-P", "1,00 Pç", "A1-02"])
    ws.append(["Camiseta Baby Look Un Belo Dia Ria - G2 - Preta", "CF-643-PRE-G2", "2,00 Pç", "B3-01"])

    buf = io.BytesIO()
    wb.save(buf)
    items_xlsx = parse_xlsx_content(buf.getvalue())
    assert len(items_xlsx) == 2
    assert items_xlsx[0]['sku_original'] == 'CM-060-PRE-P'
    assert items_xlsx[0]['quantidade'] == 1
    assert items_xlsx[1]['sku_original'] == 'CF-643-PRE-G2'
    assert items_xlsx[1]['quantidade'] == 2


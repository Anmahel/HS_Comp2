import pytest
from datetime import datetime, timezone
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa, MovimentacaoEstoque

def test_brand_model_and_to_dict(db_session):
    brand = Brand(name="Test Brand", slug="TB", domain="testbrand.com")
    db_session.add(brand)
    db_session.commit()

    d = brand.to_dict()
    assert d['id'] == brand.id
    assert d['name'] == "Test Brand"
    assert d['slug'] == "TB"
    assert d['domain'] == "testbrand.com"

def test_cor_model_and_to_dict(db_session):
    cor = Cor(cor="LAR", nome="Laranja")
    db_session.add(cor)
    db_session.commit()

    d = cor.to_dict()
    assert d['cor'] == "LAR"
    assert d['nome'] == "Laranja"

def test_design_model_and_property_cod_estampa(db_session):
    design = Design(nome_design="Thunder Skull", codigo_estampa="099")
    db_session.add(design)
    db_session.commit()

    assert design.Cod_Estampa == "099"
    design.Cod_Estampa = "100"
    assert design.codigo_estampa == "100"

    d = design.to_dict()
    assert d['nome_design'] == "Thunder Skull"
    assert d['codigo_estampa'] == "100"
    assert d['Cod_Estampa'] == "100"

def test_sku_model_and_to_dict(db_session):
    sku = SKU(sku="TB-CM-100-AZU-M")
    db_session.add(sku)
    db_session.commit()

    d = sku.to_dict()
    assert d['sku'] == "TB-CM-100-AZU-M"

def test_tamanho_model_and_to_dict(db_session):
    tam = Tamanho(tamanho="XXL")
    db_session.add(tam)
    db_session.commit()

    d = tam.to_dict()
    assert d['tamanho'] == "XXL"

def test_tipo_model_and_to_dict(db_session):
    tipo = Tipo(codigo="RG", nome="Regata")
    db_session.add(tipo)
    db_session.commit()

    d = tipo.to_dict()
    assert d['codigo'] == "RG"
    assert d['nome'] == "Regata"

def test_peca_pronta_property_and_to_dict(db_session):
    brand = db_session.query(Brand).filter_by(slug="CR").first()
    tipo = db_session.query(Tipo).filter_by(codigo="CM").first()
    design = db_session.query(Design).filter_by(codigo_estampa="001").first()
    cor = db_session.query(Cor).filter_by(cor="PRE").first()
    tamanho = db_session.query(Tamanho).filter_by(tamanho="P").first()

    peca = PecaPronta(
        brand_id=brand.id,
        tipo_id=tipo.id,
        design_id=design.id,
        cor_id=cor.id,
        tamanho_id=tamanho.id,
        quantidade=10
    )
    db_session.add(peca)
    db_session.commit()

    # Test @property codigo_estampa
    assert peca.codigo_estampa == "001"
    
    d = peca.to_dict()
    assert d['brand_slug'] == "CR"
    assert d['tipo_codigo'] == "CM"
    assert d['codigo_estampa'] == "001"
    assert d['cor'] == "PRE"
    assert d['tamanho'] == "P"
    assert d['quantidade'] == 10
    assert d['sku'] == "CR-CM-001-PRE-P"

def test_estampa_model_and_to_dict(db_session):
    brand = db_session.query(Brand).filter_by(slug="RN").first()
    design = db_session.query(Design).filter_by(codigo_estampa="005").first()
    cor = db_session.query(Cor).filter_by(cor="PRE").first()

    est = Estampa(
        brand_id=brand.id,
        design_id=design.id,
        cor_id=cor.id,
        codigo_estampa="005",
        quantidade=25
    )
    db_session.add(est)
    db_session.commit()

    d = est.to_dict()
    assert d['brand_slug'] == "RN"
    assert d['codigo_estampa'] == "005"
    assert d['cor'] == "PRE"
    assert d['quantidade'] == 25
    assert d['sku'] == "RN-EST-005-PRE"

def test_movimentacao_estoque_model_and_to_dict(db_session):
    mov = MovimentacaoEstoque(
        categoria='peca',
        item_id=1,
        tipo_movimento='ENTRADA',
        quantidade=5,
        quantidade_anterior=10,
        quantidade_nova=15,
        observacao='Teste de movimentacao'
    )
    db_session.add(mov)
    db_session.commit()

    d = mov.to_dict()
    assert d['categoria'] == 'peca'
    assert d['tipo_movimento'] == 'ENTRADA'
    assert d['quantidade'] == 5
    assert d['quantidade_anterior'] == 10
    assert d['quantidade_nova'] == 15
    assert d['observacao'] == 'Teste de movimentacao'
    assert d['data_hora'] is not None

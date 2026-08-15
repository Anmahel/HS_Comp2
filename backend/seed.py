from database import db_session, Base
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa, MovimentacaoEstoque

def seed_database(session=None):
    if session is None:
        from config import DevelopmentConfig
        from sqlalchemy import create_engine
        engine = create_engine(DevelopmentConfig.SQLALCHEMY_DATABASE_URI)
        Base.metadata.create_all(bind=engine)
        db_session.configure(bind=engine)
        session = db_session

    # Seed Brands
    brands_data = [
        {'name': 'Clube Rock', 'slug': 'CR', 'domain': 'cluberock.com.br'},
        {'name': 'Ride Nation', 'slug': 'RN', 'domain': 'ridenation.com.br'}
    ]
    brand_map = {}
    for b in brands_data:
        existing = session.query(Brand).filter_by(slug=b['slug']).first()
        if not existing:
            new_b = Brand(**b)
            session.add(new_b)
            session.flush()
            brand_map[b['slug']] = new_b
        else:
            brand_map[b['slug']] = existing

    # Seed Cores
    cores_data = [
        {'cor': 'PRE', 'nome': 'Preto'},
        {'cor': 'BRA', 'nome': 'Branco'},
        {'cor': 'AMA', 'nome': 'Amarelo'},
        {'cor': 'AZU', 'nome': 'Azul'},
        {'cor': 'VER', 'nome': 'Vermelho'},
        {'cor': 'CIN', 'nome': 'Cinza'}
    ]
    cor_map = {}
    for c in cores_data:
        existing = session.query(Cor).filter_by(cor=c['cor']).first()
        if not existing:
            new_c = Cor(**c)
            session.add(new_c)
            session.flush()
            cor_map[c['cor']] = new_c
        else:
            cor_map[c['cor']] = existing

    # Seed Tipos
    tipos_data = [
        {'codigo': 'CM', 'nome': 'Camiseta Masculina'},
        {'codigo': 'CF', 'nome': 'Camiseta Feminina'},
        {'codigo': 'MO', 'nome': 'Moletom'}
    ]
    tipo_map = {}
    for t in tipos_data:
        existing = session.query(Tipo).filter_by(codigo=t['codigo']).first()
        if not existing:
            new_t = Tipo(**t)
            session.add(new_t)
            session.flush()
            tipo_map[t['codigo']] = new_t
        else:
            tipo_map[t['codigo']] = existing

    # Seed Tamanhos
    tamanhos_data = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4']
    tamanho_map = {}
    for tam in tamanhos_data:
        existing = session.query(Tamanho).filter_by(tamanho=tam).first()
        if not existing:
            new_tam = Tamanho(tamanho=tam)
            session.add(new_tam)
            session.flush()
            tamanho_map[tam] = new_tam
        else:
            tamanho_map[tam] = existing

    # Seed Designs
    designs_data = [
        {'nome_design': 'Rock Vintage', 'codigo_estampa': '001'},
        {'nome_design': 'Skull Wings', 'codigo_estampa': '002'},
        {'nome_design': 'Electric Guitar', 'codigo_estampa': '003'},
        {'nome_design': 'Heavy Metal Tour', 'codigo_estampa': '004'},
        {'nome_design': 'Ride or Die', 'codigo_estampa': '005'},
        {'nome_design': 'Highway Legend', 'codigo_estampa': '006'}
    ]
    design_map = {}
    for d in designs_data:
        existing = session.query(Design).filter_by(codigo_estampa=d['codigo_estampa']).first()
        if not existing:
            new_d = Design(**d)
            session.add(new_d)
            session.flush()
            design_map[d['codigo_estampa']] = new_d
        else:
            design_map[d['codigo_estampa']] = existing

    # Helper function to get or create SKU
    def get_or_create_sku(sku_code):
        sku_obj = session.query(SKU).filter_by(sku=sku_code).first()
        if not sku_obj:
            sku_obj = SKU(sku=sku_code)
            session.add(sku_obj)
            session.flush()
        return sku_obj

    # Seed Sample Peças Prontas
    sample_pecas = [
        {'brand': 'CR', 'tipo': 'CM', 'design': '001', 'cor': 'PRE', 'tamanho': 'M', 'quantidade': 15},
        {'brand': 'CR', 'tipo': 'CM', 'design': '001', 'cor': 'PRE', 'tamanho': 'G', 'quantidade': 8},
        {'brand': 'CR', 'tipo': 'CF', 'design': '002', 'cor': 'BRA', 'tamanho': 'P', 'quantidade': 12},
        {'brand': 'CR', 'tipo': 'MO', 'design': '003', 'cor': 'PRE', 'tamanho': 'GG', 'quantidade': 4}, # Critical stock < 5
        {'brand': 'RN', 'tipo': 'CM', 'design': '005', 'cor': 'PRE', 'tamanho': 'G', 'quantidade': 20},
        {'brand': 'RN', 'tipo': 'CM', 'design': '006', 'cor': 'CIN', 'tamanho': 'G1', 'quantidade': 3}, # Critical stock < 5
        {'brand': 'RN', 'tipo': 'MO', 'design': '005', 'cor': 'PRE', 'tamanho': 'GG', 'quantidade': 7},
    ]

    for p in sample_pecas:
        b = brand_map[p['brand']]
        t = tipo_map[p['tipo']]
        d = design_map[p['design']]
        c = cor_map[p['cor']]
        tam = tamanho_map[p['tamanho']]
        sku_str = f"{b.slug}-{t.codigo}-{d.codigo_estampa}-{c.cor}-{tam.tamanho}"
        sku_obj = get_or_create_sku(sku_str)

        existing_peca = session.query(PecaPronta).filter_by(
            brand_id=b.id, tipo_id=t.id, design_id=d.id, cor_id=c.id, tamanho_id=tam.id
        ).first()

        if not existing_peca:
            peca = PecaPronta(
                brand_id=b.id,
                tipo_id=t.id,
                design_id=d.id,
                cor_id=c.id,
                tamanho_id=tam.id,
                sku_id=sku_obj.id,
                quantidade=p['quantidade']
            )
            session.add(peca)
            session.flush()
            # Log initial seed movement
            mov = MovimentacaoEstoque(
                categoria='peca',
                item_id=peca.id,
                tipo_movimento='ENTRADA',
                quantidade=p['quantidade'],
                quantidade_anterior=0,
                quantidade_nova=p['quantidade'],
                observacao='Carga inicial de estoque'
            )
            session.add(mov)

    # Seed Sample Estampas
    sample_estampas = [
        {'brand': 'CR', 'design': '001', 'cor': 'PRE', 'quantidade': 30},
        {'brand': 'CR', 'design': '002', 'cor': 'BRA', 'quantidade': 25},
        {'brand': 'CR', 'design': '004', 'cor': 'PRE', 'quantidade': 2}, # Critical stock < 5
        {'brand': 'RN', 'design': '005', 'cor': 'PRE', 'quantidade': 50},
        {'brand': 'RN', 'design': '006', 'cor': 'CIN', 'quantidade': 18},
    ]

    for est in sample_estampas:
        b = brand_map[est['brand']]
        d = design_map[est['design']]
        c = cor_map[est['cor']]
        sku_str = f"{b.slug}-EST-{d.codigo_estampa}-{c.cor}"
        sku_obj = get_or_create_sku(sku_str)

        existing_est = session.query(Estampa).filter_by(
            brand_id=b.id, design_id=d.id, cor_id=c.id
        ).first()

        if not existing_est:
            estampa = Estampa(
                brand_id=b.id,
                design_id=d.id,
                cor_id=c.id,
                codigo_estampa=d.codigo_estampa,
                sku_id=sku_obj.id,
                quantidade=est['quantidade']
            )
            session.add(estampa)
            session.flush()
            mov = MovimentacaoEstoque(
                categoria='estampa',
                item_id=estampa.id,
                tipo_movimento='ENTRADA',
                quantidade=est['quantidade'],
                quantidade_anterior=0,
                quantidade_nova=est['quantidade'],
                observacao='Carga inicial de estampas'
            )
            session.add(mov)

    session.commit()
    print("Database successfully seeded.")

if __name__ == '__main__':
    from config import DevelopmentConfig
    from sqlalchemy import create_engine
    engine = create_engine(DevelopmentConfig.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(bind=engine)
    db_session.configure(bind=engine)
    seed_database()

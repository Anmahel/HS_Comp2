import os
import re
from sqlalchemy import create_engine
from config import config_by_name
from database import Base, db_session
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, MovimentacaoEstoque
from services.catalog_service import resolve_design, get_or_create_sku

RAW_DATA = """
Camiseta Masculina 91 Van Halen - M - Preta,CF-733-PRE-G,1.00
Camiseta Baby Look Feminina Janis Joplin - M - Branca,CF-256-BRA-M,1.00
Camiseta Masculina Black Sabbath Master - GG - Preta,CM-083-PRE-GG,1.00
Camiseta Baby Look Feminina Rush Fly By Night - G - Preta,CF-678-PRE-G,1.00
Camiseta Masculina ACDC Raiz Copa - GG - Amarela,CM-778-AMA-GG,3.00
Camiseta Baby Look Feminina Um Belo Dia Rita - G2 - Preta,CF-643-PRE-G2,2.00
Camiseta Masculina Brasão CR Brasil - G - Preta,CM-821-PRE-G,2.00
Camiseta Baby Look Feminina Peanuts N Roses - M - Preta,CF-584-PRE-M,2.00
Camiseta Masculina Nirvana Lettering Copa - M - Amarela,CM-783-AMA-M,2.00
Camiseta Baby Look Feminina Pink Floyd Special - G2 - Preta,CF-415-PRE-G2,1.00
Camiseta Masculina Led Zeppelin Jack - P - Preta,CM-280-PRE-P,1.00
Camiseta Baby Look Feminina The Rolling Stones - G2 - Preta,CF-544-PRE-G2,1.00
Camiseta Masculina Iron Maiden Book of Souls - M - Branca,CM-248-BRA-M,1.00
Camiseta Baby Look Feminina Rei Michael Jackson - M - Preta,CF-652-PRE-M,1.00
Camiseta Masculina Guns Raiz - G4 - Preta,CM-218-PRE-G4,1.00
Camiseta Baby Look Feminina Mouse Rock - M - Branca,CF-353-BRA-M,1.00
Camiseta Masculina Bon Jovi Copa - M - Amarela,CM-819-AMA-M,1.00
Camiseta Baby Look Feminina Red Hot Chili Peppers - G - Preta,CF-437-PRE-G,1.00
Camiseta Masculina Metallica Copa - GG - Amarela,CM-782-AMA-GG,3.00
Camiseta Baby Look Feminina Snoopy Rock - P - Preta,CF-632-PRE-P,1.00
Camiseta Masculina Dead Kennedys - P - Preta,CM-141-PRE-P,1.00
Camiseta Baby Look Feminina Madruga Roqueiro - G2 - Branca,CF-310-BRA-G2,1.00
Camiseta Masculina Kiss Copa - GG - Amarela,CM-815-AMA-GG,2.00
Camiseta Baby Look Feminina Rock Love - G2 - Branca,CF-452-BRA-G2,1.00
Camiseta Masculina Pearl Jam Copa - GG - Amarela,CM-813-PRE-GG,3.00
"""

def extract_design_name(product_str):
    """
    Extracts the design name from strings like:
    'Camiseta Masculina 91 Van Halen - M - Preta' -> '91 Van Halen'
    'Camiseta Baby Look Feminina Janis Joplin - M - Branca' -> 'Janis Joplin'
    """
    cleaned = product_str.strip()
    # Remove prefix
    cleaned = re.sub(r'^(Camiseta\s+Baby\s+Look\s+Feminina|Camiseta\s+Masculina|Camiseta\s+Feminina|Moletom)\s+', '', cleaned, flags=re.IGNORECASE)
    # Remove suffix '- Size - Color'
    cleaned = re.sub(r'\s*-\s*[A-Z0-9]+\s*-\s*.*$', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

def seed_real_data(env_name='development'):
    config_obj = config_by_name.get(env_name, config_by_name['development'])
    engine = create_engine(config_obj.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(bind=engine)
    db_session.configure(bind=engine)
    session = db_session

    brand_cr = session.query(Brand).filter_by(slug='CR').first()
    if not brand_cr:
        brand_cr = Brand(name='Clube Rock', slug='CR', domain='cluberock.com.br')
        session.add(brand_cr)
        session.flush()

    inserted_count = 0
    total_units = 0

    lines = [l.strip() for l in RAW_DATA.strip().split('\n') if l.strip()]
    for line in lines:
        parts = [p.strip() for p in line.split(',')]
        if len(parts) < 3:
            continue
        product_name, sku_str, qtd_str = parts[0], parts[1], parts[2]
        qtd = int(float(qtd_str))
        design_name = extract_design_name(product_name)

        sku_parts = sku_str.split('-')
        tipo_code = sku_parts[0] # CM or CF
        cod_estampa = sku_parts[1] # e.g. 733
        cor_code = sku_parts[2] # e.g. PRE
        tam_code = sku_parts[3] # e.g. G, G2, etc.

        # 1. Resolve / Ensure Tipo
        tipo = session.query(Tipo).filter_by(codigo=tipo_code).first()
        if not tipo:
            tipo_name = 'Camiseta Feminina' if tipo_code == 'CF' else 'Camiseta Masculina'
            tipo = Tipo(codigo=tipo_code, nome=tipo_name)
            session.add(tipo)
            session.flush()

        # 2. Resolve / Ensure Cor
        cor = session.query(Cor).filter_by(cor=cor_code).first()
        if not cor:
            color_names = {'PRE': 'Preto', 'BRA': 'Branco', 'AMA': 'Amarelo', 'AZU': 'Azul', 'CIN': 'Cinza', 'VER': 'Vermelho'}
            cor = Cor(cor=cor_code, nome=color_names.get(cor_code, cor_code))
            session.add(cor)
            session.flush()

        # 3. Resolve / Ensure Tamanho
        tam = session.query(Tamanho).filter_by(tamanho=tam_code).first()
        if not tam:
            tam = Tamanho(tamanho=tam_code)
            session.add(tam)
            session.flush()

        # 4. Resolve / Ensure Design
        design = session.query(Design).filter_by(codigo_estampa=cod_estampa).first()
        if not design:
            # Check if design name already exists under another code
            existing_by_name = session.query(Design).filter(Design.nome_design.ilike(design_name)).first()
            if existing_by_name and existing_by_name.codigo_estampa != cod_estampa:
                design_name = f"{design_name} ({cod_estampa})"
            design = Design(codigo_estampa=cod_estampa, nome_design=design_name)
            session.add(design)
            session.flush()

        # 5. Full structured SKU: CR-CM-778-AMA-GG
        full_sku_str = f"{brand_cr.slug}-{tipo.codigo}-{design.codigo_estampa}-{cor.cor}-{tam.tamanho}"
        sku_obj = get_or_create_sku(session, full_sku_str)

        # 6. Upsert / Insert PecaPronta
        existing_peca = session.query(PecaPronta).filter_by(
            brand_id=brand_cr.id,
            tipo_id=tipo.id,
            design_id=design.id,
            cor_id=cor.id,
            tamanho_id=tam.id
        ).first()

        if existing_peca:
            existing_peca.quantidade += qtd
            existing_peca.sku_id = sku_obj.id
            peca_id = existing_peca.id
        else:
            new_peca = PecaPronta(
                brand_id=brand_cr.id,
                tipo_id=tipo.id,
                design_id=design.id,
                cor_id=cor.id,
                tamanho_id=tam.id,
                sku_id=sku_obj.id,
                quantidade=qtd
            )
            session.add(new_peca)
            session.flush()
            peca_id = new_peca.id

        # 7. Audit log movement
        mov = MovimentacaoEstoque(
            categoria='peca',
            item_id=peca_id,
            tipo_movimento='ENTRADA',
            quantidade=qtd,
            quantidade_anterior=0,
            quantidade_nova=qtd,
            observacao=f"Carga inicial de estoque real: {product_name}"
        )
        session.add(mov)

        inserted_count += 1
        total_units += qtd
        print(f"[{inserted_count}/25] Inserido: {full_sku_str} | {design.nome_design} | {qtd} un")

    session.commit()
    print(f"\n✅ Éxito: {inserted_count} productos insertados ({total_units} unidades en total en inventario).")

if __name__ == '__main__':
    seed_real_data()

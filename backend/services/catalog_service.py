from sqlalchemy import or_
from models import Design, SKU

def resolve_design(session, codigo_estampa, nome_design):
    """
    Finds or creates a Design enforcing business rules:
      - Rule 2: Cannot register duplicate codigo_estampa under different names.
      - Rule 3: Cannot register duplicate nome_design under different codigo_estampa.
    """
    cod = str(codigo_estampa).strip()
    nome = str(nome_design).strip()

    if not cod or not nome:
        raise ValueError("Cód. Estampa e Nome do Design são obrigatórios")

    # Check collision on codigo_estampa
    existing_by_cod = session.query(Design).filter_by(codigo_estampa=cod).first()
    if existing_by_cod:
        if existing_by_cod.nome_design.lower() != nome.lower():
            raise ValueError(
                f"O Cód. Estampa {cod} já pertence ao design '{existing_by_cod.nome_design}'. "
                f"Não é permitido cadastrar com o nome '{nome}'."
            )
        return existing_by_cod

    # Check collision on nome_design
    existing_by_nome = session.query(Design).filter(
        Design.nome_design.ilike(nome)
    ).first()
    if existing_by_nome:
        if existing_by_nome.codigo_estampa != cod:
            raise ValueError(
                f"O nome '{nome}' já está cadastrado no sistema com o Cód. Estampa {existing_by_nome.codigo_estampa}. Por favor, escolha outro nome ou use o código correto."
            )
        return existing_by_nome

    # Create new Design
    new_design = Design(codigo_estampa=cod, nome_design=nome)
    session.add(new_design)
    session.flush()
    return new_design


def get_or_create_sku(session, sku_code):
    """
    Finds existing SKU or creates a new entry in skus table.
    """
    code = str(sku_code).strip().upper()
    sku_obj = session.query(SKU).filter_by(sku=code).first()
    if not sku_obj:
        sku_obj = SKU(sku=code)
        session.add(sku_obj)
        session.flush()
    return sku_obj

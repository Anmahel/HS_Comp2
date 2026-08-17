import os
from sqlalchemy import create_engine
from config import config_by_name
from database import Base, db_session
from models import (
    Brand, Cor, Design, SKU, Tamanho, Tipo,
    PecaPronta, Estampa, MovimentacaoEstoque,
    LotePedido, ItemPedido
)

def clean_database(env_name='development'):
    config_obj = config_by_name.get(env_name, config_by_name['development'])
    engine = create_engine(config_obj.SQLALCHEMY_DATABASE_URI)
    Base.metadata.create_all(bind=engine)
    db_session.configure(bind=engine)
    session = db_session

    print("Limpiando tablas de inventario, lotes y movimientos...")
    # Clean operational tables
    session.query(ItemPedido).delete()
    session.query(LotePedido).delete()
    session.query(MovimentacaoEstoque).delete()
    session.query(PecaPronta).delete()
    session.query(Estampa).delete()
    session.query(SKU).delete()
    session.commit()

    print("Asegurando catálogos base (Marcas, Colores, Tipos, Tallas)...")
    # Base Brands
    brands_data = [
        {'name': 'Clube Rock', 'slug': 'CR', 'domain': 'cluberock.com.br'},
        {'name': 'Ride Nation', 'slug': 'RN', 'domain': 'ridenation.com.br'}
    ]
    for b in brands_data:
        if not session.query(Brand).filter_by(slug=b['slug']).first():
            session.add(Brand(**b))

    # Base Cores
    cores_data = [
        {'cor': 'PRE', 'nome': 'Preto'},
        {'cor': 'BRA', 'nome': 'Branco'},
        {'cor': 'AMA', 'nome': 'Amarelo'},
        {'cor': 'AZU', 'nome': 'Azul'},
        {'cor': 'VER', 'nome': 'Vermelho'},
        {'cor': 'CIN', 'nome': 'Cinza'}
    ]
    for c in cores_data:
        if not session.query(Cor).filter_by(cor=c['cor']).first():
            session.add(Cor(**c))

    # Base Tipos
    tipos_data = [
        {'codigo': 'CM', 'nome': 'Camiseta Masculina'},
        {'codigo': 'CF', 'nome': 'Camiseta Feminina'},
        {'codigo': 'MO', 'nome': 'Moletom'}
    ]
    for t in tipos_data:
        if not session.query(Tipo).filter_by(codigo=t['codigo']).first():
            session.add(Tipo(**t))

    # Base Tamanhos
    tamanhos_data = ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4']
    for tam in tamanhos_data:
        if not session.query(Tamanho).filter_by(tamanho=tam).first():
            session.add(Tamanho(tamanho=tam))

    session.commit()
    print("Base de datos limpia y lista para datos reales del negocio.")

if __name__ == '__main__':
    env = os.environ.get('FLASK_ENV', 'development')
    clean_database(env)

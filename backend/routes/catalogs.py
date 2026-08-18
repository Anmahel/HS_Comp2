from flask import request, jsonify, current_app
from sqlalchemy import or_
from models import Brand, Cor, Design, SKU, Tamanho, Tipo
from services.catalog_service import resolve_design, get_or_create_sku
from services.sanitize import escape_like
from services.auth_service import check_auth_roles, CATALOG_WRITE_ROLES
from . import catalogs_bp

def get_session():
    return current_app.db_session

def require_write():
    if request.method == 'GET':
        return None
    return check_auth_roles(CATALOG_WRITE_ROLES)

# ---------------------------------------------------------
# BRANDS (/api/brands)
# ---------------------------------------------------------
@catalogs_bp.route('/api/brands', methods=['GET', 'POST'])
def handle_brands():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        brands = session.query(Brand).all()
        return jsonify([b.to_dict() for b in brands])

    elif request.method == 'POST':
        data = request.get_json() or {}
        name = data.get('name', '').strip()
        slug = data.get('slug', '').strip().upper()
        domain = data.get('domain', '').strip() or None

        if not name or not slug:
            return jsonify({'error': 'Nome e Slug são obrigatórios'}), 400

        existing = session.query(Brand).filter(or_(Brand.slug == slug, Brand.name == name)).first()
        if existing:
            return jsonify({'error': f"Marca com nome '{name}' ou slug '{slug}' já existe"}), 400

        new_brand = Brand(name=name, slug=slug, domain=domain)
        session.add(new_brand)
        session.commit()
        return jsonify(new_brand.to_dict()), 201


@catalogs_bp.route('/api/brands/<int:brand_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_brand_detail(brand_id):
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    brand = session.get(Brand, brand_id)
    if not brand:
        return jsonify({'error': 'Marca não encontrada'}), 404

    if request.method == 'GET':
        return jsonify(brand.to_dict())

    elif request.method == 'PUT':
        data = request.get_json() or {}
        if 'name' in data:
            brand.name = data['name'].strip()
        if 'slug' in data:
            new_slug = data['slug'].strip().upper()
            existing = session.query(Brand).filter(Brand.slug == new_slug, Brand.id != brand_id).first()
            if existing:
                return jsonify({'error': f"Slug '{new_slug}' já está em uso"}), 400
            brand.slug = new_slug
        if 'domain' in data:
            brand.domain = data['domain'].strip() or None

        session.commit()
        return jsonify(brand.to_dict())

    elif request.method == 'DELETE':
        session.delete(brand)
        session.commit()
        return jsonify({'message': 'Marca excluída com sucesso'})


# ---------------------------------------------------------
# CORES (/api/cores)
# ---------------------------------------------------------
@catalogs_bp.route('/api/cores', methods=['GET', 'POST'])
def handle_cores():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        cores = session.query(Cor).all()
        return jsonify([c.to_dict() for c in cores])

    elif request.method == 'POST':
        data = request.get_json() or {}
        cor_code = data.get('cor', '').strip().upper()
        nome = data.get('nome', '').strip() or cor_code

        if not cor_code:
            return jsonify({'error': 'Código da cor é obrigatório'}), 400

        existing = session.query(Cor).filter_by(cor=cor_code).first()
        if existing:
            return jsonify({'error': f"Cor '{cor_code}' já cadastrada"}), 400

        new_cor = Cor(cor=cor_code, nome=nome)
        session.add(new_cor)
        session.commit()
        return jsonify(new_cor.to_dict()), 201


@catalogs_bp.route('/api/cores/<int:cor_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_cor_detail(cor_id):
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    cor_obj = session.get(Cor, cor_id)
    if not cor_obj:
        return jsonify({'error': 'Cor não encontrada'}), 404

    if request.method == 'GET':
        return jsonify(cor_obj.to_dict())

    elif request.method == 'PUT':
        data = request.get_json() or {}
        if 'nome' in data:
            cor_obj.nome = data['nome'].strip()
        session.commit()
        return jsonify(cor_obj.to_dict())

    elif request.method == 'DELETE':
        session.delete(cor_obj)
        session.commit()
        return jsonify({'message': 'Cor excluída com sucesso'})


# ---------------------------------------------------------
# DESIGNS (/api/designs)
# ---------------------------------------------------------
@catalogs_bp.route('/api/designs', methods=['GET', 'POST'])
def handle_designs():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        designs = session.query(Design).all()
        return jsonify([d.to_dict() for d in designs])

    elif request.method == 'POST':
        data = request.get_json() or {}
        cod = str(data.get('codigo_estampa') or data.get('Cod_Estampa', '')).strip()
        nome = str(data.get('nome_design', '')).strip()

        try:
            design = resolve_design(session, cod, nome)
            session.commit()
            return jsonify(design.to_dict()), 201
        except ValueError as e:
            return jsonify({'error': str(e)}), 400


@catalogs_bp.route('/api/designs/<int:design_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_design_detail(design_id):
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    design = session.get(Design, design_id)
    if not design:
        return jsonify({'error': 'Design não encontrado'}), 404

    if request.method == 'GET':
        return jsonify(design.to_dict())

    elif request.method == 'PUT':
        data = request.get_json() or {}
        cod = str(data.get('codigo_estampa') or design.codigo_estampa).strip()
        nome = str(data.get('nome_design') or design.nome_design).strip()

        # Check collision on codigo_estampa with other designs
        if cod != design.codigo_estampa:
            existing_cod = session.query(Design).filter(Design.codigo_estampa == cod, Design.id != design_id).first()
            if existing_cod:
                return jsonify({'error': f"Cód. Estampa '{cod}' já em uso pelo design '{existing_cod.nome_design}'"}), 400
            design.codigo_estampa = cod

        # Check collision on nome_design with other designs
        if nome.lower() != design.nome_design.lower():
            existing_nome = session.query(Design).filter(Design.nome_design.ilike(escape_like(nome)), Design.id != design_id).first()
            if existing_nome:
                return jsonify({'error': f"Design '{nome}' já cadastrado com Cód. Estampa '{existing_nome.codigo_estampa}'"}), 400
            design.nome_design = nome

        session.commit()
        return jsonify(design.to_dict())

    elif request.method == 'DELETE':
        session.delete(design)
        session.commit()
        return jsonify({'message': 'Design excluído com sucesso'})


# ---------------------------------------------------------
# SKUS, TAMANHOS, TIPOS (/api/skus, /api/tamanhos, /api/tipos)
# ---------------------------------------------------------
@catalogs_bp.route('/api/skus', methods=['GET', 'POST'])
def handle_skus():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        skus = session.query(SKU).all()
        return jsonify([s.to_dict() for s in skus])
    elif request.method == 'POST':
        data = request.get_json() or {}
        sku_val = data.get('sku', '').strip().upper()
        if not sku_val:
            return jsonify({'error': 'SKU é obrigatório'}), 400
        existing = session.query(SKU).filter_by(sku=sku_val).first()
        if existing:
            return jsonify(existing.to_dict()), 200
        new_sku = SKU(sku=sku_val)
        session.add(new_sku)
        session.commit()
        return jsonify(new_sku.to_dict()), 201


@catalogs_bp.route('/api/tamanhos', methods=['GET', 'POST'])
def handle_tamanhos():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        tams = session.query(Tamanho).all()
        return jsonify([t.to_dict() for t in tams])
    elif request.method == 'POST':
        data = request.get_json() or {}
        tam_val = data.get('tamanho', '').strip().upper()
        if not tam_val:
            return jsonify({'error': 'Tamanho é obrigatório'}), 400
        existing = session.query(Tamanho).filter_by(tamanho=tam_val).first()
        if existing:
            return jsonify({'error': f"Tamanho '{tam_val}' já existe"}), 400
        new_tam = Tamanho(tamanho=tam_val)
        session.add(new_tam)
        session.commit()
        return jsonify(new_tam.to_dict()), 201


@catalogs_bp.route('/api/tipos', methods=['GET', 'POST'])
def handle_tipos():
    session = get_session()
    denied = require_write()
    if denied:
        return denied

    if request.method == 'GET':
        tipos = session.query(Tipo).all()
        return jsonify([t.to_dict() for t in tipos])
    elif request.method == 'POST':
        data = request.get_json() or {}
        cod = data.get('codigo', '').strip().upper()
        nome = data.get('nome', '').strip()
        if not cod or not nome:
            return jsonify({'error': 'Código e Nome do tipo são obrigatórios'}), 400
        existing = session.query(Tipo).filter_by(codigo=cod).first()
        if existing:
            return jsonify({'error': f"Tipo '{cod}' já cadastrado"}), 400
        new_tipo = Tipo(codigo=cod, nome=nome)
        session.add(new_tipo)
        session.commit()
        return jsonify(new_tipo.to_dict()), 201

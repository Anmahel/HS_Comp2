import re
import os
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine, func, or_, and_, desc
from sqlalchemy.orm import scoped_session, sessionmaker

from config import config_by_name
from database import Base, db_session
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa, MovimentacaoEstoque
from seed import seed_database

def create_app(config_name='development'):
    app = Flask(__name__)
    config_class = config_by_name.get(config_name, config_by_name['default'])
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    db_uri = app.config['SQLALCHEMY_DATABASE_URI']
    if db_uri.startswith('sqlite'):
        from sqlalchemy.pool import StaticPool
        engine = create_engine(
            db_uri,
            connect_args={'check_same_thread': False},
            poolclass=StaticPool
        )
    else:
        engine = create_engine(db_uri)

    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    app.db_session = scoped_session(session_factory)

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        app.db_session.remove()

    def get_session():
        return app.db_session

    # ---------------------------------------------------------
    # Helper: Ensure / Get Design with Name-Code Validation
    # ---------------------------------------------------------
    def resolve_design(session, codigo_estampa, nome_design):
        codigo_estampa = str(codigo_estampa).strip()
        nome_design = str(nome_design).strip() if nome_design else ''

        if not codigo_estampa:
            raise ValueError("O código da estampa é obrigatório.")

        # Check if nome_design is registered with a DIFFERENT code
        if nome_design:
            existing_by_name = session.query(Design).filter(
                func.lower(Design.nome_design) == func.lower(nome_design),
                Design.codigo_estampa != codigo_estampa
            ).first()
            if existing_by_name:
                raise ValueError(
                    f"O nome '{nome_design}' já está cadastrado no sistema com o Cód. Estampa {existing_by_name.codigo_estampa}. Por favor, escolha outro nome ou use o código correto."
                )

        # Check if design with this code exists
        existing_by_code = session.query(Design).filter_by(codigo_estampa=codigo_estampa).first()
        if existing_by_code:
            if nome_design and existing_by_code.nome_design.lower() != nome_design.lower():
                # If name was provided and doesn't match, verify if conflict or update
                existing_conflict = session.query(Design).filter(
                    func.lower(Design.nome_design) == func.lower(nome_design),
                    Design.codigo_estampa != codigo_estampa
                ).first()
                if existing_conflict:
                    raise ValueError(
                        f"O nome '{nome_design}' já está cadastrado no sistema com o Cód. Estampa {existing_conflict.codigo_estampa}. Por favor, escolha outro nome ou use o código correto."
                    )
            return existing_by_code
        else:
            if not nome_design:
                nome_design = f"Design {codigo_estampa}"
            new_design = Design(nome_design=nome_design, codigo_estampa=codigo_estampa)
            session.add(new_design)
            session.flush()
            return new_design

    def get_or_create_sku(session, sku_code):
        sku_code = str(sku_code).strip()
        sku_obj = session.query(SKU).filter_by(sku=sku_code).first()
        if not sku_obj:
            sku_obj = SKU(sku=sku_code)
            session.add(sku_obj)
            session.flush()
        return sku_obj

    # ---------------------------------------------------------
    # Catalog Endpoints (CRUD)
    # ---------------------------------------------------------
    @app.route('/api/brands', methods=['GET', 'POST'])
    def handle_brands():
        session = get_session()
        if request.method == 'GET':
            brands = session.query(Brand).order_by(Brand.name).all()
            return jsonify([b.to_dict() for b in brands])
        elif request.method == 'POST':
            data = request.get_json() or {}
            name = data.get('name', '').strip()
            slug = data.get('slug', '').strip().upper()
            domain = data.get('domain', '').strip()
            if not name or not slug:
                return jsonify({'error': 'Nome e slug são obrigatórios'}), 400
            existing = session.query(Brand).filter_by(slug=slug).first()
            if existing:
                return jsonify({'error': f"Marca com slug '{slug}' já existe"}), 400
            brand = Brand(name=name, slug=slug, domain=domain)
            session.add(brand)
            session.commit()
            return jsonify(brand.to_dict()), 201

    @app.route('/api/brands/<int:brand_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_brand_detail(brand_id):
        session = get_session()
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
                brand.slug = data['slug'].strip().upper()
            if 'domain' in data:
                brand.domain = data['domain'].strip()
            session.commit()
            return jsonify(brand.to_dict())
        elif request.method == 'DELETE':
            session.delete(brand)
            session.commit()
            return jsonify({'message': 'Marca excluída com sucesso'})

    @app.route('/api/cores', methods=['GET', 'POST'])
    def handle_cores():
        session = get_session()
        if request.method == 'GET':
            cores = session.query(Cor).order_by(Cor.cor).all()
            return jsonify([c.to_dict() for c in cores])
        elif request.method == 'POST':
            data = request.get_json() or {}
            cor_code = data.get('cor', '').strip().upper()
            nome = data.get('nome', '').strip() or cor_code
            if not cor_code:
                return jsonify({'error': 'Código da cor é obrigatório'}), 400
            existing = session.query(Cor).filter_by(cor=cor_code).first()
            if existing:
                return jsonify({'error': f"Cor '{cor_code}' já existe"}), 400
            cor = Cor(cor=cor_code, nome=nome)
            session.add(cor)
            session.commit()
            return jsonify(cor.to_dict()), 201

    @app.route('/api/cores/<int:cor_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_cor_detail(cor_id):
        session = get_session()
        cor = session.get(Cor, cor_id)
        if not cor:
            return jsonify({'error': 'Cor não encontrada'}), 404
        if request.method == 'GET':
            return jsonify(cor.to_dict())
        elif request.method == 'PUT':
            data = request.get_json() or {}
            if 'cor' in data:
                cor.cor = data['cor'].strip().upper()
            if 'nome' in data:
                cor.nome = data['nome'].strip()
            session.commit()
            return jsonify(cor.to_dict())
        elif request.method == 'DELETE':
            session.delete(cor)
            session.commit()
            return jsonify({'message': 'Cor excluída com sucesso'})

    @app.route('/api/designs', methods=['GET', 'POST'])
    def handle_designs():
        session = get_session()
        if request.method == 'GET':
            designs = session.query(Design).order_by(Design.codigo_estampa).all()
            return jsonify([d.to_dict() for d in designs])
        elif request.method == 'POST':
            data = request.get_json() or {}
            codigo = str(data.get('codigo_estampa') or data.get('Cod_Estampa') or '').strip()
            nome = str(data.get('nome_design') or '').strip()
            if not codigo or not nome:
                return jsonify({'error': 'Código da estampa e nome do design são obrigatórios'}), 400
            try:
                design = resolve_design(session, codigo, nome)
                session.commit()
                return jsonify(design.to_dict()), 201
            except ValueError as e:
                return jsonify({'error': str(e)}), 400

    @app.route('/api/designs/<int:design_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_design_detail(design_id):
        session = get_session()
        design = session.get(Design, design_id)
        if not design:
            return jsonify({'error': 'Design não encontrado'}), 404
        if request.method == 'GET':
            return jsonify(design.to_dict())
        elif request.method == 'PUT':
            data = request.get_json() or {}
            nome = str(data.get('nome_design', '')).strip()
            codigo = str(data.get('codigo_estampa', '')).strip()
            if nome:
                conflict = session.query(Design).filter(
                    func.lower(Design.nome_design) == func.lower(nome),
                    Design.id != design.id
                ).first()
                if conflict:
                    return jsonify({
                        'error': f"O nome '{nome}' já está cadastrado no sistema com o Cód. Estampa {conflict.codigo_estampa}. Por favor, escolha outro nome ou use o código correto."
                    }), 400
                design.nome_design = nome
            if codigo:
                design.codigo_estampa = codigo
            session.commit()
            return jsonify(design.to_dict())
        elif request.method == 'DELETE':
            session.delete(design)
            session.commit()
            return jsonify({'message': 'Design excluído com sucesso'})

    @app.route('/api/skus', methods=['GET', 'POST'])
    def handle_skus():
        session = get_session()
        if request.method == 'GET':
            skus = session.query(SKU).order_by(SKU.sku).all()
            return jsonify([s.to_dict() for s in skus])
        elif request.method == 'POST':
            data = request.get_json() or {}
            sku_str = str(data.get('sku', '')).strip()
            if not sku_str:
                return jsonify({'error': 'SKU é obrigatório'}), 400
            existing = session.query(SKU).filter_by(sku=sku_str).first()
            if existing:
                return jsonify({'error': f"SKU '{sku_str}' já existe"}), 400
            sku_obj = SKU(sku=sku_str)
            session.add(sku_obj)
            session.commit()
            return jsonify(sku_obj.to_dict()), 201

    @app.route('/api/tamanhos', methods=['GET', 'POST'])
    def handle_tamanhos():
        session = get_session()
        if request.method == 'GET':
            tamanhos = session.query(Tamanho).all()
            # Custom ordering if standard sizes
            order = {'P': 1, 'M': 2, 'G': 3, 'GG': 4, 'G1': 5, 'G2': 6, 'G3': 7, 'G4': 8}
            sorted_t = sorted(tamanhos, key=lambda t: order.get(t.tamanho, 99))
            return jsonify([t.to_dict() for t in sorted_t])
        elif request.method == 'POST':
            data = request.get_json() or {}
            tam_str = str(data.get('tamanho', '')).strip().upper()
            if not tam_str:
                return jsonify({'error': 'Tamanho é obrigatório'}), 400
            existing = session.query(Tamanho).filter_by(tamanho=tam_str).first()
            if existing:
                return jsonify({'error': f"Tamanho '{tam_str}' já existe"}), 400
            tam_obj = Tamanho(tamanho=tam_str)
            session.add(tam_obj)
            session.commit()
            return jsonify(tam_obj.to_dict()), 201

    @app.route('/api/tipos', methods=['GET', 'POST'])
    def handle_tipos():
        session = get_session()
        if request.method == 'GET':
            tipos = session.query(Tipo).order_by(Tipo.codigo).all()
            return jsonify([t.to_dict() for t in tipos])
        elif request.method == 'POST':
            data = request.get_json() or {}
            codigo = str(data.get('codigo', '')).strip().upper()
            nome = str(data.get('nome', '')).strip()
            if not codigo or not nome:
                return jsonify({'error': 'Código e nome são obrigatórios'}), 400
            existing = session.query(Tipo).filter_by(codigo=codigo).first()
            if existing:
                return jsonify({'error': f"Tipo com código '{codigo}' já existe"}), 400
            tipo = Tipo(codigo=codigo, nome=nome)
            session.add(tipo)
            session.commit()
            return jsonify(tipo.to_dict()), 201

    # ---------------------------------------------------------
    # Inventory: Peças Prontas (GET, POST, PUT, DELETE)
    # ---------------------------------------------------------
    @app.route('/api/pecas-prontas', methods=['GET', 'POST'])
    def handle_pecas_prontas():
        session = get_session()
        if request.method == 'GET':
            query = session.query(PecaPronta)

            # Query params
            include_zero = request.args.get('include_zero', 'false').lower() in ['true', '1', 'yes']
            if not include_zero:
                query = query.filter(PecaPronta.quantidade > 0)

            brand_id = request.args.get('brand_id', type=int)
            if brand_id:
                query = query.filter(PecaPronta.brand_id == brand_id)

            tipo_id = request.args.get('tipo_id', type=int)
            if tipo_id:
                query = query.filter(PecaPronta.tipo_id == tipo_id)

            cor_id = request.args.get('cor_id', type=int)
            if cor_id:
                query = query.filter(PecaPronta.cor_id == cor_id)

            tamanho_id = request.args.get('tamanho_id', type=int)
            if tamanho_id:
                query = query.filter(PecaPronta.tamanho_id == tamanho_id)

            search_term = request.args.get('q', '').strip()
            if search_term:
                query = query.join(PecaPronta.design).join(PecaPronta.sku).filter(
                    or_(
                        Design.nome_design.ilike(f"%{search_term}%"),
                        Design.codigo_estampa.ilike(f"%{search_term}%"),
                        SKU.sku.ilike(f"%{search_term}%")
                    )
                )

            total = query.count()
            page = request.args.get('page', type=int)
            per_page = request.args.get('per_page', type=int)

            if page and per_page:
                items = query.order_by(desc(PecaPronta.updated_at)).offset((page - 1) * per_page).limit(per_page).all()
                pages = (total + per_page - 1) // per_page
                return jsonify({
                    'items': [item.to_dict() for item in items],
                    'total': total,
                    'page': page,
                    'pages': pages,
                    'per_page': per_page
                })
            else:
                items = query.order_by(desc(PecaPronta.updated_at)).all()
                return jsonify([item.to_dict() for item in items])

        elif request.method == 'POST':
            data = request.get_json() or {}
            try:
                # Extract fields
                brand_id = int(data.get('brand_id'))
                tipo_id = int(data.get('tipo_id'))
                cor_id = int(data.get('cor_id'))
                tamanho_id = int(data.get('tamanho_id'))
                quantidade = int(data.get('quantidade', 0))

                if quantidade < 0:
                    return jsonify({'error': 'Quantidade não pode ser negativa'}), 400

                # Validate design
                codigo_estampa = str(data.get('codigo_estampa') or data.get('Cod_Estampa') or '').strip()
                nome_design = str(data.get('nome_design', '')).strip()

                design = resolve_design(session, codigo_estampa, nome_design)

                brand = session.get(Brand, brand_id)
                tipo = session.get(Tipo, tipo_id)
                cor = session.get(Cor, cor_id)
                tamanho = session.get(Tamanho, tamanho_id)

                if not all([brand, tipo, cor, tamanho, design]):
                    return jsonify({'error': 'Dados relacionais inválidos'}), 400

                # Generate or fetch SKU
                sku_str = f"{brand.slug}-{tipo.codigo}-{design.codigo_estampa}-{cor.cor}-{tamanho.tamanho}"
                sku_obj = get_or_create_sku(session, sku_str)

                # Strict UPSERT rule: Check if existing item exists
                existing = session.query(PecaPronta).filter_by(
                    brand_id=brand_id,
                    tipo_id=tipo_id,
                    design_id=design.id,
                    cor_id=cor_id,
                    tamanho_id=tamanho_id
                ).first()

                if existing:
                    qtd_ant = existing.quantidade
                    existing.quantidade += quantidade
                    session.flush()

                    mov = MovimentacaoEstoque(
                        categoria='peca',
                        item_id=existing.id,
                        tipo_movimento='ENTRADA',
                        quantidade=quantidade,
                        quantidade_anterior=qtd_ant,
                        quantidade_nova=existing.quantidade,
                        observacao=f"Incremento via cadastro de peça pronta ({sku_str})"
                    )
                    session.add(mov)
                    session.commit()
                    return jsonify({
                        'message': 'Estoque incrementado com sucesso (UPSERT)',
                        'item': existing.to_dict(),
                        'action': 'updated'
                    }), 200
                else:
                    new_item = PecaPronta(
                        brand_id=brand_id,
                        tipo_id=tipo_id,
                        design_id=design.id,
                        cor_id=cor_id,
                        tamanho_id=tamanho_id,
                        sku_id=sku_obj.id,
                        quantidade=quantidade
                    )
                    session.add(new_item)
                    session.flush()

                    mov = MovimentacaoEstoque(
                        categoria='peca',
                        item_id=new_item.id,
                        tipo_movimento='ENTRADA',
                        quantidade=quantidade,
                        quantidade_anterior=0,
                        quantidade_nova=quantidade,
                        observacao=f"Novo cadastro de peça pronta ({sku_str})"
                    )
                    session.add(mov)
                    session.commit()
                    return jsonify({
                        'message': 'Peça pronta cadastrada com sucesso',
                        'item': new_item.to_dict(),
                        'action': 'created'
                    }), 201

            except ValueError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                session.rollback()
                return jsonify({'error': f"Erro ao processar: {str(e)}"}), 400

    @app.route('/api/pecas-prontas/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_peca_pronta_detail(item_id):
        session = get_session()
        item = session.get(PecaPronta, item_id)
        if not item:
            return jsonify({'error': 'Peça pronta não encontrada'}), 404

        if request.method == 'GET':
            return jsonify(item.to_dict())

        elif request.method == 'PUT':
            data = request.get_json() or {}

            # Brand Modification Guard
            if 'brand_id' in data and int(data['brand_id']) != item.brand_id:
                return jsonify({
                    'error': 'A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste.'
                }), 400

            try:
                qtd_ant = item.quantidade
                if 'quantidade' in data:
                    nova_qtd = int(data['quantidade'])
                    if nova_qtd < 0:
                        return jsonify({'error': 'Quantidade não pode ser negativa'}), 400
                    if nova_qtd != qtd_ant:
                        item.quantidade = nova_qtd
                        mov = MovimentacaoEstoque(
                            categoria='peca',
                            item_id=item.id,
                            tipo_movimento='AJUSTE',
                            quantidade=nova_qtd - qtd_ant,
                            quantidade_anterior=qtd_ant,
                            quantidade_nova=nova_qtd,
                            observacao='Ajuste manual de estoque via edição'
                        )
                        session.add(mov)

                if 'tipo_id' in data:
                    item.tipo_id = int(data['tipo_id'])
                if 'cor_id' in data:
                    item.cor_id = int(data['cor_id'])
                if 'tamanho_id' in data:
                    item.tamanho_id = int(data['tamanho_id'])

                # If design changed
                if 'codigo_estampa' in data or 'nome_design' in data:
                    cod = str(data.get('codigo_estampa') or item.design.codigo_estampa).strip()
                    nome = str(data.get('nome_design') or item.design.nome_design).strip()
                    design = resolve_design(session, cod, nome)
                    item.design_id = design.id

                # Update SKU
                brand = session.get(Brand, item.brand_id)
                tipo = session.get(Tipo, item.tipo_id)
                cor = session.get(Cor, item.cor_id)
                tamanho = session.get(Tamanho, item.tamanho_id)
                design = session.get(Design, item.design_id)

                sku_str = f"{brand.slug}-{tipo.codigo}-{design.codigo_estampa}-{cor.cor}-{tamanho.tamanho}"
                sku_obj = get_or_create_sku(session, sku_str)
                item.sku_id = sku_obj.id

                item.updated_at = datetime.now(timezone.utc)
                session.commit()
                return jsonify(item.to_dict())

            except ValueError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                session.rollback()
                return jsonify({'error': str(e)}), 400

        elif request.method == 'DELETE':
            try:
                qtd_ant = item.quantidade
                session.delete(item)
                mov = MovimentacaoEstoque(
                    categoria='peca',
                    item_id=item_id,
                    tipo_movimento='AJUSTE',
                    quantidade=-qtd_ant,
                    quantidade_anterior=qtd_ant,
                    quantidade_nova=0,
                    observacao='Item excluído do sistema'
                )
                session.add(mov)
                session.commit()
                return jsonify({'message': 'Peça pronta excluída com sucesso'})
            except Exception as e:
                session.rollback()
                return jsonify({'error': str(e)}), 400

    # ---------------------------------------------------------
    # Inventory: Estampas Avulsas (GET, POST, PUT, DELETE)
    # ---------------------------------------------------------
    @app.route('/api/estampas', methods=['GET', 'POST'])
    def handle_estampas():
        session = get_session()
        if request.method == 'GET':
            query = session.query(Estampa)

            include_zero = request.args.get('include_zero', 'false').lower() in ['true', '1', 'yes']
            if not include_zero:
                query = query.filter(Estampa.quantidade > 0)

            brand_id = request.args.get('brand_id', type=int)
            if brand_id:
                query = query.filter(Estampa.brand_id == brand_id)

            cor_id = request.args.get('cor_id', type=int)
            if cor_id:
                query = query.filter(Estampa.cor_id == cor_id)

            search_term = request.args.get('q', '').strip()
            if search_term:
                query = query.join(Estampa.design).filter(
                    or_(
                        Design.nome_design.ilike(f"%{search_term}%"),
                        Design.codigo_estampa.ilike(f"%{search_term}%"),
                        Estampa.codigo_estampa.ilike(f"%{search_term}%")
                    )
                )

            total = query.count()
            page = request.args.get('page', type=int)
            per_page = request.args.get('per_page', type=int)

            if page and per_page:
                items = query.order_by(desc(Estampa.updated_at)).offset((page - 1) * per_page).limit(per_page).all()
                pages = (total + per_page - 1) // per_page
                return jsonify({
                    'items': [item.to_dict() for item in items],
                    'total': total,
                    'page': page,
                    'pages': pages,
                    'per_page': per_page
                })
            else:
                items = query.order_by(desc(Estampa.updated_at)).all()
                return jsonify([item.to_dict() for item in items])

        elif request.method == 'POST':
            data = request.get_json() or {}
            try:
                brand_id = int(data.get('brand_id'))
                cor_id = int(data.get('cor_id'))
                quantidade = int(data.get('quantidade', 0))

                if quantidade < 0:
                    return jsonify({'error': 'Quantidade não pode ser negativa'}), 400

                codigo_estampa = str(data.get('codigo_estampa') or data.get('Cod_Estampa') or '').strip()
                nome_design = str(data.get('nome_design', '')).strip()

                design = resolve_design(session, codigo_estampa, nome_design)
                brand = session.get(Brand, brand_id)
                cor = session.get(Cor, cor_id)

                if not all([brand, cor, design]):
                    return jsonify({'error': 'Dados relacionais inválidos'}), 400

                sku_str = f"{brand.slug}-EST-{design.codigo_estampa}-{cor.cor}"
                sku_obj = get_or_create_sku(session, sku_str)

                # Strict UPSERT rule
                existing = session.query(Estampa).filter_by(
                    brand_id=brand_id,
                    design_id=design.id,
                    cor_id=cor_id
                ).first()

                if existing:
                    qtd_ant = existing.quantidade
                    existing.quantidade += quantidade
                    session.flush()

                    mov = MovimentacaoEstoque(
                        categoria='estampa',
                        item_id=existing.id,
                        tipo_movimento='ENTRADA',
                        quantidade=quantidade,
                        quantidade_anterior=qtd_ant,
                        quantidade_nova=existing.quantidade,
                        observacao=f"Incremento via cadastro de estampa ({sku_str})"
                    )
                    session.add(mov)
                    session.commit()
                    return jsonify({
                        'message': 'Estoque de estampa incrementado com sucesso (UPSERT)',
                        'item': existing.to_dict(),
                        'action': 'updated'
                    }), 200
                else:
                    new_item = Estampa(
                        brand_id=brand_id,
                        design_id=design.id,
                        cor_id=cor_id,
                        codigo_estampa=design.codigo_estampa,
                        sku_id=sku_obj.id,
                        quantidade=quantidade
                    )
                    session.add(new_item)
                    session.flush()

                    mov = MovimentacaoEstoque(
                        categoria='estampa',
                        item_id=new_item.id,
                        tipo_movimento='ENTRADA',
                        quantidade=quantidade,
                        quantidade_anterior=0,
                        quantidade_nova=quantidade,
                        observacao=f"Novo cadastro de estampa ({sku_str})"
                    )
                    session.add(mov)
                    session.commit()
                    return jsonify({
                        'message': 'Estampa cadastrada com sucesso',
                        'item': new_item.to_dict(),
                        'action': 'created'
                    }), 201

            except ValueError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                session.rollback()
                return jsonify({'error': f"Erro ao processar: {str(e)}"}), 400

    @app.route('/api/estampas/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
    def handle_estampa_detail(item_id):
        session = get_session()
        item = session.get(Estampa, item_id)
        if not item:
            return jsonify({'error': 'Estampa não encontrada'}), 404

        if request.method == 'GET':
            return jsonify(item.to_dict())

        elif request.method == 'PUT':
            data = request.get_json() or {}

            # Brand Modification Guard
            if 'brand_id' in data and int(data['brand_id']) != item.brand_id:
                return jsonify({
                    'error': 'A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste.'
                }), 400

            try:
                qtd_ant = item.quantidade
                if 'quantidade' in data:
                    nova_qtd = int(data['quantidade'])
                    if nova_qtd < 0:
                        return jsonify({'error': 'Quantidade não pode ser negativa'}), 400
                    if nova_qtd != qtd_ant:
                        item.quantidade = nova_qtd
                        mov = MovimentacaoEstoque(
                            categoria='estampa',
                            item_id=item.id,
                            tipo_movimento='AJUSTE',
                            quantidade=nova_qtd - qtd_ant,
                            quantidade_anterior=qtd_ant,
                            quantidade_nova=nova_qtd,
                            observacao='Ajuste manual de estoque de estampa'
                        )
                        session.add(mov)

                if 'cor_id' in data:
                    item.cor_id = int(data['cor_id'])

                if 'codigo_estampa' in data or 'nome_design' in data:
                    cod = str(data.get('codigo_estampa') or item.codigo_estampa or item.design.codigo_estampa).strip()
                    nome = str(data.get('nome_design') or item.design.nome_design).strip()
                    design = resolve_design(session, cod, nome)
                    item.design_id = design.id
                    item.codigo_estampa = design.codigo_estampa

                brand = session.get(Brand, item.brand_id)
                cor = session.get(Cor, item.cor_id)
                sku_str = f"{brand.slug}-EST-{item.codigo_estampa}-{cor.cor}"
                sku_obj = get_or_create_sku(session, sku_str)
                item.sku_id = sku_obj.id

                item.updated_at = datetime.now(timezone.utc)
                session.commit()
                return jsonify(item.to_dict())

            except ValueError as e:
                return jsonify({'error': str(e)}), 400
            except Exception as e:
                session.rollback()
                return jsonify({'error': str(e)}), 400

        elif request.method == 'DELETE':
            try:
                qtd_ant = item.quantidade
                session.delete(item)
                mov = MovimentacaoEstoque(
                    categoria='estampa',
                    item_id=item_id,
                    tipo_movimento='AJUSTE',
                    quantidade=-qtd_ant,
                    quantidade_anterior=qtd_ant,
                    quantidade_nova=0,
                    observacao='Estampa excluída do sistema'
                )
                session.add(mov)
                session.commit()
                return jsonify({'message': 'Estampa excluída com sucesso'})
            except Exception as e:
                session.rollback()
                return jsonify({'error': str(e)}), 400

    import threading
    stock_lock = threading.Lock()

    # ---------------------------------------------------------
    # Concurrency-Safe Stock Deduction: POST /api/usar-estoque
    # ---------------------------------------------------------
    @app.route('/api/usar-estoque', methods=['POST'])
    def usar_estoque():
        session = get_session()
        data = request.get_json() or {}
        categoria = data.get('categoria') # 'peca' or 'estampa'
        item_id = data.get('id') or data.get('item_id')
        quantidade = data.get('quantidade')

        if not categoria or categoria not in ['peca', 'estampa']:
            return jsonify({'error': "Categoria deve ser 'peca' ou 'estampa'"}), 400
        if not item_id:
            return jsonify({'error': 'ID do item é obrigatório'}), 400
        try:
            quantidade = int(quantidade)
            if quantidade <= 0:
                return jsonify({'error': 'Quantidade para dar baixa deve ser maior que zero'}), 400
        except (TypeError, ValueError):
            return jsonify({'error': 'Quantidade inválida'}), 400

        with stock_lock:
            try:
                # Query using row-level lock (.with_for_update())
                if categoria == 'peca':
                    query = session.query(PecaPronta).filter(PecaPronta.id == item_id)
                    try:
                        query = query.with_for_update()
                    except Exception:
                        pass
                    item = query.first()
                else:
                    query = session.query(Estampa).filter(Estampa.id == item_id)
                    try:
                        query = query.with_for_update()
                    except Exception:
                        pass
                    item = query.first()

                if not item:
                    return jsonify({'error': f"Item de {categoria} não encontrado"}), 404

                if item.quantidade < quantidade:
                    return jsonify({
                        'error': f"Estoque insuficiente. Disponível: {item.quantidade}, solicitado: {quantidade}"
                    }), 400

                qtd_anterior = item.quantidade
                item.quantidade -= quantidade
                item.updated_at = datetime.now(timezone.utc)
                session.flush()

                # Record audit trail with tipo_movimento = 'SAIDA'
                mov = MovimentacaoEstoque(
                    categoria=categoria,
                    item_id=item.id,
                    tipo_movimento='SAIDA',
                    quantidade=quantidade,
                    quantidade_anterior=qtd_anterior,
                    quantidade_nova=item.quantidade,
                    observacao=f"Baixa / Saída de estoque ({categoria})"
                )
                session.add(mov)
                session.commit()

                return jsonify({
                    'success': True,
                    'message': f"Baixa de {quantidade} unidade(s) realizada com sucesso",
                    'item': item.to_dict(),
                    'movimentacao': mov.to_dict()
                }), 200

            except Exception as e:
                session.rollback()
                return jsonify({'error': f"Erro ao processar baixa de estoque: {str(e)}"}), 500

    # ---------------------------------------------------------
    # Search & Availability Verifier: GET /api/verificar-disponibilidade
    # ---------------------------------------------------------
    @app.route('/api/verificar-disponibilidade', methods=['GET'])
    def verificar_disponibilidade():
        session = get_session()
        sku_input = request.args.get('sku', '').strip()
        brand_prefix = request.args.get('brand_prefix', '').strip().upper()
        cor_filter = request.args.get('cor', '').strip().upper()
        tipo_filter = request.args.get('tipo', '').strip().upper()

        if not sku_input and not (brand_prefix or cor_filter or tipo_filter):
            return jsonify({'error': 'Parâmetros de busca não fornecidos'}), 400

        # Regex extraction for merged combinations like "001M", "001 M", "006 G1", "006G1"
        # Standard pattern: [Brand]-[Tipo]-[DesignCode]-[Cor]-[Size]
        code_extracted = None
        size_extracted = None

        if sku_input:
            # Check pattern like "001M", "001 M", "006G1", "006 G1"
            m_merged = re.search(r'(\d+)\s*([A-Za-z0-9]+)', sku_input)
            if m_merged:
                potential_code = m_merged.group(1)
                potential_size = m_merged.group(2).upper()
                if potential_size in ['P', 'M', 'G', 'GG', 'G1', 'G2', 'G3', 'G4']:
                    code_extracted = potential_code
                    size_extracted = potential_size

        # Query Peças Prontas
        pecas_query = session.query(PecaPronta)
        estampas_query = session.query(Estampa)

        if brand_prefix:
            brand_obj = session.query(Brand).filter(
                or_(Brand.slug == brand_prefix, Brand.name.ilike(f"%{brand_prefix}%"))
            ).first()
            if brand_obj:
                pecas_query = pecas_query.filter(PecaPronta.brand_id == brand_obj.id)
                estampas_query = estampas_query.filter(Estampa.brand_id == brand_obj.id)

        if cor_filter:
            cor_obj = session.query(Cor).filter(
                or_(Cor.cor == cor_filter, Cor.nome.ilike(f"%{cor_filter}%"))
            ).first()
            if cor_obj:
                pecas_query = pecas_query.filter(PecaPronta.cor_id == cor_obj.id)
                estampas_query = estampas_query.filter(Estampa.cor_id == cor_obj.id)

        if tipo_filter:
            tipo_obj = session.query(Tipo).filter(
                or_(Tipo.codigo == tipo_filter, Tipo.nome.ilike(f"%{tipo_filter}%"))
            ).first()
            if tipo_obj:
                pecas_query = pecas_query.filter(PecaPronta.tipo_id == tipo_obj.id)

        if code_extracted:
            # Search by extracted design code
            pecas_query = pecas_query.join(PecaPronta.design).filter(
                Design.codigo_estampa == code_extracted
            )
            if size_extracted:
                pecas_query = pecas_query.join(PecaPronta.tamanho).filter(
                    Tamanho.tamanho == size_extracted
                )
            estampas_query = estampas_query.join(Estampa.design).filter(
                Design.codigo_estampa == code_extracted
            )
        elif sku_input:
            # Flexible text search
            pecas_query = pecas_query.join(PecaPronta.design).join(PecaPronta.sku).filter(
                or_(
                    SKU.sku.ilike(f"%{sku_input}%"),
                    Design.nome_design.ilike(f"%{sku_input}%"),
                    Design.codigo_estampa == sku_input
                )
            )
            estampas_query = estampas_query.join(Estampa.design).filter(
                or_(
                    Design.nome_design.ilike(f"%{sku_input}%"),
                    Design.codigo_estampa == sku_input,
                    Estampa.codigo_estampa == sku_input
                )
            )

        pecas = pecas_query.all()
        estampas = estampas_query.all()

        total_pecas = sum(p.quantidade for p in pecas)
        total_estampas = sum(e.quantidade for e in estampas)

        # Determine overall status
        if total_pecas > 0:
            status = 'EM_ESTOQUE'
            status_label = 'Em Estoque'
            status_description = f'{total_pecas} peça(s) pronta(s) disponível(is)'
        elif total_estampas > 0:
            status = 'ESTAMPAR'
            status_label = 'Estampar'
            status_description = f'Sem peças prontas, mas possui {total_estampas} estampa(s) disponível(is) para aplicação'
        else:
            status = 'SEM_ESTOQUE'
            status_label = 'Sem Estoque'
            status_description = 'Não há peças prontas nem estampas avulsas disponíveis'

        return jsonify({
            'status': status,
            'status_label': status_label,
            'status_description': status_description,
            'total_pecas': total_pecas,
            'total_estampas': total_estampas,
            'extracted': {
                'code': code_extracted,
                'size': size_extracted
            },
            'pecas_prontas': [p.to_dict() for p in pecas],
            'estampas': [e.to_dict() for e in estampas]
        })

    # ---------------------------------------------------------
    # Analytics & Audit: GET /api/movimentacoes & GET /api/dashboard/stats
    # ---------------------------------------------------------
    @app.route('/api/movimentacoes', methods=['GET'])
    def get_movimentacoes():
        session = get_session()
        query = session.query(MovimentacaoEstoque)

        categoria = request.args.get('categoria')
        if categoria:
            query = query.filter(MovimentacaoEstoque.categoria == categoria)

        tipo_movimento = request.args.get('tipo_movimento')
        if tipo_movimento:
            query = query.filter(MovimentacaoEstoque.tipo_movimento == tipo_movimento)

        limit = request.args.get('limit', default=100, type=int)
        movs = query.order_by(desc(MovimentacaoEstoque.data_hora)).limit(limit).all()

        return jsonify([m.to_dict() for m in movs])

    @app.route('/api/dashboard/stats', methods=['GET'])
    def get_dashboard_stats():
        session = get_session()

        # Total counts
        total_pecas_qty = session.query(func.coalesce(func.sum(PecaPronta.quantidade), 0)).scalar()
        total_estampas_qty = session.query(func.coalesce(func.sum(Estampa.quantidade), 0)).scalar()

        # Brands Breakdown
        brands = session.query(Brand).all()
        brand_stats = []
        for b in brands:
            pecas_brand = session.query(func.coalesce(func.sum(PecaPronta.quantidade), 0)).filter(
                PecaPronta.brand_id == b.id
            ).scalar()
            estampas_brand = session.query(func.coalesce(func.sum(Estampa.quantidade), 0)).filter(
                Estampa.brand_id == b.id
            ).scalar()
            brand_stats.append({
                'brand_id': b.id,
                'name': b.name,
                'slug': b.slug,
                'pecas_quantidade': pecas_brand,
                'estampas_quantidade': estampas_brand,
                'total': pecas_brand + estampas_brand
            })

        # Top 5 Designs by volume
        designs = session.query(Design).all()
        design_volumes = []
        for d in designs:
            p_qty = session.query(func.coalesce(func.sum(PecaPronta.quantidade), 0)).filter(
                PecaPronta.design_id == d.id
            ).scalar()
            e_qty = session.query(func.coalesce(func.sum(Estampa.quantidade), 0)).filter(
                Estampa.design_id == d.id
            ).scalar()
            total_design = p_qty + e_qty
            if total_design > 0:
                design_volumes.append({
                    'design_id': d.id,
                    'nome_design': d.nome_design,
                    'codigo_estampa': d.codigo_estampa,
                    'pecas_quantidade': p_qty,
                    'estampas_quantidade': e_qty,
                    'total_quantidade': total_design
                })

        design_volumes.sort(key=lambda x: x['total_quantidade'], reverse=True)
        top_5_designs = design_volumes[:5]

        # Critical Stock Items (quantidade < 5)
        critical_pecas = session.query(PecaPronta).filter(
            PecaPronta.quantidade < 5
        ).order_by(PecaPronta.quantidade.asc()).all()

        critical_estampas = session.query(Estampa).filter(
            Estampa.quantidade < 5
        ).order_by(Estampa.quantidade.asc()).all()

        critical_items = []
        for p in critical_pecas:
            critical_items.append({
                'tipo_item': 'peca',
                **p.to_dict()
            })
        for e in critical_estampas:
            critical_items.append({
                'tipo_item': 'estampa',
                **e.to_dict()
            })

        critical_items.sort(key=lambda x: x['quantidade'])

        return jsonify({
            'total_pecas_quantidade': total_pecas_qty,
            'total_estampas_quantidade': total_estampas_qty,
            'total_geral_itens': total_pecas_qty + total_estampas_qty,
            'total_criticos': len(critical_items),
            'brand_stats': brand_stats,
            'top_designs': top_5_designs,
            'critical_items': critical_items
        })

    # Seed route for development/demo convenience
    @app.route('/api/seed', methods=['POST'])
    def trigger_seed():
        session = get_session()
        try:
            seed_database(session)
            return jsonify({'message': 'Banco de dados populado com sucesso!'}), 200
        except Exception as e:
            return jsonify({'error': str(e)}), 500

    return app

if __name__ == '__main__':
    app = create_app('development')
    # Auto-seed on first run if database is empty
    with app.app_context():
        session = app.db_session
        if session.query(Brand).count() == 0:
            seed_database(session)
    app.run(host='0.0.0.0', port=5000, debug=True)

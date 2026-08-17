import threading
import re
from flask import request, jsonify, current_app
from sqlalchemy import or_
from models import Brand, Cor, Design, SKU, Tamanho, Tipo, PecaPronta, Estampa, MovimentacaoEstoque
from services.catalog_service import resolve_design, get_or_create_sku
from . import inventory_bp

stock_lock = threading.Lock()

def get_session():
    return current_app.db_session

# ---------------------------------------------------------
# PEÇAS PRONTAS (/api/pecas-prontas)
# ---------------------------------------------------------
@inventory_bp.route('/api/pecas-prontas', methods=['GET', 'POST'])
def handle_pecas_prontas():
    session = get_session()
    if request.method == 'GET':
        query = session.query(PecaPronta)

        include_zero = request.args.get('include_zero', 'false').lower() in ['true', '1', 'yes']
        if not include_zero:
            query = query.filter(PecaPronta.quantidade > 0)

        brand_id = request.args.get('brand_id', type=int)
        if brand_id:
            query = query.filter(PecaPronta.brand_id == brand_id)

        cor_id = request.args.get('cor_id', type=int)
        if cor_id:
            query = query.filter(PecaPronta.cor_id == cor_id)

        tamanho_id = request.args.get('tamanho_id', type=int)
        if tamanho_id:
            query = query.filter(PecaPronta.tamanho_id == tamanho_id)

        tipo_id = request.args.get('tipo_id', type=int)
        if tipo_id:
            query = query.filter(PecaPronta.tipo_id == tipo_id)

        design_id = request.args.get('design_id', type=int)
        if design_id:
            query = query.filter(PecaPronta.design_id == design_id)

        q = request.args.get('q', '').strip()
        if q:
            query = query.join(PecaPronta.design).join(PecaPronta.brand).join(PecaPronta.cor).join(PecaPronta.tamanho).join(PecaPronta.tipo)
            query = query.filter(
                or_(
                    Design.nome_design.ilike(f"%{q}%"),
                    Design.codigo_estampa.ilike(f"%{q}%"),
                    Brand.name.ilike(f"%{q}%"),
                    Brand.slug.ilike(f"%{q}%"),
                    Cor.cor.ilike(f"%{q}%"),
                    Cor.nome.ilike(f"%{q}%"),
                    Tamanho.tamanho.ilike(f"%{q}%"),
                    Tipo.codigo.ilike(f"%{q}%")
                )
            )

        page = request.args.get('page', type=int)
        per_page = request.args.get('per_page', 50, type=int)

        if page:
            total = query.count()
            items = query.offset((page - 1) * per_page).limit(per_page).all()
            return jsonify({
                'items': [item.to_dict() for item in items],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            })

        items = query.all()
        return jsonify([item.to_dict() for item in items])

    elif request.method == 'POST':
        data = request.get_json() or {}
        brand_id = data.get('brand_id')
        tipo_id = data.get('tipo_id')
        cor_id = data.get('cor_id')
        tamanho_id = data.get('tamanho_id')
        qtd = data.get('quantidade', 1)

        cod_estampa = data.get('codigo_estampa') or data.get('Cod_Estampa')
        nome_design = data.get('nome_design')
        design_id = data.get('design_id')

        if not all([brand_id, tipo_id, cor_id, tamanho_id]):
            return jsonify({'error': 'brand_id, tipo_id, cor_id e tamanho_id são obrigatórios'}), 400

        try:
            qtd = int(qtd)
            if qtd < 0:
                return jsonify({'error': 'A quantidade inicial não pode ser negativa'}), 400
        except ValueError:
            return jsonify({'error': 'Quantidade inválida'}), 400

        brand = session.get(Brand, brand_id)
        tipo = session.get(Tipo, tipo_id)
        cor = session.get(Cor, cor_id)
        tamanho = session.get(Tamanho, tamanho_id)

        if not all([brand, tipo, cor, tamanho]):
            return jsonify({'error': 'Uma ou mais entidades relacionadas não foram encontradas'}), 400

        try:
            if design_id:
                design = session.get(Design, design_id)
                if not design:
                    return jsonify({'error': 'Design não encontrado'}), 404
            else:
                if not cod_estampa or not nome_design:
                    return jsonify({'error': 'codigo_estampa e nome_design são obrigatórios'}), 400
                design = resolve_design(session, cod_estampa, nome_design)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        sku_str = f"{brand.slug}-{tipo.codigo}-{design.codigo_estampa}-{cor.cor}-{tamanho.tamanho}"
        sku_obj = get_or_create_sku(session, sku_str)

        existing_item = session.query(PecaPronta).filter_by(
            brand_id=brand_id,
            tipo_id=tipo_id,
            design_id=design.id,
            cor_id=cor_id,
            tamanho_id=tamanho_id
        ).first()

        if existing_item:
            qtd_anterior = existing_item.quantidade
            existing_item.quantidade += qtd
            existing_item.sku_id = sku_obj.id

            mov = MovimentacaoEstoque(
                categoria='peca',
                item_id=existing_item.id,
                tipo_movimento='ENTRADA',
                quantidade=qtd,
                quantidade_anterior=qtd_anterior,
                quantidade_nova=existing_item.quantidade,
                observacao=f"Estoque adicionado via cadastro/upsert ({qtd} un)"
            )
            session.add(mov)
            session.commit()
            return jsonify({
                'action': 'updated',
                'item': existing_item.to_dict(),
                'message': f"Item existente encontrado. Quantidade incrementada de {qtd_anterior} para {existing_item.quantidade}."
            }), 200

        new_item = PecaPronta(
            brand_id=brand_id,
            tipo_id=tipo_id,
            design_id=design.id,
            cor_id=cor_id,
            tamanho_id=tamanho_id,
            sku_id=sku_obj.id,
            quantidade=qtd
        )
        session.add(new_item)
        session.flush()

        mov = MovimentacaoEstoque(
            categoria='peca',
            item_id=new_item.id,
            tipo_movimento='ENTRADA',
            quantidade=qtd,
            quantidade_anterior=0,
            quantidade_nova=qtd,
            observacao=f"Novo item cadastrado com {qtd} un"
        )
        session.add(mov)
        session.commit()
        return jsonify({
            'action': 'created',
            'item': new_item.to_dict(),
            'message': 'Nova peça pronta cadastrada com sucesso.'
        }), 201


@inventory_bp.route('/api/pecas-prontas/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_peca_pronta_detail(item_id):
    session = get_session()
    item = session.get(PecaPronta, item_id)
    if not item:
        return jsonify({'error': 'Peça pronta não encontrada'}), 404

    if request.method == 'GET':
        return jsonify(item.to_dict())

    elif request.method == 'PUT':
        data = request.get_json() or {}
        if 'brand_id' in data and data['brand_id'] != item.brand_id:
            return jsonify({
                'error': 'A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste.'
            }), 400

        qtd_antiga = item.quantidade

        if 'tipo_id' in data:
            item.tipo_id = data['tipo_id']
        if 'cor_id' in data:
            item.cor_id = data['cor_id']
        if 'tamanho_id' in data:
            item.tamanho_id = data['tamanho_id']
        if 'design_id' in data:
            item.design_id = data['design_id']

        if 'quantidade' in data:
            try:
                nova_qtd = int(data['quantidade'])
                if nova_qtd < 0:
                    return jsonify({'error': 'Quantidade não pode ser negativa'}), 400
                item.quantidade = nova_qtd
            except ValueError:
                return jsonify({'error': 'Quantidade inválida'}), 400

        # Refresh SKU relationship
        if item.brand and item.tipo and item.design and item.cor and item.tamanho:
            sku_str = f"{item.brand.slug}-{item.tipo.codigo}-{item.design.codigo_estampa}-{item.cor.cor}-{item.tamanho.tamanho}"
            sku_obj = get_or_create_sku(session, sku_str)
            item.sku_id = sku_obj.id

        if item.quantidade != qtd_antiga:
            diff = item.quantidade - qtd_antiga
            mov = MovimentacaoEstoque(
                categoria='peca',
                item_id=item_id,
                tipo_movimento='AJUSTE',
                quantidade=diff,
                quantidade_anterior=qtd_antiga,
                quantidade_nova=item.quantidade,
                observacao=f"Ajuste manual de estoque ({qtd_antiga} -> {item.quantidade})"
            )
            session.add(mov)

        session.commit()
        return jsonify(item.to_dict())

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
                observacao='Peça pronta excluída do sistema'
            )
            session.add(mov)
            session.commit()
            return jsonify({'message': 'Peça pronta excluída com sucesso'})
        except Exception as e:
            session.rollback()
            return jsonify({'error': str(e)}), 400


# ---------------------------------------------------------
# ESTAMPAS AVULSAS (/api/estampas)
# ---------------------------------------------------------
@inventory_bp.route('/api/estampas', methods=['GET', 'POST'])
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

        design_id = request.args.get('design_id', type=int)
        if design_id:
            query = query.filter(Estampa.design_id == design_id)

        q = request.args.get('q', '').strip()
        if q:
            query = query.join(Estampa.design).join(Estampa.brand).join(Estampa.cor)
            query = query.filter(
                or_(
                    Design.nome_design.ilike(f"%{q}%"),
                    Design.codigo_estampa.ilike(f"%{q}%"),
                    Brand.name.ilike(f"%{q}%"),
                    Brand.slug.ilike(f"%{q}%"),
                    Cor.cor.ilike(f"%{q}%"),
                    Cor.nome.ilike(f"%{q}%")
                )
            )

        page = request.args.get('page', type=int)
        per_page = request.args.get('per_page', 50, type=int)

        if page:
            total = query.count()
            items = query.offset((page - 1) * per_page).limit(per_page).all()
            return jsonify({
                'items': [item.to_dict() for item in items],
                'total': total,
                'page': page,
                'per_page': per_page,
                'pages': (total + per_page - 1) // per_page
            })

        items = query.all()
        return jsonify([item.to_dict() for item in items])

    elif request.method == 'POST':
        data = request.get_json() or {}
        brand_id = data.get('brand_id')
        cor_id = data.get('cor_id')
        qtd = data.get('quantidade', 1)

        cod_estampa = data.get('codigo_estampa') or data.get('Cod_Estampa')
        nome_design = data.get('nome_design')
        design_id = data.get('design_id')

        if not brand_id or not cor_id:
            return jsonify({'error': 'brand_id e cor_id são obrigatórios'}), 400

        try:
            qtd = int(qtd)
            if qtd < 0:
                return jsonify({'error': 'A quantidade inicial não pode ser negativa'}), 400
        except ValueError:
            return jsonify({'error': 'Quantidade inválida'}), 400

        brand = session.get(Brand, brand_id)
        cor = session.get(Cor, cor_id)

        if not brand or not cor:
            return jsonify({'error': 'Marca ou Cor não encontradas'}), 400

        try:
            if design_id:
                design = session.get(Design, design_id)
                if not design:
                    return jsonify({'error': 'Design não encontrado'}), 404
            else:
                if not cod_estampa:
                    return jsonify({'error': 'codigo_estampa é obrigatório'}), 400
                if not nome_design:
                    nome_design = f"Design {cod_estampa}"
                design = resolve_design(session, cod_estampa, nome_design)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        sku_str = f"{brand.slug}-EST-{design.codigo_estampa}-{cor.cor}"
        sku_obj = get_or_create_sku(session, sku_str)

        existing_item = session.query(Estampa).filter_by(
            brand_id=brand_id,
            design_id=design.id,
            cor_id=cor_id
        ).first()

        if existing_item:
            qtd_anterior = existing_item.quantidade
            existing_item.quantidade += qtd
            existing_item.sku_id = sku_obj.id

            mov = MovimentacaoEstoque(
                categoria='estampa',
                item_id=existing_item.id,
                tipo_movimento='ENTRADA',
                quantidade=qtd,
                quantidade_anterior=qtd_anterior,
                quantidade_nova=existing_item.quantidade,
                observacao=f"Estoque adicionado via cadastro/upsert ({qtd} un)"
            )
            session.add(mov)
            session.commit()
            return jsonify({
                'action': 'updated',
                'item': existing_item.to_dict(),
                'message': f"Estampa existente encontrada. Quantidade incrementada de {qtd_anterior} para {existing_item.quantidade}."
            }), 200

        new_item = Estampa(
            brand_id=brand_id,
            design_id=design.id,
            cor_id=cor_id,
            codigo_estampa=design.codigo_estampa,
            sku_id=sku_obj.id,
            quantidade=qtd
        )
        session.add(new_item)
        session.flush()

        mov = MovimentacaoEstoque(
            categoria='estampa',
            item_id=new_item.id,
            tipo_movimento='ENTRADA',
            quantidade=qtd,
            quantidade_anterior=0,
            quantidade_nova=qtd,
            observacao=f"Nova estampa cadastrada com {qtd} un"
        )
        session.add(mov)
        session.commit()
        return jsonify({
            'action': 'created',
            'item': new_item.to_dict(),
            'message': 'Nova estampa avulsa cadastrada com sucesso.'
        }), 201


@inventory_bp.route('/api/estampas/<int:item_id>', methods=['GET', 'PUT', 'DELETE'])
def handle_estampa_detail(item_id):
    session = get_session()
    item = session.get(Estampa, item_id)
    if not item:
        return jsonify({'error': 'Estampa não encontrada'}), 404

    if request.method == 'GET':
        return jsonify(item.to_dict())

    elif request.method == 'PUT':
        data = request.get_json() or {}
        if 'brand_id' in data and data['brand_id'] != item.brand_id:
            return jsonify({
                'error': 'A marca não pode ser alterada em um item já cadastrado. Para transferir estoque, crie um novo registro ou faça um ajuste.'
            }), 400

        qtd_antiga = item.quantidade

        if 'cor_id' in data:
            item.cor_id = data['cor_id']
        if 'design_id' in data:
            item.design_id = data['design_id']

        if 'quantidade' in data:
            try:
                nova_qtd = int(data['quantidade'])
                if nova_qtd < 0:
                    return jsonify({'error': 'Quantidade não pode ser negativa'}), 400
                item.quantidade = nova_qtd
            except ValueError:
                return jsonify({'error': 'Quantidade inválida'}), 400

        if item.brand and item.design and item.cor:
            sku_str = f"{item.brand.slug}-EST-{item.design.codigo_estampa}-{item.cor.cor}"
            sku_obj = get_or_create_sku(session, sku_str)
            item.sku_id = sku_obj.id

        if item.quantidade != qtd_antiga:
            diff = item.quantidade - qtd_antiga
            mov = MovimentacaoEstoque(
                categoria='estampa',
                item_id=item_id,
                tipo_movimento='AJUSTE',
                quantidade=diff,
                quantidade_anterior=qtd_antiga,
                quantidade_nova=item.quantidade,
                observacao=f"Ajuste manual de estoque ({qtd_antiga} -> {item.quantidade})"
            )
            session.add(mov)

        session.commit()
        return jsonify(item.to_dict())

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


# ---------------------------------------------------------
# ATOMIC STOCK DEDUCTION (/api/usar-estoque)
# ---------------------------------------------------------
@inventory_bp.route('/api/usar-estoque', methods=['POST'])
def handle_usar_estoque():
    session = get_session()
    data = request.get_json() or {}
    categoria = data.get('categoria')  # 'peca' or 'estampa'
    item_id = data.get('id')
    quantidade_a_usar = data.get('quantidade', 1)
    motivo = data.get('motivo', 'Saída / Uso de estoque')

    if categoria not in ['peca', 'estampa']:
        return jsonify({'error': "Categoria inválida. Deve ser 'peca' ou 'estampa'"}), 400

    try:
        quantidade_a_usar = int(quantidade_a_usar)
        if quantidade_a_usar <= 0:
            return jsonify({'error': 'A quantidade a usar deve ser maior que zero'}), 400
    except ValueError:
        return jsonify({'error': 'Quantidade inválida'}), 400

    with stock_lock:
        session.expire_all()
        try:
            if categoria == 'peca':
                item = session.get(PecaPronta, item_id)
            else:
                item = session.get(Estampa, item_id)

            if not item:
                return jsonify({'error': f"Item de {categoria} com ID {item_id} não encontrado"}), 404

            if item.quantidade < quantidade_a_usar:
                return jsonify({
                    'error': f"Estoque insuficiente. Disponível: {item.quantidade}, Solicitado: {quantidade_a_usar}",
                    'disponivel': item.quantidade,
                    'solicitado': quantidade_a_usar
                }), 400

            qtd_anterior = item.quantidade
            item.quantidade -= quantidade_a_usar
            qtd_nova = item.quantidade

            mov = MovimentacaoEstoque(
                categoria=categoria,
                item_id=item.id,
                tipo_movimento='SAIDA',
                quantidade=quantidade_a_usar,
                quantidade_anterior=qtd_anterior,
                quantidade_nova=qtd_nova,
                observacao=motivo
            )
            session.add(mov)
            session.commit()

            return jsonify({
                'success': True,
                'message': f"{quantidade_a_usar} unidade(s) baixada(s) com sucesso.",
                'item': item.to_dict(),
                'movimentacao': mov.to_dict()
            }), 200

        except Exception as e:
            session.rollback()
            return jsonify({'error': f"Erro ao processar baixa de estoque: {str(e)}"}), 500


# ---------------------------------------------------------
# AVAILABILITY VERIFIER (/api/verificar-disponibilidade)
# ---------------------------------------------------------
@inventory_bp.route('/api/verificar-disponibilidade', methods=['GET'])
def verificar_disponibilidade():
    session = get_session()
    raw_query = request.args.get('sku', '').strip()
    brand_prefix = request.args.get('brand_prefix', '').strip().upper()
    query_cor = request.args.get('cor', '').strip().upper()
    query_tipo = request.args.get('tipo', '').strip().upper()

    if not raw_query and not brand_prefix and not query_cor and not query_tipo:
        return jsonify({
            'status': 'SEM_ESTOQUE',
            'status_label': 'Sem Termo',
            'status_description': 'Nenhum termo ou filtro de busca fornecido',
            'extracted': {},
            'pecas_prontas': [],
            'estampas': [],
            'total_pecas': 0,
            'total_estampas': 0,
            'message': 'Nenhum termo de busca fornecido'
        })

    # Pattern 1: Exact structured SKU -> CR-CM-001-PRE-M
    exact_pattern = r'^([A-Z]{2,4})-([A-Z]{2,4})-(\d{3,4})-([A-Z]{3,4})-([A-Z0-9]+)$'
    match_exact = re.match(exact_pattern, raw_query.upper()) if raw_query else None

    # Pattern 2: Merged code + size -> "001M", "001-M", "001 M", "006G1"
    merged_pattern = r'(\d{3,4})\s*[-_]?\s*([A-Z0-9]{1,3})'
    match_merged = re.search(merged_pattern, raw_query.upper()) if raw_query else None

    extracted_code = None
    extracted_size = None
    extracted_brand = brand_prefix or None
    extracted_cor = query_cor or None
    extracted_tipo = query_tipo or None

    if match_exact:
        extracted_brand = match_exact.group(1)
        extracted_tipo = match_exact.group(2)
        extracted_code = match_exact.group(3)
        extracted_cor = match_exact.group(4)
        extracted_size = match_exact.group(5)
    elif match_merged:
        extracted_code = match_merged.group(1)
        extracted_size = match_merged.group(2)
    elif raw_query:
        # Fallback: extract standalone 3-4 digit code
        code_match = re.search(r'\b(\d{3,4})\b', raw_query)
        if code_match:
            extracted_code = code_match.group(1)

    # Query Peças Prontas
    pecas_query = session.query(PecaPronta).filter(PecaPronta.quantidade > 0)
    if extracted_code:
        pecas_query = pecas_query.join(PecaPronta.design).filter(Design.codigo_estampa == extracted_code)
    elif raw_query:
        pecas_query = pecas_query.join(PecaPronta.design).outerjoin(PecaPronta.sku).filter(
            or_(
                Design.nome_design.ilike(f"%{raw_query}%"),
                Design.codigo_estampa.ilike(f"%{raw_query}%"),
                SKU.sku.ilike(f"%{raw_query}%")
            )
        )

    if extracted_size:
        pecas_query = pecas_query.join(PecaPronta.tamanho).filter(Tamanho.tamanho == extracted_size)
    if extracted_brand:
        pecas_query = pecas_query.join(PecaPronta.brand).filter(Brand.slug == extracted_brand)
    if extracted_cor:
        pecas_query = pecas_query.join(PecaPronta.cor).filter(Cor.cor == extracted_cor)
    if extracted_tipo:
        pecas_query = pecas_query.join(PecaPronta.tipo).filter(Tipo.codigo == extracted_tipo)

    pecas_encontradas = pecas_query.all()
    total_pecas = sum(p.quantidade for p in pecas_encontradas)

    # Query Estampas
    estampas_query = session.query(Estampa).filter(Estampa.quantidade > 0)
    if extracted_code:
        estampas_query = estampas_query.join(Estampa.design).filter(Design.codigo_estampa == extracted_code)
    elif raw_query:
        estampas_query = estampas_query.join(Estampa.design).outerjoin(Estampa.sku).filter(
            or_(
                Design.nome_design.ilike(f"%{raw_query}%"),
                Design.codigo_estampa.ilike(f"%{raw_query}%"),
                SKU.sku.ilike(f"%{raw_query}%")
            )
        )

    if extracted_brand:
        estampas_query = estampas_query.join(Estampa.brand).filter(Brand.slug == extracted_brand)
    if extracted_cor:
        estampas_query = estampas_query.join(Estampa.cor).filter(Cor.cor == extracted_cor)

    estampas_encontradas = estampas_query.all()
    total_estampas = sum(e.quantidade for e in estampas_encontradas)

    # Determine availability status and descriptions
    if total_pecas > 0:
        status = 'EM_ESTOQUE'
        status_label = 'Pronta Entrega'
        status_description = f'{total_pecas} peça(s) pronta(s) em estoque disponível(is).'
    elif total_estampas > 0:
        status = 'ESTAMPAR'
        status_label = 'Necessita Estampar'
        status_description = f'Sem peças prontas. {total_estampas} estampa(s) avulsa(s) pronta(s) para estampar.'
    else:
        status = 'SEM_ESTOQUE'
        status_label = 'Sem Estoque'
        status_description = 'Nenhuma peça pronta ou estampa avulsa disponível para os filtros selecionados.'

    return jsonify({
        'status': status,
        'status_label': status_label,
        'status_description': status_description,
        'query': raw_query,
        'extracted': {
            'code': extracted_code,
            'size': extracted_size,
            'brand': extracted_brand,
            'cor': extracted_cor,
            'tipo': extracted_tipo
        },
        'total_pecas': total_pecas,
        'total_estampas': total_estampas,
        'pecas_prontas': [p.to_dict() for p in pecas_encontradas],
        'estampas': [e.to_dict() for e in estampas_encontradas]
    })

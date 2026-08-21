from flask import request, jsonify, current_app
from sqlalchemy import func
from models import Brand, Design, PecaPronta, Estampa, MovimentacaoEstoque
from services.auth_service import require_any_auth
from . import analytics_bp

def get_session():
    return current_app.db_session

# ---------------------------------------------------------
# MOVIMENTAÇÕES DE ESTOQUE (/api/movimentacoes)
# ---------------------------------------------------------
@analytics_bp.route('/api/movimentacoes', methods=['GET'])
@require_any_auth
def get_movimentacoes():
    session = get_session()
    query = session.query(MovimentacaoEstoque).order_by(MovimentacaoEstoque.data_hora.desc())

    categoria = request.args.get('categoria')
    if categoria:
        query = query.filter(MovimentacaoEstoque.categoria == categoria)

    tipo_movimento = request.args.get('tipo_movimento')
    if tipo_movimento:
        query = query.filter(MovimentacaoEstoque.tipo_movimento == tipo_movimento)

    raw_limit = request.args.get('limit', 100, type=int)
    limit = min(max(1, raw_limit if raw_limit is not None else 100), 500)
    movs = query.limit(limit).all()
    return jsonify([m.to_dict() for m in movs])


# ---------------------------------------------------------
# DASHBOARD STATS (/api/dashboard/stats)
# ---------------------------------------------------------
@analytics_bp.route('/api/dashboard/stats', methods=['GET'])
@require_any_auth
def get_dashboard_stats():
    session = get_session()

    brand_param = request.args.get('brand')
    brand_filter_id = None
    if brand_param and brand_param.lower() != 'all':
        if brand_param.isdigit():
            brand_filter_id = int(brand_param)
        else:
            found_b = session.query(Brand).filter(func.lower(Brand.slug) == brand_param.lower()).first()
            if not found_b:
                found_b = session.query(Brand).filter(func.lower(Brand.name) == brand_param.lower()).first()
            if found_b:
                brand_filter_id = found_b.id

    # Base Queries
    pecas_query = session.query(func.sum(PecaPronta.quantidade))
    estampas_query = session.query(func.sum(Estampa.quantidade))
    crit_pecas_query = session.query(PecaPronta).filter(PecaPronta.quantidade > 0, PecaPronta.quantidade <= 5)
    crit_estampas_query = session.query(Estampa).filter(Estampa.quantidade > 0, Estampa.quantidade <= 5)

    if brand_filter_id:
        pecas_query = pecas_query.filter(PecaPronta.brand_id == brand_filter_id)
        estampas_query = estampas_query.filter(Estampa.brand_id == brand_filter_id)
        crit_pecas_query = crit_pecas_query.filter(PecaPronta.brand_id == brand_filter_id)
        crit_estampas_query = crit_estampas_query.filter(Estampa.brand_id == brand_filter_id)

    total_pecas = pecas_query.scalar() or 0
    total_estampas = estampas_query.scalar() or 0
    pecas_criticas = crit_pecas_query.count()
    estampas_criticas = crit_estampas_query.count()
    total_geral = total_pecas + total_estampas
    total_criticos = pecas_criticas + estampas_criticas

    # Brand stats breakdown
    brands = session.query(Brand).all()
    brand_stats = []
    for b in brands:
        pecas_brand = session.query(func.sum(PecaPronta.quantidade)).filter(PecaPronta.brand_id == b.id).scalar() or 0
        estampas_brand = session.query(func.sum(Estampa.quantidade)).filter(Estampa.brand_id == b.id).scalar() or 0
        tot_b = pecas_brand + estampas_brand
        brand_stats.append({
            'brand_id': b.id,
            'name': b.name,
            'slug': b.slug,
            'pecas_count': pecas_brand,
            'pecas_quantidade': pecas_brand,
            'estampas_count': estampas_brand,
            'estampas_quantidade': estampas_brand,
            'total': tot_b,
            'total_quantidade': tot_b
        })

    # Top designs combining Peças and Estampas
    designs = session.query(Design).all()
    designs_aggregated = []
    for d in designs:
        p_q = session.query(func.sum(PecaPronta.quantidade)).filter(PecaPronta.design_id == d.id)
        e_q = session.query(func.sum(Estampa.quantidade)).filter(Estampa.design_id == d.id)
        if brand_filter_id:
            p_q = p_q.filter(PecaPronta.brand_id == brand_filter_id)
            e_q = e_q.filter(Estampa.brand_id == brand_filter_id)

        p_qty = p_q.scalar() or 0
        e_qty = e_q.scalar() or 0
        tot_d = p_qty + e_qty
        if tot_d > 0:
            designs_aggregated.append({
                'design_id': d.id,
                'nome_design': d.nome_design or f"#{d.codigo_estampa}",
                'codigo_estampa': d.codigo_estampa,
                'total_pecas': p_qty,
                'total_estampas': e_qty,
                'total_quantidade': tot_d
            })

    designs_aggregated.sort(key=lambda x: x['total_quantidade'], reverse=True)
    top_designs = designs_aggregated[:5]

    # Critical alert items
    crit_pecas = crit_pecas_query.limit(10).all()
    crit_estampas = crit_estampas_query.limit(10).all()

    critical_items = []
    for p in crit_pecas:
        d = p.to_dict()
        d['categoria'] = 'peca'
        d['tipo_item'] = 'peca'
        critical_items.append(d)
    for e in crit_estampas:
        d = e.to_dict()
        d['categoria'] = 'estampa'
        d['tipo_item'] = 'estampa'
        critical_items.append(d)

    return jsonify({
        'total_pecas_quantidade': total_pecas,
        'total_estampas_quantidade': total_estampas,
        'total_geral_itens': total_geral,
        'pecas_criticas': pecas_criticas,
        'estampas_criticas': estampas_criticas,
        'total_criticos': total_criticos,
        'brand_stats': brand_stats,
        'top_designs': top_designs,
        'critical_items': critical_items
    })


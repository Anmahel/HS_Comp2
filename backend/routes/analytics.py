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

    total_pecas = session.query(func.sum(PecaPronta.quantidade)).scalar() or 0
    total_estampas = session.query(func.sum(Estampa.quantidade)).scalar() or 0
    pecas_criticas = session.query(PecaPronta).filter(PecaPronta.quantidade > 0, PecaPronta.quantidade <= 5).count()
    estampas_criticas = session.query(Estampa).filter(Estampa.quantidade > 0, Estampa.quantidade <= 5).count()

    # Brand stats breakdown
    brands = session.query(Brand).all()
    brand_stats = []
    for b in brands:
        pecas_brand = session.query(func.sum(PecaPronta.quantidade)).filter(PecaPronta.brand_id == b.id).scalar() or 0
        estampas_brand = session.query(func.sum(Estampa.quantidade)).filter(Estampa.brand_id == b.id).scalar() or 0
        brand_stats.append({
            'brand_id': b.id,
            'name': b.name,
            'slug': b.slug,
            'pecas_count': pecas_brand,
            'estampas_count': estampas_brand,
            'total': pecas_brand + estampas_brand
        })

    # Top designs
    top_pecas = session.query(
        Design.nome_design,
        Design.codigo_estampa,
        func.sum(PecaPronta.quantidade).label('total_pecas')
    ).join(PecaPronta.design).group_by(Design.id).order_by(func.sum(PecaPronta.quantidade).desc()).limit(5).all()

    top_designs = [
        {
            'nome_design': t[0],
            'codigo_estampa': t[1],
            'total_pecas': t[2]
        }
        for t in top_pecas
    ]

    # Critical alert items
    crit_pecas = session.query(PecaPronta).filter(PecaPronta.quantidade > 0, PecaPronta.quantidade <= 5).limit(10).all()
    crit_estampas = session.query(Estampa).filter(Estampa.quantidade > 0, Estampa.quantidade <= 5).limit(10).all()

    critical_items = []
    for p in crit_pecas:
        d = p.to_dict()
        d['categoria'] = 'peca'
        critical_items.append(d)
    for e in crit_estampas:
        d = e.to_dict()
        d['categoria'] = 'estampa'
        critical_items.append(d)

    return jsonify({
        'total_pecas_quantidade': total_pecas,
        'total_estampas_quantidade': total_estampas,
        'pecas_criticas': pecas_criticas,
        'estampas_criticas': estampas_criticas,
        'total_criticos': pecas_criticas + estampas_criticas,
        'brand_stats': brand_stats,
        'top_designs': top_designs,
        'critical_items': critical_items
    })

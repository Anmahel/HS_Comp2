import io
import urllib.parse
from flask import request, jsonify, current_app, send_file
from models import LotePedido, ItemPedido, PecaPronta, Estampa, MovimentacaoEstoque
from services.parser_service import parse_order_file, parse_sku_details
from services.pdf_service import generate_imprenta_pdf, generate_separacao_pdf
from services.auth_service import require_roles, get_current_user_context, ORDER_PROCESS_ROLES
from . import orders_bp

def get_session():
    return current_app.db_session

# ---------------------------------------------------------
# PREVIEW SIMULATION (/api/pedidos/previa)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/previa', methods=['POST'])
def simular_previa_pedidos():
    session = get_session()
    items_raw = []

    if 'file' in request.files:
        uploaded_file = request.files['file']
        file_bytes = uploaded_file.read()
        filename = uploaded_file.filename
        try:
            items_raw = parse_order_file(file_bytes, filename)
        except Exception as e:
            return jsonify({'error': f"Erro ao analisar arquivo: {str(e)}"}), 400
    else:
        data = request.get_json() or {}
        items_raw = data.get('items', [])

    if not items_raw:
        return jsonify({'error': 'Nenhum item válido encontrado para simulação'}), 400

    previa = []
    totais = {
        'total_itens': 0,
        'total_descontado_pecas': 0,
        'total_descontado_estampas': 0,
        'total_necessita_impressao': 0,
        'pecas_disponiveis': 0,
        'estampas_disponiveis': 0,
        'necessita_impressao': 0
    }

    virtual_pecas = {}
    virtual_estampas = {}

    for raw in items_raw:
        sku_str = raw.get('sku_original', '')
        qtd_solicitada = int(raw.get('quantidade', 1))
        parsed = parse_sku_details(sku_str) or {}

        cod_estampa = parsed.get('codigo_estampa')
        cor_cod = parsed.get('cor_codigo') or parsed.get('cor')
        tam = parsed.get('tamanho')
        tipo_cod = parsed.get('tipo_codigo') or parsed.get('tipo')

        desconto_peca = 0
        desconto_estampa = 0
        precisa_imprimir = 0

        # Step 1: Check Peças Prontas stock
        pecas_query = session.query(PecaPronta).join(PecaPronta.design)
        if cod_estampa:
            pecas_query = pecas_query.filter(PecaPronta.design.has(codigo_estampa=cod_estampa))
        if cor_cod:
            pecas_query = pecas_query.filter(PecaPronta.cor.has(cor=cor_cod))
        if tam:
            pecas_query = pecas_query.filter(PecaPronta.tamanho.has(tamanho=tam))
        if tipo_cod:
            pecas_query = pecas_query.filter(PecaPronta.tipo.has(codigo=tipo_cod))

        peca_match = pecas_query.first()
        if peca_match:
            avail = virtual_pecas.get(peca_match.id, peca_match.quantidade)
            usar_peca = min(avail, qtd_solicitada)
            desconto_peca = usar_peca
            virtual_pecas[peca_match.id] = avail - usar_peca

        remanente = qtd_solicitada - desconto_peca

        # Step 2: Check Estampas stock
        if remanente > 0:
            est_query = session.query(Estampa).join(Estampa.design)
            if cod_estampa:
                est_query = est_query.filter(Estampa.design.has(codigo_estampa=cod_estampa))
            if cor_cod:
                est_query = est_query.filter(Estampa.cor.has(cor=cor_cod))

            est_match = est_query.first()
            if est_match:
                avail_est = virtual_estampas.get(est_match.id, est_match.quantidade)
                usar_est = min(avail_est, remanente)
                desconto_estampa = usar_est
                virtual_estampas[est_match.id] = avail_est - usar_est

        # Step 3: Exact printing remainder
        precisa_imprimir = remanente - desconto_estampa

        totais['total_itens'] += qtd_solicitada
        totais['total_descontado_pecas'] += desconto_peca
        totais['total_descontado_estampas'] += desconto_estampa
        totais['total_necessita_impressao'] += precisa_imprimir
        totais['pecas_disponiveis'] += desconto_peca
        totais['estampas_disponiveis'] += desconto_estampa
        totais['necessita_impressao'] += precisa_imprimir

        previa.append({
            'sku_original': sku_str,
            'produto_nome': raw.get('produto_nome', ''),
            'quantidade': qtd_solicitada,
            'imagem_url': raw.get('imagem_url'),
            'parsed': parsed,
            'desconto_peca': desconto_peca,
            'desconto_estampa': desconto_estampa,
            'precisa_imprimir': precisa_imprimir,
            'quantidade_descontada_peca': desconto_peca,
            'quantidade_descontada_estampa': desconto_estampa,
            'quantidade_necessita_impressao': precisa_imprimir
        })

    return jsonify({
        'total_itens': totais['total_itens'],
        'total_descontado_pecas': totais['total_descontado_pecas'],
        'total_descontado_estampas': totais['total_descontado_estampas'],
        'total_necessita_impressao': totais['total_necessita_impressao'],
        'pecas_disponiveis': totais['pecas_disponiveis'],
        'estampas_disponiveis': totais['estampas_disponiveis'],
        'necessita_impressao': totais['necessita_impressao'],
        'totais': totais,
        'items': previa,
        'previa': previa
    })


# ---------------------------------------------------------
# ATOMIC ORDER PROCESSING (/api/pedidos/procesar)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/procesar', methods=['POST'])
@require_roles(ORDER_PROCESS_ROLES)
def procesar_pedidos_batch():
    session = get_session()
    user_ctx = get_current_user_context()
    user_name = user_ctx['name']
    user_role = user_ctx['role']

    items_raw = []
    nome_arquivo = 'lote_manual.json'
    formato_origem = 'JSON'

    if 'file' in request.files:
        uploaded_file = request.files['file']
        file_bytes = uploaded_file.read()
        nome_arquivo = uploaded_file.filename
        formato_origem = nome_arquivo.split('.')[-1].upper() if '.' in nome_arquivo else 'FILE'
        try:
            items_raw = parse_order_file(file_bytes, nome_arquivo)
        except Exception as e:
            return jsonify({'error': f"Erro ao processar arquivo: {str(e)}"}), 400
    else:
        data = request.get_json() or {}
        items_raw = data.get('items', [])
        nome_arquivo = data.get('nome_arquivo', 'lote_manual.json')

    if not items_raw:
        return jsonify({'error': 'Nenhum pedido encontrado para processamento'}), 400

    try:
        lote = LotePedido(
            nome_arquivo=nome_arquivo,
            formato_origem=formato_origem,
            usuario_responsavel=f"{user_name} ({user_role})",
            total_itens=0,
            total_descontado_pecas=0,
            total_descontado_estampas=0,
            total_necessita_impressao=0,
            status='PROCESSADO'
        )
        session.add(lote)
        session.flush()

        tot_itens = 0
        tot_pecas = 0
        tot_estampas = 0
        tot_impressao = 0

        for raw in items_raw:
            sku_str = raw.get('sku_original', '').strip()
            qtd_solicitada = int(raw.get('quantidade', 1))
            prod_nome = raw.get('produto_nome', '')
            img_url = raw.get('imagem_url')
            data_ped = raw.get('data') or raw.get('data_pedido')
            parsed = parse_sku_details(sku_str) or {}

            cod_estampa = parsed.get('codigo_estampa')
            cor_cod = parsed.get('cor_codigo') or parsed.get('cor')
            tam = parsed.get('tamanho')
            tipo_cod = parsed.get('tipo_codigo') or parsed.get('tipo')

            desconto_peca = 0
            desconto_estampa = 0
            precisa_imprimir = 0
            peca_id = None
            estampa_id = None
            design_id_found = None
            cor_id_found = None
            tipo_id_found = None
            tam_id_found = None
            brand_id_found = None

            # 1. Deduct from Peças Prontas
            pecas_query = session.query(PecaPronta).join(PecaPronta.design)
            if cod_estampa:
                pecas_query = pecas_query.filter(PecaPronta.design.has(codigo_estampa=cod_estampa))
            if cor_cod:
                pecas_query = pecas_query.filter(PecaPronta.cor.has(cor=cor_cod))
            if tam:
                pecas_query = pecas_query.filter(PecaPronta.tamanho.has(tamanho=tam))
            if tipo_cod:
                pecas_query = pecas_query.filter(PecaPronta.tipo.has(codigo=tipo_cod))

            peca_match = pecas_query.filter(PecaPronta.quantidade > 0).first()
            if peca_match:
                peca_id = peca_match.id
                design_id_found = peca_match.design_id
                cor_id_found = peca_match.cor_id
                tipo_id_found = peca_match.tipo_id
                tam_id_found = peca_match.tamanho_id
                brand_id_found = peca_match.brand_id

                usar_peca = min(peca_match.quantidade, qtd_solicitada)
                desconto_peca = usar_peca
                peca_match.quantidade -= usar_peca

                mov_p = MovimentacaoEstoque(
                    categoria='peca',
                    item_id=peca_match.id,
                    tipo_movimento='SAIDA',
                    quantidade=usar_peca,
                    quantidade_anterior=peca_match.quantidade + usar_peca,
                    quantidade_nova=peca_match.quantidade,
                    observacao=f"Desconto automático pelo Lote #{lote.id} ({sku_str})"
                )
                session.add(mov_p)

            remanente = qtd_solicitada - desconto_peca

            # 2. Deduct from Estampas
            if remanente > 0:
                est_query = session.query(Estampa).join(Estampa.design)
                if cod_estampa:
                    est_query = est_query.filter(Estampa.design.has(codigo_estampa=cod_estampa))
                if cor_cod:
                    est_query = est_query.filter(Estampa.cor.has(cor=cor_cod))

                est_match = est_query.filter(Estampa.quantidade > 0).first()
                if est_match:
                    estampa_id = est_match.id
                    if not design_id_found:
                        design_id_found = est_match.design_id
                    if not cor_id_found:
                        cor_id_found = est_match.cor_id
                    if not brand_id_found:
                        brand_id_found = est_match.brand_id

                    usar_est = min(est_match.quantidade, remanente)
                    desconto_estampa = usar_est
                    est_match.quantidade -= usar_est

                    mov_e = MovimentacaoEstoque(
                        categoria='estampa',
                        item_id=est_match.id,
                        tipo_movimento='SAIDA',
                        quantidade=usar_est,
                        quantidade_anterior=est_match.quantidade + usar_est,
                        quantidade_nova=est_match.quantidade,
                        observacao=f"Desconto automático de estampa pelo Lote #{lote.id} ({sku_str})"
                    )
                    session.add(mov_e)

            # 3. Exact printing remainder
            precisa_imprimir = remanente - desconto_estampa

            item_pedido = ItemPedido(
                lote_id=lote.id,
                sku_original=sku_str,
                produto_nome=prod_nome,
                imagem_url=img_url,
                data_pedido=data_ped,
                quantidade_solicitada=qtd_solicitada,
                quantidade_descontada_peca=desconto_peca,
                quantidade_descontada_estampa=desconto_estampa,
                quantidade_necessita_impressao=precisa_imprimir,
                peca_pronta_id=peca_id,
                estampa_id=estampa_id,
                brand_id=brand_id_found,
                design_id=design_id_found,
                cor_id=cor_id_found,
                tipo_id=tipo_id_found,
                tamanho_id=tam_id_found
            )
            session.add(item_pedido)

            tot_itens += qtd_solicitada
            tot_pecas += desconto_peca
            tot_estampas += desconto_estampa
            tot_impressao += precisa_imprimir

        lote.total_itens = tot_itens
        lote.total_descontado_pecas = tot_pecas
        lote.total_descontado_estampas = tot_estampas
        lote.total_necessita_impressao = tot_impressao

        session.commit()
        return jsonify({
            'success': True,
            'message': f"Lote #{lote.id} processado com sucesso.",
            'lote': lote.to_dict(include_items=True)
        }), 201

    except Exception as e:
        session.rollback()
        return jsonify({'error': f"Erro na transação atômica do lote: {str(e)}"}), 500


# ---------------------------------------------------------
# BATCH LIST & DETAILS (/api/pedidos/lotes)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/lotes', methods=['GET'])
def get_lotes_pedidos():
    session = get_session()
    lotes = session.query(LotePedido).order_by(LotePedido.created_at.desc()).all()
    return jsonify([l.to_dict(include_items=True) for l in lotes])


@orders_bp.route('/api/pedidos/lotes/<int:lote_id>', methods=['GET'])
def get_lote_detalhe(lote_id):
    session = get_session()
    lote = session.get(LotePedido, lote_id)
    if not lote:
        return jsonify({'error': 'Lote não encontrado'}), 404
    return jsonify(lote.to_dict(include_items=True))


# ---------------------------------------------------------
# PDF 1: IMPRENTA (/api/pedidos/lotes/<id>/pdf-imprenta)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/lotes/<int:lote_id>/pdf-imprenta', methods=['GET'])
def download_pdf_imprenta(lote_id):
    session = get_session()
    lote = session.get(LotePedido, lote_id)
    if not lote:
        return jsonify({'error': 'Lote não encontrado'}), 404

    pdf_bytes = generate_imprenta_pdf(lote)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"PDF_Imprenta_Lote_{lote_id}.pdf"
    )


# ---------------------------------------------------------
# PDF 2: SEPARAÇÃO (/api/pedidos/lotes/<id>/pdf-separacao)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/lotes/<int:lote_id>/pdf-separacao', methods=['GET'])
def download_pdf_separacao(lote_id):
    session = get_session()
    lote = session.get(LotePedido, lote_id)
    if not lote:
        return jsonify({'error': 'Lote não encontrado'}), 404

    pdf_bytes = generate_separacao_pdf(lote)
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"PDF_Separacao_Lote_{lote_id}.pdf"
    )


# ---------------------------------------------------------
# CANCEL BATCH & ROLLBACK (/api/pedidos/lotes/<id>/cancelar)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/lotes/<int:lote_id>/cancelar', methods=['POST'])
@require_roles(ORDER_PROCESS_ROLES)
def cancelar_lote(lote_id):
    session = get_session()
    user_ctx = get_current_user_context()
    user_name = user_ctx['name']

    data = request.get_json() or {}
    motivo = data.get('motivo', '').strip()
    if not motivo:
        return jsonify({'error': 'O motivo do cancelamento é obrigatório'}), 400

    lote = session.get(LotePedido, lote_id)
    if not lote:
        return jsonify({'error': 'Lote não encontrado'}), 404

    if lote.status == 'CANCELADO':
        return jsonify({'error': 'Este lote já se encontra cancelado'}), 400

    try:
        for item in lote.itens:
            # Rollback Peça Pronta stock
            if item.quantidade_descontada_peca > 0 and item.peca_pronta_id:
                peca = session.get(PecaPronta, item.peca_pronta_id)
                if peca:
                    peca.quantidade += item.quantidade_descontada_peca
                    mov_p = MovimentacaoEstoque(
                        categoria='peca',
                        item_id=peca.id,
                        tipo_movimento='ENTRADA',
                        quantidade=item.quantidade_descontada_peca,
                        quantidade_anterior=peca.quantidade - item.quantidade_descontada_peca,
                        quantidade_nova=peca.quantidade,
                        observacao=f"Estorno Lote #{lote.id} - Cancelamento: {motivo}"
                    )
                    session.add(mov_p)

            # Rollback Estampa stock
            if item.quantidade_descontada_estampa > 0 and item.estampa_id:
                estampa = session.get(Estampa, item.estampa_id)
                if estampa:
                    estampa.quantidade += item.quantidade_descontada_estampa
                    mov_e = MovimentacaoEstoque(
                        categoria='estampa',
                        item_id=estampa.id,
                        tipo_movimento='ENTRADA',
                        quantidade=item.quantidade_descontada_estampa,
                        quantidade_anterior=estampa.quantidade - item.quantidade_descontada_estampa,
                        quantidade_nova=estampa.quantidade,
                        observacao=f"Estorno Lote #{lote.id} - Cancelamento estampa: {motivo}"
                    )
                    session.add(mov_e)

        lote.status = 'CANCELADO'
        lote.motivo_cancelamento = f"Cancelado por {user_name}: {motivo}"
        session.commit()

        return jsonify({
            'success': True,
            'message': f"Lote #{lote.id} cancelado com sucesso e estoques estornados.",
            'lote': lote.to_dict(include_items=True)
        })

    except Exception as e:
        session.rollback()
        return jsonify({'error': f"Erro ao cancelar lote: {str(e)}"}), 500


# ---------------------------------------------------------
# WHATSAPP LINK HOOK (/api/pedidos/lotes/<id>/whatsapp-link)
# ---------------------------------------------------------
@orders_bp.route('/api/pedidos/lotes/<int:lote_id>/whatsapp-link', methods=['GET'])
def get_whatsapp_link(lote_id):
    session = get_session()
    lote = session.get(LotePedido, lote_id)
    if not lote:
        return jsonify({'error': 'Lote não encontrado'}), 404

    phone = request.args.get('phone', '').strip()
    msg = (
        f"📦 *Lote de Produção #{lote.id}*\n"
        f"📅 Data: {lote.created_at.strftime('%d/%m/%Y %H:%M') if lote.created_at else ''}\n"
        f"👤 Operador: {lote.usuario_responsavel}\n"
        f"📊 Total Itens: {lote.total_itens}\n"
        f"👕 Peças Prontas: {lote.total_descontado_pecas}\n"
        f"🎨 Estampas em Estoque: {lote.total_descontado_estampas}\n"
        f"🖨️ *Requer Impressão: {lote.total_necessita_impressao}*"
    )
    encoded = urllib.parse.quote(msg)
    link = f"https://api.whatsapp.com/send?phone={phone}&text={encoded}" if phone else f"https://api.whatsapp.com/send?text={encoded}"

    return jsonify({
        'lote_id': lote.id,
        'whatsapp_link': link,
        'message_text': msg
    })

from datetime import datetime, timezone
from sqlalchemy import func
from models import (
    Brand, Cor, Design, Tipo, Tamanho, SKU,
    PecaPronta, Estampa, MovimentacaoEstoque,
    LotePedido, ItemPedido
)

def process_order_batch(session, raw_items, filename="pedidos.csv", user_role="soporte", user_name="Agatha"):
    """
    Executes atomic cascading inventory deduction for a batch of order items.
    Cascade Rule:
      1. Descontar PecaPronta existente (Almoxarifado -> PDF 2).
      2. Para o remanescente, descontar Estampa avulsa existente (Almoxarifado -> PDF 2).
      3. O que sobrar necessita de impressão gráfica (Fila Gráfica -> PDF 1).
    """
    if not raw_items:
        raise ValueError("Nenhum item válido encontrado no arquivo para processamento.")

    # Determine origin format
    lower_fn = filename.lower()
    formato = 'CSV'
    if lower_fn.endswith('.xlsx') or lower_fn.endswith('.xls'):
        formato = 'XLSX'
    elif lower_fn.endswith('.pdf'):
        formato = 'PDF'

    lote = LotePedido(
        nome_arquivo=filename,
        formato_origem=formato,
        status='PROCESSADO',
        usuario_responsavel=f"{user_name} ({user_role})" if user_role else user_name,
        created_at=datetime.now(timezone.utc)
    )
    session.add(lote)
    session.flush()

    total_itens = 0
    total_descontado_pecas = 0
    total_descontado_estampas = 0
    total_necessita_impressao = 0

    # Cache catalogs for quick resolution
    brands = {b.slug.upper(): b for b in session.query(Brand).all()}
    default_brand = session.query(Brand).first()
    cores = {c.cor.upper(): c for c in session.query(Cor).all()}
    tipos = {t.codigo.upper(): t for t in session.query(Tipo).all()}
    tamanhos = {t.tamanho.upper(): t for t in session.query(Tamanho).all()}
    designs_by_code = {d.codigo_estampa.strip(): d for d in session.query(Design).all()}

    for item_data in raw_items:
        sku_orig = item_data.get('sku_original', '').strip().upper()
        prod_nome = item_data.get('produto_nome', '')
        qtd_solicitada = max(1, int(item_data.get('quantidade', 1)))
        data_ped = item_data.get('data_pedido')
        img_url = item_data.get('imagem_url')
        parsed = item_data.get('parsed_sku') or {}

        tipo_item = parsed.get('tipo_item', 'peca')
        brand_slug = parsed.get('brand_slug')
        tipo_cod = parsed.get('tipo_codigo')
        cod_est = parsed.get('codigo_estampa')
        cor_cod = parsed.get('cor_codigo')
        tam_str = parsed.get('tamanho')

        # Resolve Brand
        brand_obj = brands.get(brand_slug) if brand_slug else default_brand
        brand_id = brand_obj.id if brand_obj else None

        # Resolve Cor
        cor_obj = cores.get(cor_cod) if cor_cod else None
        cor_id = cor_obj.id if cor_obj else None

        # Resolve Design
        design_obj = designs_by_code.get(cod_est) if cod_est else None
        if not design_obj and cod_est:
            # Auto-register design if missing
            design_obj = Design(nome_design=prod_nome or f"Design {cod_est}", codigo_estampa=cod_est)
            session.add(design_obj)
            session.flush()
            designs_by_code[cod_est] = design_obj
        design_id = design_obj.id if design_obj else None

        # Resolve Tipo & Tamanho (if peca)
        tipo_obj = tipos.get(tipo_cod) if tipo_cod else None
        tipo_id = tipo_obj.id if tipo_obj else None

        tam_obj = tamanhos.get(tam_str) if tam_str else None
        tam_id = tam_obj.id if tam_obj else None

        # Cascading Deduction Logic
        desc_peca = 0
        desc_estampa = 0
        req_impressao = qtd_solicitada
        peca_match = None
        estampa_match = None

        # Step 1: Check PecaPronta if this is a garment
        if tipo_item == 'peca' and design_id and cor_id and tipo_id and tam_id:
            query = session.query(PecaPronta).filter(
                PecaPronta.design_id == design_id,
                PecaPronta.cor_id == cor_id,
                PecaPronta.tipo_id == tipo_id,
                PecaPronta.tamanho_id == tam_id
            )
            if brand_id:
                query = query.filter(PecaPronta.brand_id == brand_id)
            
            peca_match = query.first()

            if peca_match and peca_match.quantidade > 0:
                avail_peca = peca_match.quantidade
                desc_peca = min(qtd_solicitada, avail_peca)
                peca_match.quantidade -= desc_peca
                req_impressao = qtd_solicitada - desc_peca

                # Audit movement for ready garment deduction
                mov_peca = MovimentacaoEstoque(
                    categoria='peca',
                    item_id=peca_match.id,
                    tipo_movimento='SAIDA',
                    quantidade=desc_peca,
                    quantidade_anterior=avail_peca,
                    quantidade_nova=peca_match.quantidade,
                    data_hora=datetime.now(timezone.utc),
                    observacao=f"Desconto Pedido Lote #{lote.id} ({sku_orig})"
                )
                session.add(mov_peca)

        # Step 2: If there is remaining quantity, check standalone Estampa
        if req_impressao > 0 and design_id and cor_id:
            query_est = session.query(Estampa).filter(
                Estampa.design_id == design_id,
                Estampa.cor_id == cor_id
            )
            if brand_id:
                query_est = query_est.filter(Estampa.brand_id == brand_id)
            
            estampa_match = query_est.first()

            if estampa_match and estampa_match.quantidade > 0:
                avail_estampa = estampa_match.quantidade
                desc_estampa = min(req_impressao, avail_estampa)
                estampa_match.quantidade -= desc_estampa
                req_impressao -= desc_estampa

                # Audit movement for standalone stamp deduction
                mov_est = MovimentacaoEstoque(
                    categoria='estampa',
                    item_id=estampa_match.id,
                    tipo_movimento='SAIDA',
                    quantidade=desc_estampa,
                    quantidade_anterior=avail_estampa,
                    quantidade_nova=estampa_match.quantidade,
                    data_hora=datetime.now(timezone.utc),
                    observacao=f"Desconto Estampa Avulsa Lote #{lote.id} para ({sku_orig})"
                )
                session.add(mov_est)

        # Step 3: Record ItemPedido
        item_pedido = ItemPedido(
            lote_id=lote.id,
            sku_original=sku_orig,
            produto_nome=prod_nome,
            quantidade_solicitada=qtd_solicitada,
            quantidade_descontada_peca=desc_peca,
            quantidade_descontada_estampa=desc_estampa,
            quantidade_necessita_impressao=req_impressao,
            data_pedido=data_ped,
            imagem_url=img_url,
            tipo_item=tipo_item,
            brand_id=brand_id,
            design_id=design_id,
            cor_id=cor_id,
            tipo_id=tipo_id,
            tamanho_id=tam_id,
            peca_pronta_id=peca_match.id if peca_match else None,
            estampa_id=estampa_match.id if estampa_match else None
        )
        session.add(item_pedido)

        total_itens += qtd_solicitada
        total_descontado_pecas += desc_peca
        total_descontado_estampas += desc_estampa
        total_necessita_impressao += req_impressao

    # Update Lote summary stats
    lote.total_itens = total_itens
    lote.total_descontado_pecas = total_descontado_pecas
    lote.total_descontado_estampas = total_descontado_estampas
    lote.total_necessita_impressao = total_necessita_impressao

    session.commit()
    return lote


def rollback_order_batch(session, lote_id, motivo, user_name="Agatha"):
    """
    Cancels an order batch, restores all deducted stock atomically,
    and logs corresponding ENTRADA movements with the mandatory cancellation reason.
    """
    if not motivo or not str(motivo).strip():
        raise ValueError("O motivo do cancelamento é obrigatório para estornar o lote.")

    lote = session.get(LotePedido, lote_id)
    if not lote:
        raise ValueError("Lote de pedidos não encontrado.")

    if lote.is_deleted or lote.status == 'CANCELADO':
        raise ValueError("Este lote já foi cancelado anteriormente.")

    clean_motivo = str(motivo).strip()

    # Revert deductions for every item in the batch
    for item in lote.itens:
        # Revert PecaPronta deduction
        if item.quantidade_descontada_peca > 0 and item.peca_pronta_id:
            peca = session.get(PecaPronta, item.peca_pronta_id)
            if peca:
                prev_qty = peca.quantidade
                peca.quantidade += item.quantidade_descontada_peca
                mov = MovimentacaoEstoque(
                    categoria='peca',
                    item_id=peca.id,
                    tipo_movimento='ENTRADA',
                    quantidade=item.quantidade_descontada_peca,
                    quantidade_anterior=prev_qty,
                    quantidade_nova=peca.quantidade,
                    data_hora=datetime.now(timezone.utc),
                    observacao=f"Estorno Lote #{lote.id} - Motivo: {clean_motivo} (Resp: {user_name})"
                )
                session.add(mov)

        # Revert Estampa deduction
        if item.quantidade_descontada_estampa > 0 and item.estampa_id:
            estampa = session.get(Estampa, item.estampa_id)
            if estampa:
                prev_qty = estampa.quantidade
                estampa.quantidade += item.quantidade_descontada_estampa
                mov = MovimentacaoEstoque(
                    categoria='estampa',
                    item_id=estampa.id,
                    tipo_movimento='ENTRADA',
                    quantidade=item.quantidade_descontada_estampa,
                    quantidade_anterior=prev_qty,
                    quantidade_nova=estampa.quantidade,
                    data_hora=datetime.now(timezone.utc),
                    observacao=f"Estorno Estampa Lote #{lote.id} - Motivo: {clean_motivo} (Resp: {user_name})"
                )
                session.add(mov)

    # Soft delete the batch
    lote.is_deleted = True
    lote.status = 'CANCELADO'
    lote.deleted_at = datetime.now(timezone.utc)
    lote.motivo_cancelamento = clean_motivo

    session.commit()
    return lote

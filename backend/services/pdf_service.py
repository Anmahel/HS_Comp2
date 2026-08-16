import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """Adds running headers and footers with total page count."""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))

        # Footer
        footer_text = f"HC_comp © 2026 — Sistema de Controle de Estoque & Produção  |  Página {self._pageNumber} de {page_count}"
        self.drawCentredString(A4[0] / 2.0, 20, footer_text)

        # Bottom Line
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.5)
        self.line(30, 32, A4[0] - 30, 32)
        self.restoreState()


def get_item_info(item):
    design_name = item.design.nome_design if (hasattr(item, 'design') and item.design) else None
    codigo_estampa = item.design.codigo_estampa if (hasattr(item, 'design') and item.design) else None
    cor = item.cor.cor if (hasattr(item, 'cor') and item.cor) else None
    tamanho = item.tamanho.tamanho if (hasattr(item, 'tamanho') and item.tamanho) else None
    produto = item.produto_nome or design_name or (f"Design #{codigo_estampa}" if codigo_estampa else "Produto")
    return {
        'produto': produto,
        'cor': cor or "-",
        'tamanho': tamanho or "-",
        'codigo_estampa': codigo_estampa or "-",
        'design_name': design_name
    }


def generate_imprenta_pdf(lote):
    """
    Generates PDF 1 (Imprenta / Produção):
    Lists only order units requiring new printing (quantidade_necessita_impressao > 0).
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ImprentaTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'ImprentaSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    cell_style = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )
    sku_style = ParagraphStyle(
        'CellSku',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    bold_qty_style = ParagraphStyle(
        'CellQty',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        alignment=1, # Center
        textColor=colors.HexColor('#BE123C')
    )

    story = []

    # Header Section
    story.append(Paragraph("HC_comp • Planilha de Impressão & Produção", title_style))
    story.append(Paragraph("PDF 1 — Fila de Impressão (Apenas itens sem estoque disponível em almoxarifado)", subtitle_style))
    story.append(Spacer(1, 10))

    # Meta Info Box
    created_str = lote.created_at.strftime('%d/%m/%Y %H:%M') if (lote.created_at and hasattr(lote.created_at, 'strftime')) else datetime.now().strftime('%d/%m/%Y %H:%M')
    info_data = [
        [
            Paragraph(f"<b>Lote ID:</b> #{lote.id}", subtitle_style),
            Paragraph(f"<b>Arquivo Origem:</b> {lote.nome_arquivo}", subtitle_style),
            Paragraph(f"<b>Data Processamento:</b> {created_str}", subtitle_style)
        ],
        [
            Paragraph(f"<b>Responsável:</b> {lote.usuario_responsavel}", subtitle_style),
            Paragraph(f"<b>Total Pedido:</b> {lote.total_itens} un", subtitle_style),
            Paragraph(f"<b>Total a Imprimir:</b> <font color='#BE123C'><b>{lote.total_necessita_impressao} un</b></font>", subtitle_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[170, 200, 165])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))

    # Items Table
    headers = ["Item #", "SKU / Código", "Design / Produto", "Cor", "Tam", "Qtd a Imprimir"]
    table_data = [[Paragraph(f"<b>{h}</b>", ParagraphStyle('Hdr', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white, alignment=1 if h == 'Qtd a Imprimir' else 0)) for h in headers]]

    row_count = 0
    if lote.itens:
        for item in lote.itens:
            if item.quantidade_necessita_impressao > 0:
                row_count += 1
                info = get_item_info(item)
                table_data.append([
                    Paragraph(str(row_count), cell_style),
                    Paragraph(item.sku_original, sku_style),
                    Paragraph(info['produto'], cell_style),
                    Paragraph(info['cor'], cell_style),
                    Paragraph(info['tamanho'], cell_style),
                    Paragraph(str(item.quantidade_necessita_impressao), bold_qty_style)
                ])

    if row_count == 0:
        table_data.append([
            Paragraph("Nenhum item necessita de impressão neste lote (100% atendido por estoque).", cell_style),
            "", "", "", "", ""
        ])

    items_table = Table(table_data, colWidths=[40, 130, 205, 50, 40, 70], repeatRows=1)
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(table_data)):
        bg = colors.HexColor('#FFFFFF') if i % 2 == 1 else colors.HexColor('#F8FAFC')
        t_style.append(('BACKGROUND', (0, i), (-1, i), bg))

    if row_count == 0:
        t_style.append(('SPAN', (0, 1), (-1, 1)))

    items_table.setStyle(TableStyle(t_style))
    story.append(items_table)
    story.append(Spacer(1, 15))

    # Summary box
    summary_text = (
        f"<b>Resumo de Impressão:</b> {row_count} modelos/variantes necessitam de nova estampa, "
        f"totalizando <b>{lote.total_necessita_impressao} unidades</b> a serem impressas na gráfica."
    )
    story.append(Paragraph(summary_text, subtitle_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()


def generate_separacao_pdf(lote):
    """
    Generates PDF 2 (Separação / Almoxarifado):
    Lists items fulfilled from ready stock:
      - Ready Garments (quantidade_descontada_peca > 0)
      - Standalone Stamps (quantidade_descontada_estampa > 0)
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=30,
        rightMargin=30,
        topMargin=30,
        bottomMargin=45
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'SepTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=colors.HexColor('#0F172A')
    )
    subtitle_style = ParagraphStyle(
        'SepSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#475569')
    )
    cell_style = ParagraphStyle(
        'CellRegular',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#1E293B')
    )
    sku_style = ParagraphStyle(
        'CellSku',
        parent=styles['Normal'],
        fontName='Courier-Bold',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0F172A')
    )
    badge_peca_style = ParagraphStyle(
        'BadgePeca',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#2563EB')
    )
    badge_estampa_style = ParagraphStyle(
        'BadgeEstampa',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#D97706')
    )
    bold_qty_style = ParagraphStyle(
        'CellQty',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        alignment=1,
        textColor=colors.HexColor('#15803D')
    )

    story = []

    # Header Section
    story.append(Paragraph("HC_comp • Planilha de Separação / Almoxarifado", title_style))
    story.append(Paragraph("PDF 2 — Guia de Picking & Retirada de Estoque Disponível", subtitle_style))
    story.append(Spacer(1, 10))

    # Meta Info Box
    created_str = lote.created_at.strftime('%d/%m/%Y %H:%M') if (lote.created_at and hasattr(lote.created_at, 'strftime')) else datetime.now().strftime('%d/%m/%Y %H:%M')
    total_separacao = lote.total_descontado_pecas + lote.total_descontado_estampas
    info_data = [
        [
            Paragraph(f"<b>Lote ID:</b> #{lote.id}", subtitle_style),
            Paragraph(f"<b>Arquivo:</b> {lote.nome_arquivo}", subtitle_style),
            Paragraph(f"<b>Data:</b> {created_str}", subtitle_style)
        ],
        [
            Paragraph(f"<b>Peças Prontas a Retirar:</b> <b>{lote.total_descontado_pecas} un</b>", subtitle_style),
            Paragraph(f"<b>Estampas a Retirar:</b> <b>{lote.total_descontado_estampas} un</b>", subtitle_style),
            Paragraph(f"<b>Total Picking:</b> <font color='#15803D'><b>{total_separacao} un</b></font>", subtitle_style)
        ]
    ]
    info_table = Table(info_data, colWidths=[170, 200, 165])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 15))

    # Picking Table
    headers = ["[ ✓ ]", "Tipo Retirada", "SKU / Código", "Produto / Design", "Cor", "Tam", "Qtd"]
    table_data = [[Paragraph(f"<b>{h}</b>", ParagraphStyle('Hdr', fontName='Helvetica-Bold', fontSize=9, textColor=colors.white, alignment=1 if h in ['[ ✓ ]', 'Qtd'] else 0)) for h in headers]]

    row_count = 0
    if lote.itens:
        for item in lote.itens:
            info = get_item_info(item)
            # Row for ready garment deduction
            if item.quantidade_descontada_peca > 0:
                row_count += 1
                table_data.append([
                    Paragraph("[  ]", cell_style),
                    Paragraph("PEÇA PRONTA", badge_peca_style),
                    Paragraph(item.sku_original, sku_style),
                    Paragraph(info['produto'], cell_style),
                    Paragraph(info['cor'], cell_style),
                    Paragraph(info['tamanho'], cell_style),
                    Paragraph(str(item.quantidade_descontada_peca), bold_qty_style)
                ])

            # Row for stamp deduction
            if item.quantidade_descontada_estampa > 0:
                row_count += 1
                stamp_sku = f"{info['codigo_estampa']}-{info['cor']}" if info['codigo_estampa'] != '-' else item.sku_original
                table_data.append([
                    Paragraph("[  ]", cell_style),
                    Paragraph("ESTAMPA AVULSA", badge_estampa_style),
                    Paragraph(stamp_sku, sku_style),
                    Paragraph(f"Estampa: {info['design_name'] or info['produto']}", cell_style),
                    Paragraph(info['cor'], cell_style),
                    Paragraph("-", cell_style),
                    Paragraph(str(item.quantidade_descontada_estampa), bold_qty_style)
                ])

    if row_count == 0:
        table_data.append([
            Paragraph("Nenhum item disponível em estoque para este lote (todos necessitam de impressão).", cell_style),
            "", "", "", "", "", ""
        ])

    picking_table = Table(table_data, colWidths=[35, 90, 115, 185, 45, 35, 30], repeatRows=1)
    t_style = [
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('PADDING', (0, 0), (-1, -1), 5),
    ]
    for i in range(1, len(table_data)):
        bg = colors.HexColor('#FFFFFF') if i % 2 == 1 else colors.HexColor('#F8FAFC')
        t_style.append(('BACKGROUND', (0, i), (-1, i), bg))

    if row_count == 0:
        t_style.append(('SPAN', (0, 1), (-1, 1)))

    picking_table.setStyle(TableStyle(t_style))
    story.append(picking_table)
    story.append(Spacer(1, 15))

    # Summary box
    summary_text = (
        f"<b>Instruções de Separação:</b> Retirar <b>{lote.total_descontado_pecas} peças prontas</b> "
        f"e <b>{lote.total_descontado_estampas} estampas avulsas</b> das prateleiras e marcar o checklist [ ✓ ] após a conferência."
    )
    story.append(Paragraph(summary_text, subtitle_style))

    doc.build(story, canvasmaker=NumberedCanvas)
    buffer.seek(0)
    return buffer.getvalue()

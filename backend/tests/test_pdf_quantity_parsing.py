import io
import pytest
from services.parser_service import parse_pdf_content, parse_quantity_value

def test_parse_quantity_value_variations():
    assert parse_quantity_value('1,00 Pç') == 1
    assert parse_quantity_value('3.00 Pç') == 3
    assert parse_quantity_value('5,00') == 5
    assert parse_quantity_value('10 un') == 10
    assert parse_quantity_value('2') == 2
    assert parse_quantity_value(3.0) == 3
    assert parse_quantity_value(None, default=1) == 1

def test_pdf_does_not_confuse_sku_code_with_quantity():
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas

    pdf_buffer = io.BytesIO()
    c = canvas.Canvas(pdf_buffer, pagesize=letter)
    c.drawString(50, 750, "Separação de mercadorias")
    c.drawString(50, 720, "Produto Cód. (SKU/GTIN) Qtd. Un. Localização")
    # Item with numeric design code 744 in SKU, but quantity 3.00 Pç
    c.drawString(50, 690, "Camiseta Rock Vintage CM-744-PRE-M 3,00 Pç A-01")
    # Item with numeric prefix 91 in title and code 256 in SKU, but quantity 2.00 Pç
    c.drawString(50, 660, "91 Van Halen Special CF-256-BRA-M 2,00 Pç B-02")
    c.save()

    pdf_bytes = pdf_buffer.getvalue()
    items = parse_pdf_content(pdf_bytes)

    assert len(items) == 2
    item1 = items[0]
    assert item1['sku_original'] == 'CM-744-PRE-M'
    assert item1['quantidade'] == 3 # MUST be 3, NOT 744!

    item2 = items[1]
    assert item2['sku_original'] == 'CF-256-BRA-M'
    assert item2['quantidade'] == 2 # MUST be 2, NOT 91 or 256!

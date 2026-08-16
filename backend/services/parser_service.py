import re
import csv
import io
from datetime import datetime, timezone

def parse_sku_details(sku_str):
    """
    Deconstructs raw SKU strings into structured components.
    Supported Patterns:
      1. Brand-prefixed 5-part Piece: "CR-CM-001-PRE-M" -> {brand: 'CR', tipo: 'CM', design: '001', cor: 'PRE', tamanho: 'M', tipo_item: 'peca'}
      2. 4-part Piece without Brand: "CF-643-PRE-G" -> {brand: None, tipo: 'CF', design: '643', cor: 'PRE', tamanho: 'G', tipo_item: 'peca'}
      3. Brand-prefixed Standalone Stamp: "CR-EST-643-PRE" -> {brand: 'CR', tipo: None, design: '643', cor: 'PRE', tamanho: None, tipo_item: 'estampa'}
      4. 2-part Standalone Stamp without Brand: "643-PRE" -> {brand: None, tipo: None, design: '643', cor: 'PRE', tamanho: None, tipo_item: 'estampa'}
    """
    if not sku_str:
        return None

    clean_sku = str(sku_str).strip().upper()
    parts = [p.strip() for p in clean_sku.split('-') if p.strip()]

    # Case 1: 5 parts -> BRAND-TIPO-DESIGN-COR-TAMANHO (e.g. CR-CM-001-PRE-M)
    if len(parts) == 5:
        return {
            'tipo_item': 'peca',
            'brand_slug': parts[0],
            'tipo_codigo': parts[1],
            'codigo_estampa': parts[2],
            'cor_codigo': parts[3],
            'tamanho': parts[4],
            'normalized_sku': f"{parts[0]}-{parts[1]}-{parts[2]}-{parts[3]}-{parts[4]}"
        }

    # Case 2: 4 parts with EST -> BRAND-EST-DESIGN-COR (e.g. CR-EST-643-PRE)
    if len(parts) == 4 and parts[1] == 'EST':
        return {
            'tipo_item': 'estampa',
            'brand_slug': parts[0],
            'tipo_codigo': None,
            'codigo_estampa': parts[2],
            'cor_codigo': parts[3],
            'tamanho': None,
            'normalized_sku': f"{parts[0]}-EST-{parts[2]}-{parts[3]}"
        }

    # Case 3: 4 parts standard garment -> TIPO-DESIGN-COR-TAMANHO (e.g. CF-643-PRE-G)
    if len(parts) == 4:
        return {
            'tipo_item': 'peca',
            'brand_slug': None,
            'tipo_codigo': parts[0],
            'codigo_estampa': parts[1],
            'cor_codigo': parts[2],
            'tamanho': parts[3],
            'normalized_sku': f"{parts[0]}-{parts[1]}-{parts[2]}-{parts[3]}"
        }

    # Case 4: 2 parts stamp -> DESIGN-COR (e.g. 643-PRE)
    if len(parts) == 2:
        return {
            'tipo_item': 'estampa',
            'brand_slug': None,
            'tipo_codigo': None,
            'codigo_estampa': parts[0],
            'cor_codigo': parts[1],
            'tamanho': None,
            'normalized_sku': f"{parts[0]}-{parts[1]}"
        }

    # Fallback generic parsing with regex
    garment_regex = re.compile(r'^([A-Z]{2,4})-([0-9]{1,4})-([A-Z]{3})-([A-Z0-9]{1,4})$')
    m = garment_regex.match(clean_sku)
    if m:
        return {
            'tipo_item': 'peca',
            'brand_slug': None,
            'tipo_codigo': m.group(1),
            'codigo_estampa': m.group(2),
            'cor_codigo': m.group(3),
            'tamanho': m.group(4),
            'normalized_sku': clean_sku
        }

    return {
        'tipo_item': 'peca',
        'brand_slug': None,
        'tipo_codigo': parts[0] if len(parts) > 0 else 'CM',
        'codigo_estampa': parts[1] if len(parts) > 1 else clean_sku,
        'cor_codigo': parts[2] if len(parts) > 2 else 'PRE',
        'tamanho': parts[3] if len(parts) > 3 else 'M',
        'normalized_sku': clean_sku
    }


def find_column_key(row_dict, candidate_names):
    """Finds matching column in a dict irrespective of case or accenting."""
    lower_map = {re.sub(r'[^a-zA-Z0-9]', '', str(k).lower()): k for k in row_dict.keys()}
    for candidate in candidate_names:
        clean_cand = re.sub(r'[^a-zA-Z0-9]', '', candidate.lower())
        if clean_cand in lower_map:
            return lower_map[clean_cand]
    return None


def parse_csv_content(file_bytes_or_str):
    """Parses CSV content into standardized raw order items."""
    if isinstance(file_bytes_or_str, bytes):
        try:
            content = file_bytes_or_str.decode('utf-8')
        except UnicodeDecodeError:
            content = file_bytes_or_str.decode('latin-1', errors='ignore')
    else:
        content = str(file_bytes_or_str)

    # Detect delimiter: comma, semicolon or tab
    sample = content[:2048]
    delimiter = ','
    if ';' in sample and sample.count(';') > sample.count(','):
        delimiter = ';'
    elif '\t' in sample and sample.count('\t') > sample.count(','):
        delimiter = '\t'

    f = io.StringIO(content)
    reader = csv.DictReader(f, delimiter=delimiter)
    items = []

    for row in reader:
        if not row:
            continue

        sku_col = find_column_key(row, ['sku', 'codigo', 'cod', 'código_sku', 'codigo_sku'])
        prod_col = find_column_key(row, ['produto', 'product', 'nome', 'descricao', 'item'])
        qtd_col = find_column_key(row, ['quantidade', 'qtd', 'qty', 'cantida', 'cantidad', 'quant'])
        data_col = find_column_key(row, ['data', 'data_pedido', 'date', 'fecha'])
        img_col = find_column_key(row, ['imagem', 'image', 'url_imagem', 'foto', 'imagem_url', 'img'])

        sku_val = str(row.get(sku_col, '')).strip() if sku_col else ''
        if not sku_val:
            continue

        prod_val = str(row.get(prod_col, '')).strip() if prod_col else f"Produto {sku_val}"
        qtd_raw = row.get(qtd_col, 1) if qtd_col else 1
        try:
            qtd_val = max(1, int(float(str(qtd_raw).replace(',', '.'))))
        except (ValueError, TypeError):
            qtd_val = 1

        data_val = str(row.get(data_col, '')).strip() if data_col else datetime.now(timezone.utc).strftime('%Y-%m-%d')
        img_val = str(row.get(img_col, '')).strip() if img_col else None

        items.append({
            'sku_original': sku_val,
            'produto_nome': prod_val,
            'quantidade': qtd_val,
            'data_pedido': data_val,
            'imagem_url': img_val,
            'parsed_sku': parse_sku_details(sku_val)
        })

    return items


def parse_xlsx_content(file_bytes):
    """Parses Excel (.xlsx) file into standardized order items."""
    import openpyxl

    wb = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [str(h).strip() if h is not None else f"col_{i}" for i, h in enumerate(rows[0])]
    items = []

    for row in rows[1:]:
        if not any(row):
            continue
        row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}

        sku_col = find_column_key(row_dict, ['sku', 'codigo', 'cod', 'código_sku', 'codigo_sku'])
        prod_col = find_column_key(row_dict, ['produto', 'product', 'nome', 'descricao', 'item'])
        qtd_col = find_column_key(row_dict, ['quantidade', 'qtd', 'qty', 'cantida', 'cantidad', 'quant'])
        data_col = find_column_key(row_dict, ['data', 'data_pedido', 'date', 'fecha'])
        img_col = find_column_key(row_dict, ['imagem', 'image', 'url_imagem', 'foto', 'imagem_url', 'img'])

        sku_val = str(row_dict.get(sku_col, '')).strip() if sku_col else ''
        if not sku_val or sku_val.lower() == 'none':
            continue

        prod_val = str(row_dict.get(prod_col, '')).strip() if prod_col else f"Produto {sku_val}"
        qtd_raw = row_dict.get(qtd_col, 1) if qtd_col else 1
        try:
            qtd_val = max(1, int(float(str(qtd_raw).replace(',', '.'))))
        except (ValueError, TypeError):
            qtd_val = 1

        data_val = str(row_dict.get(data_col, '')).strip() if data_col else datetime.now(timezone.utc).strftime('%Y-%m-%d')
        img_val = str(row_dict.get(img_col, '')).strip() if img_col else None
        if img_val and img_val.lower() == 'none':
            img_val = None

        items.append({
            'sku_original': sku_val,
            'produto_nome': prod_val,
            'quantidade': qtd_val,
            'data_pedido': data_val,
            'imagem_url': img_val,
            'parsed_sku': parse_sku_details(sku_val)
        })

    return items


def parse_pdf_content(file_bytes):
    """
    Parses PDF order sheets by extracting text and identifying SKU patterns and quantities.
    """
    from pypdf import PdfReader

    reader = PdfReader(io.BytesIO(file_bytes))
    full_text = ""
    for page in reader.pages:
        text = page.extract_text()
        if text:
            full_text += "\n" + text

    items = []
    lines = [l.strip() for l in full_text.split('\n') if l.strip()]

    # Pattern match lines with SKUs like CF-643-PRE-G, CM-001-BRA-P, CR-CM-001-PRE-M, 643-PRE
    sku_regex = re.compile(r'\b(?:[A-Z]{2,4}-)?(?:[A-Z]{2}-)?([0-9]{1,4}|[A-Z0-9]+)-([A-Z]{3})(?:-([A-Z0-9]+))?\b')

    for line in lines:
        match = sku_regex.search(line)
        if match:
            raw_sku = match.group(0)
            # Find quantity in the line (e.g. "Qtd: 2" or number at end of line)
            qtd_match = re.search(r'(?:qtd|quant|cantida|cantidad|x)?\s*:?\s*(\d+)\b', line, re.IGNORECASE)
            qtd_val = 1
            if qtd_match:
                try:
                    qtd_val = max(1, int(qtd_match.group(1)))
                except ValueError:
                    qtd_val = 1

            # Extract product title excluding the SKU
            prod_name = line.replace(raw_sku, '').strip()
            if not prod_name:
                prod_name = f"Produto {raw_sku}"

            items.append({
                'sku_original': raw_sku,
                'produto_nome': prod_name,
                'quantidade': qtd_val,
                'data_pedido': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                'imagem_url': None,
                'parsed_sku': parse_sku_details(raw_sku)
            })

    return items


def parse_order_file(file_storage_or_bytes, filename="orders.csv"):
    """
    Main entry point to parse CSV, XLSX or PDF into standardized order list.
    """
    if hasattr(file_storage_or_bytes, 'read'):
        file_bytes = file_storage_or_bytes.read()
    else:
        file_bytes = file_storage_or_bytes

    lower_name = filename.lower()
    if lower_name.endswith('.xlsx') or lower_name.endswith('.xls'):
        return parse_xlsx_content(file_bytes)
    elif lower_name.endswith('.pdf'):
        return parse_pdf_content(file_bytes)
    else:
        return parse_csv_content(file_bytes)

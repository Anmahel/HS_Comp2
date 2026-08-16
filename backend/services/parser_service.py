import re
import csv
import io
from datetime import datetime, timezone

def parse_sku_details(sku_str):
    """
    Deconstructs raw SKU strings into structured components.
    Supported Patterns:
      1. Brand-prefixed 5-part Piece: "CR-CM-001-PRE-M" -> {brand: 'CR', tipo: 'CM', design: '001', cor: 'PRE', tamanho: 'M', tipo_item: 'peca'}
      2. 4-part Piece without Brand (Olist/Tiny): "CF-643-PRE-G", "CM-060-PRE-P", "CF-643-PRE-G2" -> {brand: None, tipo: 'CF', design: '643', cor: 'PRE', tamanho: 'G2', tipo_item: 'peca'}
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

    # Case 3: 4 parts standard garment -> TIPO-DESIGN-COR-TAMANHO (e.g. CF-643-PRE-G, CM-060-PRE-P, CM-778-AMA-M)
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

    # Fallback generic parsing with regex (CM-060-PRE-P, CF-643-PRE-G2, etc.)
    garment_regex = re.compile(r'^(C[FM])-(\d+)-([A-Z]+)-([A-Z0-9]+)$', re.IGNORECASE)
    m = garment_regex.match(clean_sku)
    if m:
        return {
            'tipo_item': 'peca',
            'brand_slug': None,
            'tipo_codigo': m.group(1).upper(),
            'codigo_estampa': m.group(2),
            'cor_codigo': m.group(3).upper(),
            'tamanho': m.group(4).upper(),
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


def parse_quantity_value(qtd_raw, default=1):
    """
    Parses Brazilian decimal quantity notation like '1,00 Pç', '2,00 Pç', '3.00', '1,0', '5'
    into a clean integer count using int(float(str.replace(',', '.'))).
    """
    if qtd_raw is None:
        return default

    qtd_str = str(qtd_raw).strip()
    if not qtd_str:
        return default

    # Extract decimal number from strings like '1,00 Pç', '2.00', '3,00', '5'
    m = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:Pç|pc|pçs|un|peca|peça)?', qtd_str, re.IGNORECASE)
    if m:
        clean_num = m.group(1).replace(',', '.')
        try:
            val = int(float(clean_num))
            return max(1, val)
        except (ValueError, TypeError):
            return default
    return default


def parse_csv_content(file_bytes_or_str):
    """
    Parses CSV content into standardized raw order items.
    Supports standard CSVs as well as Olist/Tiny exported CSVs:
    Columns: [Produto] | [Cód. (SKU/GTIN)] | [Qtd. Un.] | [Localização]
    """
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

    # Olist/Tiny column candidates
    sku_candidates = ['sku', 'codigo', 'cod', 'código_sku', 'codigo_sku', 'cód (sku/gtin)', 'cod (sku/gtin)', 'cod skugtin', 'codsku']
    prod_candidates = ['produto', 'product', 'nome', 'descricao', 'item']
    qtd_candidates = ['qtd un', 'qtd. un.', 'quantidade', 'qtd', 'qty', 'cantida', 'cantidad', 'quant']
    data_candidates = ['data', 'data_pedido', 'date', 'fecha']
    img_candidates = ['imagem', 'image', 'url_imagem', 'foto', 'imagem_url', 'img']

    for row in reader:
        if not row:
            continue

        sku_col = find_column_key(row, sku_candidates)
        prod_col = find_column_key(row, prod_candidates)
        qtd_col = find_column_key(row, qtd_candidates)
        data_col = find_column_key(row, data_candidates)
        img_col = find_column_key(row, img_candidates)

        sku_val = str(row.get(sku_col, '')).strip() if sku_col else ''
        if not sku_val or sku_val.lower() == 'none':
            continue

        # Extract clean SKU using regex if mixed with text
        m_sku = re.search(r'\b(C[FM]-\d+-[A-Z]+-[A-Z0-9]+|\d+-[A-Z]+)\b', sku_val, re.IGNORECASE)
        if m_sku:
            sku_val = m_sku.group(1).upper()

        prod_val = str(row.get(prod_col, '')).strip() if prod_col else f"Produto {sku_val}"
        qtd_raw = row.get(qtd_col, 1) if qtd_col else 1
        qtd_val = parse_quantity_value(qtd_raw)

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
    """
    Parses Excel (.xlsx) file into standardized order items.
    Supports standard spreadsheets and Olist/Tiny Excel exports.
    """
    import openpyxl

    wb = openpyxl.load_workbook(filename=io.BytesIO(file_bytes), data_only=True)
    sheet = wb.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [str(h).strip() if h is not None else f"col_{i}" for i, h in enumerate(rows[0])]
    items = []

    sku_candidates = ['sku', 'codigo', 'cod', 'código_sku', 'codigo_sku', 'cód (sku/gtin)', 'cod (sku/gtin)', 'cod skugtin', 'codsku']
    prod_candidates = ['produto', 'product', 'nome', 'descricao', 'item']
    qtd_candidates = ['qtd un', 'qtd. un.', 'quantidade', 'qtd', 'qty', 'cantida', 'cantidad', 'quant']
    data_candidates = ['data', 'data_pedido', 'date', 'fecha']
    img_candidates = ['imagem', 'image', 'url_imagem', 'foto', 'imagem_url', 'img']

    for row in rows[1:]:
        if not any(row):
            continue
        row_dict = {headers[i]: row[i] for i in range(min(len(headers), len(row)))}

        sku_col = find_column_key(row_dict, sku_candidates)
        prod_col = find_column_key(row_dict, prod_candidates)
        qtd_col = find_column_key(row_dict, qtd_candidates)
        data_col = find_column_key(row_dict, data_candidates)
        img_col = find_column_key(row_dict, img_candidates)

        sku_val = str(row_dict.get(sku_col, '')).strip() if sku_col else ''
        if not sku_val or sku_val.lower() == 'none':
            continue

        # Extract clean SKU using regex if mixed with text
        m_sku = re.search(r'\b(C[FM]-\d+-[A-Z]+-[A-Z0-9]+|\d+-[A-Z]+)\b', sku_val, re.IGNORECASE)
        if m_sku:
            sku_val = m_sku.group(1).upper()

        prod_val = str(row_dict.get(prod_col, '')).strip() if prod_col else f"Produto {sku_val}"
        qtd_raw = row_dict.get(qtd_col, 1) if qtd_col else 1
        qtd_val = parse_quantity_value(qtd_raw)

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
    Parses Olist/Tiny 'Separação de mercadorias' and general PDF order sheets.
    Report Structure:
      - Header: Separação de mercadorias
      - Columns: [Produto] | [Cód. (SKU/GTIN)] | [Qtd. Un.] | [Localização]
      - SKU format: r'(C[FM]-\d+-[A-Z]+-[A-Z0-9]+)' (e.g. CM-060-PRE-P, CF-643-PRE-G2, CM-778-AMA-M)
      - Quantity format: r'(\d+[\.,]\d+)\s*Pç' (e.g. '1,00 Pç', '2,00 Pç')
    """
    import pdfplumber

    items = []
    seen_keys = set()

    # Regex targeting Olist/Tiny garment SKUs (CM-XXX-COR-TAM, CF-XXX-COR-TAM) and standalone stamps
    sku_regex = re.compile(r'\b(C[FM]-\d+-[A-Z]+-[A-Z0-9]+|\d+-[A-Z]+)\b', re.IGNORECASE)
    # Decimal quantity notation with Pç
    qtd_pc_regex = re.compile(r'(\d+[\.,]\d+)\s*Pç', re.IGNORECASE)

    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            # Method 1: Structured Table Extraction
            tables = page.extract_tables() or []
            for table in tables:
                for row in table:
                    if not row or not any(row):
                        continue

                    row_text = " ".join(str(c) for c in row if c)
                    if 'Separação de mercadorias' in row_text or ('Produto' in row_text and 'Cód' in row_text):
                        continue

                    sku_val = None
                    for cell in row:
                        if cell:
                            m_sku = sku_regex.search(str(cell).strip())
                            if m_sku:
                                sku_val = m_sku.group(1).upper()
                                break

                    if not sku_val:
                        continue

                    # Search for decimal quantity cell with 'Pç'
                    qtd_val = 1
                    for cell in row:
                        if cell:
                            cell_str = str(cell).strip()
                            m_qtd = qtd_pc_regex.search(cell_str)
                            if m_qtd:
                                qtd_val = parse_quantity_value(m_qtd.group(1))
                                break
                            elif 'Pç' in cell_str or re.match(r'^\d+(?:[\.,]\d+)?$', cell_str):
                                qtd_val = parse_quantity_value(cell_str)

                    # Extract product name
                    prod_val = None
                    for cell in row:
                        if cell:
                            c_str = str(cell).strip()
                            if c_str and sku_val not in c_str and 'Pç' not in c_str and not re.match(r'^\d+(?:[\.,]\d+)?$', c_str):
                                prod_val = c_str
                                break

                    if not prod_val:
                        prod_val = f"Produto {sku_val}"

                    item_key = f"{sku_val}_{qtd_val}_{prod_val}"
                    if item_key not in seen_keys:
                        seen_keys.add(item_key)
                        items.append({
                            'sku_original': sku_val,
                            'produto_nome': prod_val,
                            'quantidade': qtd_val,
                            'data_pedido': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                            'imagem_url': None,
                            'parsed_sku': parse_sku_details(sku_val)
                        })

            # Method 2: Text Extraction Line-by-Line (for Olist/Tiny standard text layouts)
            text = page.extract_text()
            if text:
                lines = [l.strip() for l in text.split('\n') if l.strip()]
                for line in lines:
                    if 'Separação de mercadorias' in line or 'Localização' in line:
                        continue

                    m_sku = sku_regex.search(line)
                    if m_sku:
                        sku_val = m_sku.group(1).upper()

                        # Capture quantity looking for decimal + Pç: r'(\d+[\.,]\d+)\s*Pç'
                        m_qtd = qtd_pc_regex.search(line)
                        if m_qtd:
                            qtd_val = parse_quantity_value(m_qtd.group(1))
                        else:
                            # Fallback generic decimal
                            m_gen = re.search(r'(\d+(?:[\.,]\d+)?)\s*(?:Pç|un)?', line, re.IGNORECASE)
                            qtd_val = parse_quantity_value(m_gen.group(1) if m_gen else 1)

                        # Extract product title (text preceding the SKU)
                        sku_pos = line.find(m_sku.group(0))
                        if sku_pos > 0:
                            prod_val = line[:sku_pos].strip()
                        else:
                            prod_val = line.replace(m_sku.group(0), '').strip()

                        # Strip trailing quantity & location if present
                        prod_val = re.sub(r'\s*\d+[\.,]\d+\s*Pç.*$', '', prod_val, flags=re.IGNORECASE).strip()
                        if not prod_val:
                            prod_val = f"Produto {sku_val}"

                        item_key = f"{sku_val}_{qtd_val}_{prod_val}"
                        if item_key not in seen_keys:
                            seen_keys.add(item_key)
                            items.append({
                                'sku_original': sku_val,
                                'produto_nome': prod_val,
                                'quantidade': qtd_val,
                                'data_pedido': datetime.now(timezone.utc).strftime('%Y-%m-%d'),
                                'imagem_url': None,
                                'parsed_sku': parse_sku_details(sku_val)
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

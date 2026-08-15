/**
 * Generates formatted SKU string from form data and catalog records.
 *
 * For Finished Pieces (Peças Prontas):
 * Format: {BRAND_SLUG}-{TIPO_CODIGO}-{CODIGO_ESTAMPA}-{COR_CODIGO}-{TAMANHO}
 * Example: CR-CM-001-PRE-M
 *
 * For Standalone Prints (Estampas Avulsas):
 * Format: {BRAND_SLUG}-EST-{CODIGO_ESTAMPA}-{COR_CODIGO}
 * Example: CR-EST-001-PRE
 */
export function generateSku(formData, catalogs = {}) {
  const { brands = [], tipos = [], cores = [], tamanhos = [] } = catalogs;
  const { categoria, brand_id, tipo_id, cor_id, tamanho_id, codigo_estampa } = formData;

  const brand = brands.find((b) => String(b.id) === String(brand_id));
  const brandSlug = brand ? brand.slug : 'BR';
  const cod = codigo_estampa ? String(codigo_estampa).trim().padStart(3, '0') : '000';

  const cor = cores.find((c) => String(c.id) === String(cor_id));
  const corCode = cor ? cor.cor : 'COR';

  if (categoria === 'estampa') {
    return `${brandSlug}-EST-${cod}-${corCode}`;
  }

  const tipo = tipos.find((t) => String(t.id) === String(tipo_id));
  const tipoCode = tipo ? tipo.codigo : 'TP';

  const tamanho = tamanhos.find((tam) => String(tam.id) === String(tamanho_id));
  const tamanhoStr = tamanho ? tamanho.tamanho : 'TAM';

  return `${brandSlug}-${tipoCode}-${cod}-${corCode}-${tamanhoStr}`;
}

/**
 * Validates SKU format
 */
export function isValidSku(sku) {
  if (!sku || typeof sku !== 'string') return false;
  // Patterns like CR-CM-001-PRE-M or CR-EST-001-PRE
  return /^[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+(-[A-Z0-9]+)?$/i.test(sku.trim());
}

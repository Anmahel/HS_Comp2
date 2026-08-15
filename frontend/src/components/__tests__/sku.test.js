import { describe, it, expect } from 'vitest';
import { generateSku, isValidSku } from '../../utils/sku';

describe('SKU Utility Tests', () => {
  const mockCatalogs = {
    brands: [
      { id: 1, name: 'Clube Rock', slug: 'CR' },
      { id: 2, name: 'Ride Nation', slug: 'RN' },
    ],
    cores: [
      { id: 1, cor: 'PRE', nome: 'Preto' },
      { id: 2, cor: 'BRA', nome: 'Branco' },
    ],
    tipos: [
      { id: 1, codigo: 'CM', nome: 'Camiseta Masculina' },
      { id: 2, codigo: 'MO', nome: 'Moletom' },
    ],
    tamanhos: [
      { id: 1, tamanho: 'P' },
      { id: 2, tamanho: 'M' },
      { id: 3, tamanho: 'G1' },
    ],
  };

  it('should generate formatted SKU for Finished Piece (Peça Pronta)', () => {
    const formData = {
      categoria: 'peca',
      brand_id: 1,
      tipo_id: 1,
      codigo_estampa: '001',
      cor_id: 1,
      tamanho_id: 2,
    };
    const sku = generateSku(formData, mockCatalogs);
    expect(sku).toBe('CR-CM-001-PRE-M');
  });

  it('should generate formatted SKU for Standalone Print (Estampa Avulsa)', () => {
    const formData = {
      categoria: 'estampa',
      brand_id: 2,
      codigo_estampa: '005',
      cor_id: 1,
    };
    const sku = generateSku(formData, mockCatalogs);
    expect(sku).toBe('RN-EST-005-PRE');
  });

  it('should pad numeric codes with leading zeros', () => {
    const formData = {
      categoria: 'peca',
      brand_id: 1,
      tipo_id: 2,
      codigo_estampa: '3',
      cor_id: 2,
      tamanho_id: 3,
    };
    const sku = generateSku(formData, mockCatalogs);
    expect(sku).toBe('CR-MO-003-BRA-G1');
  });

  it('should validate valid and invalid SKUs with isValidSku', () => {
    expect(isValidSku('CR-CM-001-PRE-M')).toBe(true);
    expect(isValidSku('RN-EST-005-PRE')).toBe(true);
    expect(isValidSku('')).toBe(false);
    expect(isValidSku('INVALID_SKU')).toBe(false);
  });
});

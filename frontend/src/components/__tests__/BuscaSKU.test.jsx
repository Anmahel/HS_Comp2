import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BuscaSKU } from '../BuscaSKU';
import { api } from '../../api';

// Mock API
vi.mock('../../api', () => ({
  api: {
    verificarDisponibilidade: vi.fn(),
  },
}));

describe('BuscaSKU Component Tests', () => {
  const mockCatalogs = {
    brands: [{ id: 1, name: 'Clube Rock', slug: 'CR' }],
    cores: [{ id: 1, cor: 'PRE', nome: 'Preto' }],
    tipos: [{ id: 1, codigo: 'CM', nome: 'Camiseta Masculina' }],
  };

  it('renders search input with shortcuts and handles input typing', async () => {
    api.verificarDisponibilidade.mockResolvedValueOnce({
      status: 'EM_ESTOQUE',
      status_label: 'Em Estoque',
      status_description: '15 peça(s) pronta(s) disponível(is)',
      total_pecas: 15,
      total_estampas: 30,
      extracted: { code: '001', size: 'M' },
      pecas_prontas: [
        {
          id: 1,
          sku: 'CR-CM-001-PRE-M',
          nome_design: 'Rock Vintage',
          brand_slug: 'CR',
          cor: 'PRE',
          tamanho: 'M',
          tipo_codigo: 'CM',
          quantidade: 15,
        },
      ],
      estampas: [],
    });

    render(
      <BuscaSKU
        catalogs={mockCatalogs}
        selectedBrand="all"
        onOpenDeduct={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Buscar SKU, código/i);
    expect(searchInput).toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '001 M' } });

    await waitFor(() => {
      expect(screen.getByTestId('verifier-status-banner')).toBeInTheDocument();
      expect(screen.getByText('Em Estoque')).toBeInTheDocument();
      expect(screen.getByText('CR-CM-001-PRE-M')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TabelaPecasProntas } from '../TabelaPecasProntas';

describe('TabelaPecasProntas Component Tests', () => {
  const mockItems = [
    {
      id: 1,
      sku: 'CR-CM-001-PRE-M',
      brand_slug: 'CR',
      brand_name: 'Clube Rock',
      nome_design: 'Rock Vintage',
      codigo_estampa: '001',
      tipo_codigo: 'CM',
      cor: 'PRE',
      tamanho: 'M',
      quantidade: 15,
      updated_at: '2026-08-15T10:00:00Z',
    },
    {
      id: 2,
      sku: 'RN-MO-005-PRE-GG',
      brand_slug: 'RN',
      brand_name: 'Ride Nation',
      nome_design: 'Ride or Die',
      codigo_estampa: '005',
      tipo_codigo: 'MO',
      cor: 'PRE',
      tamanho: 'GG',
      quantidade: 7,
      updated_at: '2026-08-15T11:00:00Z',
    },
  ];

  it('renders table headers, font-mono SKUs, and stock quantities', () => {
    render(
      <TabelaPecasProntas
        items={mockItems}
        onOpenCreate={() => {}}
        onOpenEdit={() => {}}
        onOpenDeduct={() => {}}
        onDelete={() => {}}
      />
    );

    expect(screen.getByText('CR-CM-001-PRE-M')).toBeInTheDocument();
    expect(screen.getByText('RN-MO-005-PRE-GG')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('filters items when typing into search input', () => {
    render(
      <TabelaPecasProntas
        items={mockItems}
        onOpenCreate={() => {}}
        onOpenEdit={() => {}}
        onOpenDeduct={() => {}}
        onDelete={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText(/Filtrar peças/i);
    fireEvent.change(searchInput, { target: { value: 'Ride or Die' } });

    expect(screen.getByText('RN-MO-005-PRE-GG')).toBeInTheDocument();
    expect(screen.queryByText('CR-CM-001-PRE-M')).not.toBeInTheDocument();
  });

  it('sorts columns immutably when clicking header sort buttons', () => {
    render(
      <TabelaPecasProntas
        items={mockItems}
        onOpenCreate={() => {}}
        onOpenEdit={() => {}}
        onOpenDeduct={() => {}}
        onDelete={() => {}}
      />
    );

    const sortStockBtn = screen.getByTestId('sort-stock-btn');
    fireEvent.click(sortStockBtn); // Ascending sort by stock: 7 then 15

    const rows = screen.getAllByTestId(/row-peca-/);
    expect(rows[0]).toHaveTextContent('RN-MO-005-PRE-GG'); // 7 un
    expect(rows[1]).toHaveTextContent('CR-CM-001-PRE-M');  // 15 un
  });
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DashboardView } from '../DashboardView';

describe('DashboardView Component Tests', () => {
  const mockStats = {
    total_pecas_quantidade: 142,
    total_estampas_quantidade: 230,
    total_geral_itens: 372,
    total_criticos: 2,
    brand_stats: [
      { brand_id: 1, name: 'Clube Rock', slug: 'CR', pecas_quantidade: 80, estampas_quantidade: 120, total: 200 },
      { brand_id: 2, name: 'Ride Nation', slug: 'RN', pecas_quantidade: 62, estampas_quantidade: 110, total: 172 },
    ],
    top_designs: [
      { design_id: 1, nome_design: 'Rock Vintage', codigo_estampa: '001', pecas_quantidade: 30, estampas_quantidade: 50, total_quantidade: 80 },
    ],
    critical_items: [
      { id: 4, tipo_item: 'peca', sku: 'CR-MO-003-PRE-GG', nome_design: 'Electric Guitar', cor: 'PRE', quantidade: 4 },
      { id: 6, tipo_item: 'peca', sku: 'RN-CM-006-CIN-G1', nome_design: 'Highway Legend', cor: 'CIN', quantidade: 3 },
    ],
  };

  it('renders all KPI counters and critical stock alerts', () => {
    render(
      <DashboardView
        stats={mockStats}
        onOpenCreate={() => {}}
        onOpenDeduct={() => {}}
      />
    );

    expect(screen.getByText('142')).toBeInTheDocument();
    expect(screen.getByText('230')).toBeInTheDocument();
    expect(screen.getByText('372')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Electric Guitar')).toBeInTheDocument();
    expect(screen.getByText('Highway Legend')).toBeInTheDocument();
    expect(screen.getByText('4 un')).toBeInTheDocument();
    expect(screen.getByText('3 un')).toBeInTheDocument();
  });
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NavigationTabs } from '../NavigationTabs';

describe('NavigationTabs Role-Based Access Tests', () => {
  it('renders strictly ["Processar Pedidos & PDFs", "Histórico de Lotes"] for soporte role', () => {
    const handleSelectTab = vi.fn();
    render(
      <NavigationTabs
        activeTab="pedidos"
        onSelectTab={handleSelectTab}
        userRole="soporte"
      />
    );

    expect(screen.getByText('Processar Pedidos & PDFs')).toBeInTheDocument();
    expect(screen.getByText('Histórico de Lotes')).toBeInTheDocument();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Peças Prontas')).not.toBeInTheDocument();
    expect(screen.queryByText('Estampas Avulsas')).not.toBeInTheDocument();
    expect(screen.queryByText('Auditoria & Logs')).not.toBeInTheDocument();
    expect(screen.queryByText('Verificador SKU')).not.toBeInTheDocument();
  });

  it('renders strictly ["Dashboard"] for jefe role', () => {
    render(
      <NavigationTabs
        activeTab="dashboard"
        onSelectTab={() => {}}
        userRole="jefe"
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Processar Pedidos & PDFs')).not.toBeInTheDocument();
    expect(screen.queryByText('Peças Prontas')).not.toBeInTheDocument();
    expect(screen.queryByText('Auditoria & Logs')).not.toBeInTheDocument();
  });

  it('renders strictly ["Auditoria & Logs"] for admin role', () => {
    render(
      <NavigationTabs
        activeTab="movimentacoes"
        onSelectTab={() => {}}
        userRole="admin"
      />
    );

    expect(screen.getByText('Auditoria & Logs')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Processar Pedidos & PDFs')).not.toBeInTheDocument();
    expect(screen.queryByText('Peças Prontas')).not.toBeInTheDocument();
  });

  it('renders strictly ["Peças Prontas", "Verificador SKU", "Separação & Despacho"] for separacion role', () => {
    render(
      <NavigationTabs
        activeTab="pedidos_roles"
        onSelectTab={() => {}}
        userRole="separacion"
      />
    );

    expect(screen.getByText('Peças Prontas')).toBeInTheDocument();
    expect(screen.getByText('Verificador SKU')).toBeInTheDocument();
    expect(screen.getByText('Separação & Despacho')).toBeInTheDocument();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Estampas Avulsas')).not.toBeInTheDocument();
    expect(screen.queryByText('Auditoria & Logs')).not.toBeInTheDocument();
    expect(screen.queryByText('Processar Pedidos & PDFs')).not.toBeInTheDocument();
  });

  it('renders strictly ["Peças Prontas", "Verificador SKU", "Estampas Avulsas"] for general / geral role', () => {
    render(
      <NavigationTabs
        activeTab="pecas"
        onSelectTab={() => {}}
        userRole="general"
      />
    );

    expect(screen.getByText('Peças Prontas')).toBeInTheDocument();
    expect(screen.getByText('Verificador SKU')).toBeInTheDocument();
    expect(screen.getByText('Estampas Avulsas')).toBeInTheDocument();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Separação & Despacho')).not.toBeInTheDocument();
    expect(screen.queryByText('Auditoria & Logs')).not.toBeInTheDocument();
  });

  it('renders strictly ["Fila de Impressão"] for imprenta role', () => {
    render(
      <NavigationTabs
        activeTab="pedidos_roles"
        onSelectTab={() => {}}
        userRole="imprenta"
      />
    );

    expect(screen.getByText('Fila de Impressão')).toBeInTheDocument();

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Peças Prontas')).not.toBeInTheDocument();
    expect(screen.queryByText('Estampas Avulsas')).not.toBeInTheDocument();
    expect(screen.queryByText('Verificador SKU')).not.toBeInTheDocument();
    expect(screen.queryByText('Processar Pedidos & PDFs')).not.toBeInTheDocument();
  });
});

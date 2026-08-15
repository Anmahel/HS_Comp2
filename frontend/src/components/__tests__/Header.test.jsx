import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '../Header';

describe('Header Component Tests', () => {
  const mockBrands = [
    { id: 1, name: 'Clube Rock', slug: 'CR' },
    { id: 2, name: 'Ride Nation', slug: 'RN' },
  ];

  it('renders application title, brand pills, and action buttons', () => {
    render(
      <Header
        brands={mockBrands}
        selectedBrand="all"
        onSelectBrand={() => {}}
        theme="dark"
        onToggleTheme={() => {}}
        onOpenCreate={() => {}}
      />
    );

    expect(screen.getByText('HC_comp')).toBeInTheDocument();
    expect(screen.getByText('Todas as Marcas')).toBeInTheDocument();
    expect(screen.getByText('Clube Rock')).toBeInTheDocument();
    expect(screen.getByText('Ride Nation')).toBeInTheDocument();
    expect(screen.getByText('Cadastrar Item')).toBeInTheDocument();
  });

  it('triggers onSelectBrand when clicking brand pills', () => {
    const handleSelectBrand = vi.fn();
    render(
      <Header
        brands={mockBrands}
        selectedBrand="all"
        onSelectBrand={handleSelectBrand}
        theme="dark"
        onToggleTheme={() => {}}
        onOpenCreate={() => {}}
      />
    );

    const brandBtn = screen.getByTestId('brand-filter-cr');
    fireEvent.click(brandBtn);
    expect(handleSelectBrand).toHaveBeenCalledWith(1);
  });

  it('triggers onToggleTheme when clicking theme switcher', () => {
    const handleToggleTheme = vi.fn();
    render(
      <Header
        brands={mockBrands}
        selectedBrand="all"
        onSelectBrand={() => {}}
        theme="dark"
        onToggleTheme={handleToggleTheme}
        onOpenCreate={() => {}}
      />
    );

    const themeBtn = screen.getByLabelText('Alternar tema');
    fireEvent.click(themeBtn);
    expect(handleToggleTheme).toHaveBeenCalledTimes(1);
  });
});

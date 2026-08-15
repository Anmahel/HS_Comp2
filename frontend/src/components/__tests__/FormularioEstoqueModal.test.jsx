import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FormularioEstoqueModal } from '../FormularioEstoqueModal';

describe('FormularioEstoqueModal Business Rules & Interaction Tests', () => {
  const mockCatalogs = {
    brands: [
      { id: 1, name: 'Clube Rock', slug: 'CR' },
      { id: 2, name: 'Ride Nation', slug: 'RN' },
    ],
    cores: [
      { id: 1, cor: 'PRE', nome: 'Preto' },
      { id: 2, cor: 'BRA', nome: 'Branco' },
    ],
    designs: [
      { id: 1, codigo_estampa: '001', nome_design: 'Rock Vintage' },
      { id: 2, codigo_estampa: '002', nome_design: 'Skull Wings' },
    ],
    tipos: [
      { id: 1, codigo: 'CM', nome: 'Camiseta Masculina' },
    ],
    tamanhos: [
      { id: 1, tamanho: 'M' },
    ],
  };

  it('RULE 1: When Cód. Estampa matches existing design, automatically populates Nome do Design, disables input, and shows Registrado Lock badge', () => {
    render(
      <FormularioEstoqueModal
        isOpen={true}
        category="peca"
        catalogs={mockCatalogs}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const inputCod = screen.getByTestId('input-codigo-estampa');
    const inputNome = screen.getByTestId('input-nome-design');

    // Type existing code "001"
    fireEvent.change(inputCod, { target: { value: '001' } });

    // Should auto-fill "Rock Vintage" and disable input
    expect(inputNome.value).toBe('Rock Vintage');
    expect(inputNome).toBeDisabled();
    expect(screen.getByTestId('badge-design-registrado')).toBeInTheDocument();
    expect(screen.getByText('Registrado')).toBeInTheDocument();
  });

  it('RULE 2: When Cód. Estampa does NOT exist, keeps Nome do Design enabled for free text entry', () => {
    render(
      <FormularioEstoqueModal
        isOpen={true}
        category="peca"
        catalogs={mockCatalogs}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const inputCod = screen.getByTestId('input-codigo-estampa');
    const inputNome = screen.getByTestId('input-nome-design');

    // Type new non-existent code "999"
    fireEvent.change(inputCod, { target: { value: '999' } });

    expect(inputNome).not.toBeDisabled();
    expect(screen.queryByTestId('badge-design-registrado')).not.toBeInTheDocument();

    // Can enter custom name
    fireEvent.change(inputNome, { target: { value: 'Novo Design Personalizado' } });
    expect(inputNome.value).toBe('Novo Design Personalizado');
  });

  it('RULE 3: In Edit Mode (isEditing = true), Brand selector is disabled and explanatory alert is displayed', () => {
    const itemToEdit = {
      id: 10,
      brand_id: 1,
      codigo_estampa: '001',
      nome_design: 'Rock Vintage',
      cor_id: 1,
      tipo_id: 1,
      tamanho_id: 1,
      quantidade: 15,
    };

    render(
      <FormularioEstoqueModal
        isOpen={true}
        category="peca"
        itemToEdit={itemToEdit}
        catalogs={mockCatalogs}
        onClose={() => {}}
        onSave={() => {}}
      />
    );

    const selectBrand = screen.getByTestId('select-brand');
    expect(selectBrand).toBeDisabled();

    // Verify warning alert message
    const alertBox = screen.getByTestId('brand-locked-alert');
    expect(alertBox).toBeInTheDocument();
    expect(alertBox).toHaveTextContent('A marca não pode ser alterada em um item já cadastrado');
  });

  it('RULE 4: Submitting form opens pre-submit confirmation modal before calling onSave', () => {
    const handleSave = vi.fn().mockResolvedValue(true);

    render(
      <FormularioEstoqueModal
        isOpen={true}
        category="peca"
        catalogs={mockCatalogs}
        onClose={() => {}}
        onSave={handleSave}
      />
    );

    fireEvent.change(screen.getByTestId('input-codigo-estampa'), { target: { value: '001' } });
    fireEvent.click(screen.getByTestId('submit-form-btn'));

    // Confirmation modal should appear
    expect(screen.getByText('Confirmar Cadastro')).toBeInTheDocument();
    expect(screen.getByText('Gravar no Estoque')).toBeInTheDocument();

    // Click final confirm
    fireEvent.click(screen.getByTestId('final-confirm-submit-btn'));
    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});

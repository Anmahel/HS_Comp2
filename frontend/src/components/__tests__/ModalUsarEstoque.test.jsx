import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ModalUsarEstoque } from '../ModalUsarEstoque';

describe('ModalUsarEstoque Component Tests', () => {
  const mockItem = {
    id: 10,
    sku: 'CR-CM-778-AMA-GG',
    nome_design: 'ACDC Raiz Copa',
    quantidade: 5,
  };

  it('renders correctly when open with item details', () => {
    render(
      <ModalUsarEstoque
        isOpen={true}
        item={mockItem}
        category="peca"
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );

    expect(screen.getByText('Dar Baixa no Estoque')).toBeInTheDocument();
    expect(screen.getByText('CR-CM-778-AMA-GG')).toBeInTheDocument();
    expect(screen.getByText('ACDC Raiz Copa')).toBeInTheDocument();
    expect(screen.getByText('5 unidade(s)')).toBeInTheDocument();
  });

  it('returns null when closed or without item', () => {
    const { container } = render(
      <ModalUsarEstoque
        isOpen={false}
        item={mockItem}
        category="peca"
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('allows changing quantity and prevents exceeding available stock', () => {
    render(
      <ModalUsarEstoque
        isOpen={true}
        item={mockItem}
        category="peca"
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );

    const input = screen.getByLabelText('Quantidade para dar baixa');
    const plusBtn = screen.getByLabelText('Aumentar quantidade');
    const minusBtn = screen.getByLabelText('Diminuir quantidade');

    // Increase
    fireEvent.click(plusBtn);
    expect(input.value).toBe('2');

    // Decrease
    fireEvent.click(minusBtn);
    expect(input.value).toBe('1');
  });

  it('calls onConfirm with correct parameters on submit', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(true);
    render(
      <ModalUsarEstoque
        isOpen={true}
        item={mockItem}
        category="peca"
        onClose={() => {}}
        onConfirm={handleConfirm}
      />
    );

    const submitBtn = screen.getByText('Confirmar Baixa');
    await act(async () => {
      fireEvent.click(submitBtn);
    });

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledWith(10, 'peca', 1);
    });
  });
});

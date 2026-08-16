import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessadorPedidosView } from '../ProcessadorPedidosView';
import { CancelarLoteModal } from '../CancelarLoteModal';

describe('ProcessadorPedidosView & Batch Processing Tests', () => {
  it('renders order processor view with dropzone and RBAC banner', () => {
    render(
      <ProcessadorPedidosView
        lotes={[]}
        userRole="soporte"
        userName="Agatha"
        onProcessBatch={vi.fn()}
        onOpenCancelModal={vi.fn()}
      />
    );

    expect(screen.getByText(/Módulo de Processamento de Pedidos & Desconto Atômico/i)).toBeInTheDocument();
    expect(screen.getByText(/Arraste sua planilha de pedidos aqui/i)).toBeInTheDocument();
    expect(screen.getByText(/Carregar Planilha de Demonstração \(Agatha\)/i)).toBeInTheDocument();
  });

  it('renders historical batch list with PDF download links and status', () => {
    const mockLotes = [
      {
        id: 101,
        nome_arquivo: 'pedidos_agatha_1608.csv',
        formato_origem: 'CSV',
        status: 'PROCESSADO',
        total_itens: 20,
        total_descontado_pecas: 5,
        total_descontado_estampas: 3,
        total_necessita_impressao: 12,
        usuario_responsavel: 'Agatha (soporte)',
        created_at: new Date().toISOString(),
      },
    ];

    render(
      <ProcessadorPedidosView
        lotes={mockLotes}
        userRole="soporte"
        userName="Agatha"
        onProcessBatch={vi.fn()}
        onOpenCancelModal={vi.fn()}
      />
    );

    expect(screen.getByText('#101')).toBeInTheDocument();
    expect(screen.getByText('pedidos_agatha_1608.csv')).toBeInTheDocument();
    expect(screen.getByText('PROCESSADO')).toBeInTheDocument();
    expect(screen.getByText('PDF 1')).toBeInTheDocument();
    expect(screen.getByText('PDF 2')).toBeInTheDocument();
  });

  it('CancelarLoteModal requires non-empty motivo before confirming rollback', async () => {
    const mockLote = {
      id: 101,
      nome_arquivo: 'pedidos.csv',
      total_descontado_pecas: 2,
      total_descontado_estampas: 1,
    };
    const onConfirmMock = vi.fn().mockResolvedValue(true);
    const onCloseMock = vi.fn();

    render(
      <CancelarLoteModal
        isOpen={true}
        lote={mockLote}
        onClose={onCloseMock}
        onConfirm={onConfirmMock}
      />
    );

    expect(screen.getByText(/Cancelar Lote #101 & Estornar Estoque/i)).toBeInTheDocument();

    const submitBtn = screen.getByTestId('btn-confirmar-cancelamento');
    expect(submitBtn).toBeDisabled();

    const motivoInput = screen.getByTestId('input-motivo-cancelamento');
    fireEvent.change(motivoInput, { target: { value: 'Planilha duplicada por engano' } });

    expect(submitBtn).not.toBeDisabled();

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onConfirmMock).toHaveBeenCalledWith(101, 'Planilha duplicada por engano');
    });
  });
});

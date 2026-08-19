import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProcessadorPedidosView } from '../ProcessadorPedidosView';
import { ProcessadorPreviewCard } from '../ProcessadorPreviewCard';
import { HistoricoLotesTable } from '../HistoricoLotesTable';
import { CancelarLoteModal } from '../CancelarLoteModal';

describe('ProcessadorPedidosView & Batch Processing Tests', () => {
  it('renders order processor view with dropzone', () => {
    render(
      <ProcessadorPedidosView
        user={{ role: 'soporte', name: 'Agatha' }}
        onProcessBatch={vi.fn()}
      />
    );

    expect(screen.getByText(/Arraste sua planilha de pedidos aqui/i)).toBeInTheDocument();
    expect(screen.getByText(/Formatos aceitos:/i)).toBeInTheDocument();
  });

  it('ProcessadorPreviewCard renders without Qtd Total column and handles pagination', () => {
    const mockItems = Array.from({ length: 25 }, (_, i) => ({
      sku_original: `CR-CM-${100 + i}-PRE-G`,
      produto_nome: `Camiseta Rock #${i + 1}`,
      quantidade_solicitada: 2,
      quantidade_descontada_peca: 1,
      quantidade_descontada_estampa: 1,
      quantidade_necessita_impressao: 0,
    }));

    const mockPreviewData = {
      filename: 'pedidos_test.csv',
      total_itens: 50,
      total_descontado_pecas: 25,
      total_descontado_estampas: 25,
      total_necessita_impressao: 0,
      items: mockItems,
    };

    render(
      <ProcessadorPreviewCard
        previewData={mockPreviewData}
        processing={false}
        canProcess={true}
        onReset={vi.fn()}
        onSubmit={vi.fn()}
      />
    );

    // Ensure "Qtd Total" column header is NOT present
    expect(screen.queryByText('Qtd Total')).not.toBeInTheDocument();

    // Verify other columns exist
    expect(screen.getByText('SKU Original')).toBeInTheDocument();
    expect(screen.getByText('Produto')).toBeInTheDocument();
    expect(screen.getByText('Peça Pronta')).toBeInTheDocument();
    expect(screen.getByText('Estampa Avulsa')).toBeInTheDocument();
    expect(screen.getByText('A Imprimir')).toBeInTheDocument();

    // Verify pagination controls: default 10 per page -> 25 items = 3 pages
    expect(screen.getByText(/Página/i, { selector: '.font-mono' })).toBeInTheDocument();
    expect(screen.getByText(/Mostrando 1 a 10 de 25 itens/i)).toBeInTheDocument();

    // Next page button
    const nextBtn = screen.getByLabelText('Próxima página');
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Mostrando 11 a 20 de 25 itens/i)).toBeInTheDocument();

    // Change page size to 30
    const selectPageSize = screen.getByLabelText('Selecionar itens por página na prévia');
    fireEvent.change(selectPageSize, { target: { value: '30' } });
    expect(screen.getByText(/Mostrando 1 a 25 de 25 itens/i)).toBeInTheDocument();
  });

  it('HistoricoLotesTable renders batch list with PDF download links and status', () => {
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
      <HistoricoLotesTable
        lotes={mockLotes}
        loading={false}
        onOpenCancelModal={vi.fn()}
        userRole="soporte"
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

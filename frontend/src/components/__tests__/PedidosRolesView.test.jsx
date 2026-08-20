import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PedidosRolesView } from '../PedidosRolesView';
import { ProcessadorSuccessCard } from '../ProcessadorSuccessCard';
import { api } from '../../api';

describe('Role-Based Orders & Notifications Tests', () => {
  const mockLotes = [
    {
      id: 201,
      nome_arquivo: 'lote_recente_201.csv',
      status: 'PROCESSADO',
      total_itens: 30,
      total_descontado_pecas: 10,
      total_descontado_estampas: 5,
      total_necessita_impressao: 15,
      has_pdf1: true,
      has_pdf2: true,
      usuario_responsavel: 'Agatha',
      created_at: new Date().toISOString(),
      itens: [
        {
          id: 1,
          sku_original: 'CM-001-PRE-M',
          produto_nome: 'Camiseta Black Sabbath',
          quantidade_solicitada: 2,
          quantidade_descontada_peca: 1,
          quantidade_descontada_estampa: 0,
          quantidade_necessita_impressao: 1,
          status: 'pendiente',
        }
      ]
    },
    {
      id: 200,
      nome_arquivo: 'lote_recente_200.csv',
      status: 'PROCESSADO',
      total_itens: 20,
      total_descontado_pecas: 5,
      total_descontado_estampas: 5,
      total_necessita_impressao: 10,
      has_pdf1: false,
      has_pdf2: true,
      usuario_responsavel: 'Agatha',
      created_at: new Date().toISOString(),
      itens: [
        {
          id: 2,
          sku_original: 'CF-643-PRE-G',
          produto_nome: 'Camiseta Rita Lee',
          quantidade_solicitada: 1,
          quantidade_descontada_peca: 1,
          quantidade_descontada_estampa: 0,
          quantidade_necessita_impressao: 0,
          status: 'pendiente',
        }
      ]
    },
    {
      id: 199,
      nome_arquivo: 'lote_antigo_199.csv',
      status: 'PROCESSADO',
      total_itens: 8,
      total_descontado_pecas: 2,
      total_descontado_estampas: 2,
      total_necessita_impressao: 6,
      has_pdf1: true,
      has_pdf2: false,
      usuario_responsavel: 'Agatha',
      created_at: new Date().toISOString(),
      itens: []
    }
  ];

  it('Imprenta Role view automatically renders 5-per-page list with download, modal and disabled printer placeholder', () => {
    render(
      <PedidosRolesView
        lotes={mockLotes}
        loading={false}
        user={{ role: 'imprenta', name: 'Operador Imprenta' }}
      />
    );

    // Title for imprenta
    expect(screen.getByText('Fila de Impressão & Produção')).toBeInTheDocument();

    // No manual switcher buttons
    expect(screen.queryByText('Visão Separação')).not.toBeInTheDocument();

    // Table columns
    expect(screen.getByText('Data de Envio')).toBeInTheDocument();
    expect(screen.getByText('Qtd Total Pedidos')).toBeInTheDocument();
    expect(screen.getByText('Só a Imprimir')).toBeInTheDocument();

    // All 3 mock lotes visible since page size is 5
    expect(screen.getByText('#201')).toBeInTheDocument();
    expect(screen.getByText('#200')).toBeInTheDocument();
    expect(screen.getByText('#199')).toBeInTheDocument();

    // Specific print numbers
    expect(screen.getByText('15 un')).toBeInTheDocument();
    expect(screen.getByText('10 un')).toBeInTheDocument();
    expect(screen.getByText('6 un')).toBeInTheDocument();

    // Buttons
    const downloadBtns = screen.getAllByText('Descargar PDF');
    expect(downloadBtns.length).toBe(3);

    const verDadosBtns = screen.getAllByText('Ver Dados');
    expect(verDadosBtns.length).toBe(3);

    // Check modal opens on clicking Ver Dados
    fireEvent.click(verDadosBtns[0]);
    expect(screen.getByText(/Detalhamento do Lote #201/i)).toBeInTheDocument();
    expect(screen.getByText('CM-001-PRE-M')).toBeInTheDocument();
  });

  it('Separacao / Geral Role view automatically renders clean Master-Detail layout with real-time picking persistence and produced modal', async () => {
    const updateSpy = vi.spyOn(api, 'updateItemStatus').mockResolvedValue({ success: true });

    render(
      <PedidosRolesView
        lotes={mockLotes}
        loading={false}
        user={{ role: 'separacion', name: 'Operador Separação' }}
      />
    );

    // No manual switcher buttons and no big banner
    expect(screen.queryByText('Visão Imprenta')).not.toBeInTheDocument();
    expect(screen.queryByText('Painel de Separação & Despacho')).not.toBeInTheDocument();

    // Left Column Sidebar has all lotes without S/P badges
    expect(screen.getByText(/Lotes para Separação \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText(/lote_recente_201.csv/i)).toBeInTheDocument();
    expect(screen.getByText(/lote_recente_200.csv/i)).toBeInTheDocument();
    expect(screen.getByText(/lote_antigo_199.csv/i)).toBeInTheDocument();

    // Right Column KPI cards for active lote #201
    expect(screen.getByText('Prontas')).toBeInTheDocument();
    expect(screen.getByText('Estampas')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByText('Faltan')).toBeInTheDocument();
    expect(screen.getByText('10 un')).toBeInTheDocument();
    expect(screen.getByText('5 un')).toBeInTheDocument();
    expect(screen.getAllByText('30 un').length).toBeGreaterThanOrEqual(1);

    // Table has columns OK, SKU Original, Produto, Unidad (no Qtd, Peça, Estampa)
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('SKU Original')).toBeInTheDocument();
    expect(screen.getByText('Produto')).toBeInTheDocument();
    expect(screen.getByText('Unidad')).toBeInTheDocument();
    expect(screen.queryByText('Peça')).not.toBeInTheDocument();
    expect(screen.queryByText('Estampa')).not.toBeInTheDocument();

    // Right Column direct Items Table row
    expect(screen.getByText('CM-001-PRE-M')).toBeInTheDocument();
    expect(screen.getByText('Camiseta Black Sabbath')).toBeInTheDocument();
    expect(screen.getByText('2 un')).toBeInTheDocument();

    // Button Ver Producidos initially shows (0)
    expect(screen.getByText(/Ver Producidos \(0\)/i)).toBeInTheDocument();

    // Interactive Checkbox clicking marks as produced:
    // 1. Removes item from pending table
    // 2. Discounts from Faltan (30 - 2 = 28 un)
    // 3. Increases Ver Producidos to (1)
    // 4. Calls api.updateItemStatus
    const checkboxBtn = screen.getByLabelText('Marcar item CM-001-PRE-M como produzido');
    fireEvent.click(checkboxBtn);

    expect(updateSpy).toHaveBeenCalledWith(1, 'producido');
    expect(screen.getByText('28 un')).toBeInTheDocument();
    expect(screen.getByText(/Ver Producidos \(1\)/i)).toBeInTheDocument();
    expect(screen.queryByText('Camiseta Black Sabbath')).not.toBeInTheDocument();

    // Open Modal Itens Producidos
    fireEvent.click(screen.getByText(/Ver Producidos \(1\)/i));
    expect(screen.getByText(/Itens Produzidos • Lote #201/i)).toBeInTheDocument();
    expect(screen.getByText('CM-001-PRE-M')).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByLabelText('Fechar modal de produzidos'));

    // Switch active lote in sidebar to #200
    const lote200Btn = screen.getByText(/lote_recente_200.csv/i);
    fireEvent.click(lote200Btn);

    // Right pane immediately updates to show lote #200 items
    expect(screen.getByText('CF-643-PRE-G')).toBeInTheDocument();
    expect(screen.getByText('Camiseta Rita Lee')).toBeInTheDocument();
  });

  it('ProcessadorSuccessCard does not have WhatsApp button and triggers PDF download with notification', async () => {
    const downloadSpy = vi.spyOn(api, 'downloadPdf').mockResolvedValue(true);
    const regSpy = vi.spyOn(api, 'registrarEmissaoPdf').mockResolvedValue({ success: true });

    render(
      <ProcessadorSuccessCard
        lote={mockLotes[0]}
        onReset={vi.fn()}
      />
    );

    // WhatsApp button must be completely gone
    expect(screen.queryByText(/WhatsApp/i)).not.toBeInTheDocument();

    // PDF 1 button
    const pdf1Btn = screen.getByText(/Baixar PDF 1 \(S - Imprenta\)/i);
    fireEvent.click(pdf1Btn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('/pedidos/lotes/201/pdf-imprenta', 'lote_201_imprenta.pdf');
      expect(regSpy).toHaveBeenCalledWith(201, 'PDF1');
    });

    // PDF 2 button
    const pdf2Btn = screen.getByText(/Baixar PDF 2 \(P - Separação\)/i);
    fireEvent.click(pdf2Btn);

    await waitFor(() => {
      expect(downloadSpy).toHaveBeenCalledWith('/pedidos/lotes/201/pdf-separacao', 'lote_201_separacao.pdf');
      expect(regSpy).toHaveBeenCalledWith(201, 'PDF2');
    });
  });
});

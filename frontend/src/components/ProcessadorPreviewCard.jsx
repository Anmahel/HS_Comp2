import React, { useState } from 'react';
import { Layers, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

export function ProcessadorPreviewCard({
  previewData,
  processing,
  canProcess,
  onReset,
  onSubmit,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  if (!previewData) return null;

  const items = previewData.items || [];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Derive current safe page during render
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  const handlePageSizeChange = (newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-dark-800/90 p-6 shadow-xl animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Prévia da Análise de Desconto em Cascada
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Descartar
          </button>
          <button
            type="button"
            data-testid="btn-processar-lote"
            onClick={onSubmit}
            disabled={processing || !canProcess}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-colors flex items-center gap-2 ${canProcess
              ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 cursor-pointer'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
          >
            {processing ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Processando Lote...
              </>
            ) : (
              <>
                <span>Processar Lote</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Simulation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Pedidos</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{previewData.total_itens}</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-indigo-500/30">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase">Prontas</span>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{previewData.total_descontado_pecas}</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-amber-500/30">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Estampas</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{previewData.total_descontado_estampas}</div>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-rose-500/30">
          <span className="text-[11px] font-semibold text-rose-400 uppercase">Fila de Impressão</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{previewData.total_necessita_impressao}</div>
        </div>
      </div>

      {/* Preview Items Table (Without Qtd Total Column) */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="px-4 py-2.5">SKU Original</th>
              <th className="px-4 py-2.5">Produto</th>
              <th className="px-4 py-2.5 text-center text-indigo-300">Peça Pronta</th>
              <th className="px-4 py-2.5 text-center text-amber-300">Estampa Avulsa</th>
              <th className="px-4 py-2.5 text-center text-rose-400">A Imprimir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {currentItems.map((it) => (
              <tr
                key={`preview-${it.sku_original}-${it.produto_nome}-${it.quantidade_solicitada}`}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-slate-200">
                  {it.sku_original}
                </td>
                <td className="px-4 py-2.5 text-slate-300">{it.produto_nome}</td>
                <td className="px-4 py-2.5 text-center font-mono text-indigo-400">
                  {it.quantidade_descontada_peca > 0 ? `${it.quantidade_descontada_peca} un` : '-'}
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-amber-400">
                  {it.quantidade_descontada_estampa > 0 ? `${it.quantidade_descontada_estampa} un` : '-'}
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-rose-400 font-bold">
                  {it.quantidade_necessita_impressao > 0 ? `${it.quantidade_necessita_impressao} un` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar (10, 20, 30 items) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            aria-label="Selecionar itens por página na prévia"
            className="px-2 py-1 bg-dark-900 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:border-rose-500 focus:outline-none"
          >
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={30}>30 por página</option>
          </select>
          <span className="text-slate-500 ml-2">
            Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + pageSize, totalItems)} de {totalItems} itens
          </span>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Página anterior"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 py-1 bg-dark-900 rounded-lg border border-slate-800 font-mono text-slate-300">
            Página <span className="font-bold text-white">{safePage}</span> de <span className="font-bold text-white">{totalPages}</span>
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Próxima página"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

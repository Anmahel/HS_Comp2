import React from 'react';
import { Square, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

const EMPTY_ITEMS = [];
const PAGE_SIZE = 6;

export function SeparacaoItemsTable({
  items = EMPTY_ITEMS,
  loteId,
  onToggleCheck,
  currentPage = 1,
  onPageChange,
  producedCount = 0,
  onOpenProducedModal,
}) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * PAGE_SIZE;
  const currentItems = items.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-800/90 overflow-hidden shadow-xl space-y-0">
      {/* Table Header Bar with "Ver Producidos" button */}
      <div className="flex items-center justify-between px-4 py-3 bg-dark-900/80 border-b border-slate-800">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
          Itens Pendentes ({totalItems})
        </span>

        {onOpenProducedModal && (
          <button
            type="button"
            onClick={onOpenProducedModal}
            className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Ver Producidos ({producedCount})
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="px-3 py-3 w-12 text-center">OK</th>
              <th className="px-4 py-3">SKU Original</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-center text-rose-400">Unidad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-dark-900/40">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
                  Nenhum produto pendente para este lote.
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const itemKey = item.id ? `item-${item.id}` : `item-${loteId}-${item.sku_original}-${startIndex + idx}`;

                return (
                  <tr
                    key={itemKey}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleCheck(item)}
                        aria-label={`Marcar item ${item.sku_original} como produzido`}
                        className="p-1 rounded hover:bg-slate-700 text-slate-500 hover:text-emerald-400 transition-colors inline-flex items-center justify-center"
                      >
                        <Square className="h-4 w-4" />
                      </button>
                    </td>

                    <td className="px-4 py-2.5 font-mono font-semibold text-slate-200">
                      {item.sku_original}
                    </td>

                    <td className="px-4 py-2.5 text-slate-300 truncate max-w-md">
                      {item.produto_nome || '-'}
                    </td>

                    <td className="px-4 py-2.5 text-center font-mono font-bold text-rose-400">
                      {item.quantidade_solicitada || item.quantidade_necessita_impressao || 1} un
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer - Fixed 6 items per page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-dark-900/60 border-t border-slate-800 text-xs text-slate-400">
        <span className="text-slate-500">
          Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + PAGE_SIZE, totalItems)} de {totalItems} pendentes (6 por página)
        </span>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={safePage <= 1}
            aria-label="Página anterior"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 py-1 bg-dark-800 rounded-lg border border-slate-700 font-mono text-slate-300">
            Página <strong className="text-white">{safePage}</strong> de <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
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

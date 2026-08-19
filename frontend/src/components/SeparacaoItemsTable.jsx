import React from 'react';
import { CheckSquare, Square, ChevronLeft, ChevronRight } from 'lucide-react';

const EMPTY_ITEMS = [];

export function SeparacaoItemsTable({
  items = EMPTY_ITEMS,
  loteId,
  checkedItems = {},
  onToggleCheck,
  pageSize = 10,
  onPageSizeChange,
  currentPage = 1,
  onPageChange,
}) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  return (
    <div className="rounded-2xl border border-slate-800 bg-dark-800/90 overflow-hidden shadow-xl space-y-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="px-3 py-3 w-12 text-center">OK</th>
              <th className="px-4 py-3">SKU Original</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-3 py-3 text-center font-mono">Qtd</th>
              <th className="px-3 py-3 text-center text-indigo-300">Peça</th>
              <th className="px-3 py-3 text-center text-amber-300">Estampa</th>
              <th className="px-3 py-3 text-center text-rose-400">Imprimir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 bg-dark-900/40">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                  Nenhum produto listado para este lote.
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => {
                const globalIdx = startIndex + idx;
                const itemKey = `${loteId}-${globalIdx}`;
                const isChecked = Boolean(checkedItems[itemKey]);

                return (
                  <tr
                    key={`item-${loteId}-${item.id || item.sku_original}-${globalIdx}`}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      isChecked ? 'bg-emerald-950/20 text-emerald-200' : ''
                    }`}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleCheck(itemKey)}
                        aria-label={`Marcar item ${item.sku_original}`}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center justify-center"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </td>

                    <td className={`px-4 py-2.5 font-mono font-semibold ${
                      isChecked ? 'line-through text-slate-400' : 'text-slate-200'
                    }`}>
                      {item.sku_original}
                    </td>

                    <td className="px-4 py-2.5 text-slate-300 truncate max-w-sm">
                      {item.produto_nome || '-'}
                    </td>

                    <td className="px-3 py-2.5 text-center font-mono font-bold">
                      {item.quantidade_solicitada}
                    </td>

                    <td className="px-3 py-2.5 text-center font-mono text-indigo-400">
                      {item.quantidade_descontada_peca > 0 ? `${item.quantidade_descontada_peca} un` : '-'}
                    </td>

                    <td className="px-3 py-2.5 text-center font-mono text-amber-400">
                      {item.quantidade_descontada_estampa > 0 ? `${item.quantidade_descontada_estampa} un` : '-'}
                    </td>

                    <td className="px-3 py-2.5 text-center font-mono text-rose-400 font-bold">
                      {item.quantidade_necessita_impressao > 0 ? `${item.quantidade_necessita_impressao} un` : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-dark-900/60 border-t border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span>Itens por página:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Selecionar quantidade de itens por página"
            className="px-2 py-1 bg-dark-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:border-indigo-500 focus:outline-none"
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

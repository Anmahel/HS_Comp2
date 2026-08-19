import React, { useState } from 'react';
import { X, Layers, CheckSquare, Square, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export function DetalhesPedidoModal({
  isOpen,
  lote,
  onClose,
  showCheckboxes = true,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedItems, setCheckedItems] = useState({});

  if (!isOpen || !lote) return null;

  const items = lote.itens || [];
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  const toggleCheck = (idx) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handlePageSizeChange = (size) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const totalChecked = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-dark-900 border border-slate-800 shadow-2xl p-6 space-y-5 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 id="modal-title" className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="h-5 w-5 text-indigo-400" />
              Detalhamento do Lote #{lote.id}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {lote.nome_arquivo} • {lote.total_itens} itens no lote • Criado em {lote.created_at ? new Date(lote.created_at).toLocaleString('pt-BR') : 'N/A'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de detalhes"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Stats summary & Pick list progress */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-dark-800 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Itens</span>
            <div className="text-lg font-bold text-white font-mono">{lote.total_itens}</div>
          </div>
          <div className="p-3 bg-dark-800 rounded-xl border border-indigo-500/20">
            <span className="text-[10px] text-indigo-400 uppercase font-semibold">Peças Prontas</span>
            <div className="text-lg font-bold text-indigo-300 font-mono">{lote.total_descontado_pecas}</div>
          </div>
          <div className="p-3 bg-dark-800 rounded-xl border border-amber-500/20">
            <span className="text-[10px] text-amber-400 uppercase font-semibold">Estampas</span>
            <div className="text-lg font-bold text-amber-300 font-mono">{lote.total_descontado_estampas}</div>
          </div>
          <div className="p-3 bg-dark-800 rounded-xl border border-rose-500/20">
            <span className="text-[10px] text-rose-400 uppercase font-semibold">A Imprimir</span>
            <div className="text-lg font-bold text-rose-400 font-mono">{lote.total_necessita_impressao}</div>
          </div>
        </div>

        {showCheckboxes && totalItems > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300">
              Progresso de Separação / Conferência: <strong className="text-emerald-400 font-mono">{totalChecked} / {totalItems}</strong> concluídos
            </span>
            {totalChecked === totalItems && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> 100% Conferido
              </span>
            )}
          </div>
        )}

        {/* Items Table */}
        <div className="flex-1 overflow-y-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-950 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0 z-10">
              <tr>
                {showCheckboxes && (
                  <th className="px-3 py-2.5 w-10 text-center">OK</th>
                )}
                <th className="px-4 py-2.5">SKU Original</th>
                <th className="px-4 py-2.5">Produto</th>
                <th className="px-3 py-2.5 text-center font-mono">Qtd</th>
                <th className="px-3 py-2.5 text-center text-indigo-300">Peça</th>
                <th className="px-3 py-2.5 text-center text-amber-300">Estampa</th>
                <th className="px-3 py-2.5 text-center text-rose-400">Imprimir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 bg-dark-900/50">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={showCheckboxes ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                    Nenhum item encontrado para este lote.
                  </td>
                </tr>
              ) : (
                currentItems.map((item, idx) => {
                  const globalIdx = startIndex + idx;
                  const isChecked = Boolean(checkedItems[globalIdx]);

                  return (
                    <tr
                      key={`lote-item-${item.id || globalIdx}-${item.sku_original}`}
                      className={`hover:bg-slate-800/30 transition-colors ${isChecked ? 'bg-emerald-950/20 text-emerald-200' : ''}`}
                    >
                      {showCheckboxes && (
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleCheck(globalIdx)}
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
                      )}
                      <td className={`px-4 py-2 font-mono font-semibold ${isChecked ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                        {item.sku_original}
                      </td>
                      <td className="px-4 py-2 text-slate-300 truncate max-w-xs">{item.produto_nome || '-'}</td>
                      <td className="px-3 py-2 text-center font-mono font-bold">{item.quantidade_solicitada}</td>
                      <td className="px-3 py-2 text-center font-mono text-indigo-400">
                        {item.quantidade_descontada_peca > 0 ? `${item.quantidade_descontada_peca}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-amber-400">
                        {item.quantidade_descontada_estampa > 0 ? `${item.quantidade_descontada_estampa}` : '-'}
                      </td>
                      <td className="px-3 py-2 text-center font-mono text-rose-400 font-bold">
                        {item.quantidade_necessita_impressao > 0 ? `${item.quantidade_necessita_impressao}` : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar (10, 20, 30) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-400 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span>Itens por página:</span>
            <select
              value={pageSize}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              aria-label="Selecionar quantidade de itens por página"
              className="px-2 py-1 bg-dark-800 text-slate-200 border border-slate-700 rounded-lg text-xs font-mono focus:border-rose-500 focus:outline-none"
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

            <span className="px-3 py-1 bg-dark-800 rounded-lg border border-slate-700 font-mono text-slate-300">
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
    </div>
  );
}

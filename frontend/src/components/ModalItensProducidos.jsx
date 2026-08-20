import React, { useState, useMemo } from 'react';
import { CheckCircle2, Search, X, RotateCcw, Clock } from 'lucide-react';

const EMPTY_ITEMS = [];

export function ModalItensProducidos({
  isOpen = false,
  onClose,
  items = EMPTY_ITEMS,
  onRevertItem,
  loteNome = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter only produced items and sort them by updated_at DESC
  const producedItems = useMemo(() => {
    return items
      .filter((it) => it.status === 'producido')
      .slice()
      .sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return timeB - timeA;
      });
  }, [items]);

  // Real-time search filter by SKU or Product name
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return producedItems;
    const term = searchTerm.toLowerCase().trim();
    return producedItems.filter((it) => {
      const sku = (it.sku_original || '').toLowerCase();
      const prod = (it.produto_nome || '').toLowerCase();
      return sku.includes(term) || prod.includes(term);
    });
  }, [producedItems, searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl rounded-2xl bg-dark-900 border border-slate-800 shadow-2xl p-6 space-y-5 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              Itens Produzidos {loteNome ? `• ${loteNome}` : ''}
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Lista de separações concluídas • Total de {producedItems.length} produto(s)
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de produzidos"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Real-time search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por SKU ou Nome do Produto..."
            aria-label="Buscar produtos produzidos"
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Produced items list */}
        <div className="flex-1 overflow-y-auto border border-slate-800/80 rounded-xl bg-dark-800/50">
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-400">Nenhum item produzido encontrado.</p>
              <p>
                {searchTerm
                  ? 'Nenhum resultado corresponde ao termo pesquisado.'
                  : 'Marque as caixas de seleção na tabela principal para registrar itens concluídos.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800 sticky top-0">
                <tr>
                  <th className="px-4 py-3">SKU Original</th>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-3 py-3 text-center">Unidad</th>
                  <th className="px-4 py-3 text-center">Concluído em</th>
                  <th className="px-4 py-3 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr
                    key={`produced-item-${item.id || item.sku_original}`}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-emerald-300">
                      {item.sku_original}
                    </td>
                    <td className="px-4 py-3 text-slate-300 truncate max-w-xs">
                      {item.produto_nome || '-'}
                    </td>
                    <td className="px-3 py-3 text-center font-mono font-bold text-slate-200">
                      {item.quantidade_solicitada || 1} un
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-[11px] text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {item.updated_at
                          ? new Date(item.updated_at).toLocaleTimeString('pt-BR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })
                          : 'Recentemente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {onRevertItem && (
                        <button
                          type="button"
                          onClick={() => onRevertItem(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          title="Voltar para pendente"
                        >
                          <RotateCcw className="h-3 w-3 text-indigo-400" />
                          Desfazer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs text-slate-500">
          <span>Mostrando {filteredItems.length} de {producedItems.length} concluídos</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

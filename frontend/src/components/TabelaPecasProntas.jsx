import React, { useState, useMemo } from 'react';
import { ArrowUpDown, Edit, MinusCircle, Trash2, Search, Shirt, Plus } from 'lucide-react';
import { formatDateTime } from '../utils/formatters';

export function TabelaPecasProntas({
  items = [],
  loading = false,
  onOpenCreate,
  onOpenEdit,
  onOpenDeduct,
  onDelete,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [includeZero, setIncludeZero] = useState(false);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and immutable sort
  const filteredAndSortedItems = useMemo(() => {
    let result = items.slice();

    if (!includeZero) {
      result = result.filter((item) => item.quantidade > 0);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          (item.sku && item.sku.toLowerCase().includes(q)) ||
          (item.nome_design && item.nome_design.toLowerCase().includes(q)) ||
          (item.codigo_estampa && item.codigo_estampa.includes(q)) ||
          (item.brand_name && item.brand_name.toLowerCase().includes(q)) ||
          (item.cor && item.cor.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      let valA = a[sortField] ?? '';
      let valB = b[sortField] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, searchTerm, sortField, sortOrder, includeZero]);

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar peças por SKU, design, cor..."
              className="w-full pl-9 pr-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700/80 text-xs focus:border-rose-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none bg-dark-900/60 px-3 py-2 rounded-xl border border-slate-800">
            <input
              type="checkbox"
              checked={includeZero}
              onChange={(e) => setIncludeZero(e.target.checked)}
              className="rounded bg-dark-900 border-slate-700 text-rose-500 focus:ring-rose-500/20"
            />
            <span>Exibir estoque zerado</span>
          </label>
        </div>

        <button
          type="button"
          data-testid="create-peca-btn"
          onClick={() => onOpenCreate('peca')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition-all self-start sm:self-auto active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Peça Pronta</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-dark-800/90 border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="tabela-pecas-prontas">
            <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-sku-btn"
                    onClick={() => handleSort('sku')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>SKU</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-brand-btn"
                    onClick={() => handleSort('brand_name')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>Marca</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-design-btn"
                    onClick={() => handleSort('nome_design')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>Design / Cód</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-tipo-btn"
                    onClick={() => handleSort('tipo_codigo')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>Tipo</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-cor-btn"
                    onClick={() => handleSort('cor')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>Cor</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    type="button"
                    data-testid="sort-tamanho-btn"
                    onClick={() => handleSort('tamanho')}
                    className="flex items-center gap-1.5 hover:text-white transition-colors group"
                  >
                    <span>Tam</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3 text-right">
                  <button
                    type="button"
                    data-testid="sort-stock-btn"
                    onClick={() => handleSort('quantidade')}
                    className="flex items-center gap-1.5 ml-auto hover:text-white transition-colors group"
                  >
                    <span>Estoque</span>
                    <ArrowUpDown className="h-3 w-3 text-slate-500 group-hover:text-rose-400" />
                  </button>
                </th>
                <th className="px-4 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent mb-2" />
                    <p className="font-mono text-xs">Carregando peças prontas...</p>
                  </td>
                </tr>
              ) : filteredAndSortedItems.length > 0 ? (
                filteredAndSortedItems.map((item) => (
                  <tr
                    key={item.id}
                    data-testid={`row-peca-${item.id}`}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* SKU */}
                    <td className="px-4 py-3 font-mono font-semibold text-slate-200">
                      <span className="px-2 py-1 rounded-md bg-dark-900 border border-slate-800 text-xs">
                        {item.sku}
                      </span>
                    </td>

                    {/* Brand */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full font-mono ${
                          item.brand_slug === 'CR'
                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {item.brand_slug}
                      </span>
                    </td>

                    {/* Design */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{item.nome_design}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Cód #{item.codigo_estampa}</div>
                    </td>

                    {/* Tipo */}
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {item.tipo_codigo}
                    </td>

                    {/* Cor */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-200">{item.cor}</span>
                    </td>

                    {/* Tamanho */}
                    <td className="px-4 py-3 font-mono font-bold text-slate-300">
                      {item.tamanho}
                    </td>

                    {/* Quantidade */}
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold text-sm ${
                          item.quantidade === 0
                            ? 'text-rose-400'
                            : item.quantidade < 5
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {item.quantidade}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1">un</span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          title="Dar baixa no estoque"
                          disabled={item.quantidade <= 0}
                          onClick={() => onOpenDeduct(item, 'peca')}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            item.quantidade > 0
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500 hover:text-white'
                              : 'bg-slate-800 text-slate-600 border-slate-700/50 cursor-not-allowed'
                          }`}
                        >
                          <MinusCircle className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Editar item"
                          onClick={() => onOpenEdit(item, 'peca')}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Excluir item"
                          onClick={() => {
                            if (window.confirm(`Deseja realmente excluir ${item.sku}?`)) {
                              onDelete(item.id, 'peca');
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs">
                    Nenhuma peça pronta encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

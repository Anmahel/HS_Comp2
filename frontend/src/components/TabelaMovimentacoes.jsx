import React, { useState, useMemo } from 'react';
import { History, ArrowDownRight, ArrowUpRight, RefreshCw, Filter } from 'lucide-react';
import { formatDateTime, getMovimentoBadge } from '../utils/formatters';

const EMPTY_MOVIMENTACOES = [];

export function TabelaMovimentacoes({ movimentacoes = EMPTY_MOVIMENTACOES }) {
  const [filterTipo, setFilterTipo] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('');

  const filteredList = useMemo(() => {
    return movimentacoes.filter((m) => {
      if (filterTipo && m.tipo_movimento !== filterTipo) return false;
      if (filterCategoria && m.categoria !== filterCategoria) return false;
      return true;
    });
  }, [movimentacoes, filterTipo, filterCategoria]);

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-md">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold text-white">Log de Auditoria e Movimentações</h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            aria-label="Filtrar por Categoria"
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="px-3 py-1.5 bg-dark-900 text-slate-300 rounded-xl border border-slate-700 text-xs"
          >
            <option value="">Todas as Categorias</option>
            <option value="peca">Peças Prontas</option>
            <option value="estampa">Estampas Avulsas</option>
          </select>

          <select
            aria-label="Filtrar por Tipo de Movimento"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="px-3 py-1.5 bg-dark-900 text-slate-300 rounded-xl border border-slate-700 text-xs"
          >
            <option value="">Todos os Tipos de Movimento</option>
            <option value="ENTRADA">Entrada</option>
            <option value="SAIDA">Saída / Baixa</option>
            <option value="AJUSTE">Ajuste Manual</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-dark-800/90 border border-slate-800 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs" data-testid="tabela-movimentacoes">
            <thead className="bg-dark-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-700/80">
              <tr>
                <th className="px-4 py-3">Data / Hora</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Item ID</th>
                <th className="px-4 py-3 text-right">Qtd Movimentada</th>
                <th className="px-4 py-3 text-right">Estoque Anterior</th>
                <th className="px-4 py-3 text-right">Novo Estoque</th>
                <th className="px-4 py-3">Observação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filteredList.length > 0 ? (
                filteredList.map((mov) => {
                  const badge = getMovimentoBadge(mov.tipo_movimento);
                  return (
                    <tr key={mov.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {formatDateTime(mov.data_hora)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 uppercase font-mono text-[11px] text-slate-300">
                        {mov.categoria === 'peca' ? 'Peça' : 'Estampa'}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        #{mov.item_id}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">
                        {mov.quantidade > 0 ? `+${mov.quantidade}` : mov.quantidade}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-400">
                        {mov.quantidade_anterior}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-400">
                        {mov.quantidade_nova}
                      </td>
                      <td className="px-4 py-3 text-slate-400 italic">
                        {mov.observacao || '-'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500 text-xs">
                    Nenhuma movimentação registrada.
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

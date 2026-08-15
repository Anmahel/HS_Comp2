import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Shirt, Palette, Package, AlertTriangle, TrendingUp, Sparkles, Plus } from 'lucide-react';

const BRAND_COLORS = {
  CR: '#E11D48',
  RN: '#2563EB',
  HS: '#8B5CF6',
  DEFAULT: '#10B981',
};

const PIE_COLORS = ['#E11D48', '#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#6366F1'];

export function DashboardView({
  stats,
  onOpenCreate,
  onOpenDeduct,
}) {
  if (!stats) {
    return (
      <div className="py-20 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-rose-500 border-t-transparent" />
        <p className="text-xs text-slate-400 mt-2 font-mono">Carregando métricas do dashboard...</p>
      </div>
    );
  }

  const {
    total_pecas_quantidade = 0,
    total_estampas_quantidade = 0,
    total_geral_itens = 0,
    total_criticos = 0,
    brand_stats = [],
    top_designs = [],
    critical_items = [],
  } = stats;

  return (
    <div className="space-y-6">
      {/* Top KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Peças Prontas */}
        <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peças Prontas</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Shirt className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-white">{total_pecas_quantidade}</div>
            <span className="text-xs text-indigo-400 font-medium">Unidades finalizadas</span>
          </div>
        </div>

        {/* Card 2: Total Estampas Avulsas */}
        <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estampas Avulsas</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Palette className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-white">{total_estampas_quantidade}</div>
            <span className="text-xs text-rose-400 font-medium">Prontas para estampar</span>
          </div>
        </div>

        {/* Card 3: Total Geral */}
        <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Geral</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold font-mono text-white">{total_geral_itens}</div>
            <span className="text-xs text-emerald-400 font-medium">Itens no inventário</span>
          </div>
        </div>

        {/* Card 4: Estoque Crítico */}
        <div className="p-5 rounded-2xl bg-dark-800/80 border border-slate-800 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estoque Crítico</span>
            <div className={`p-2.5 rounded-xl ${total_criticos > 0 ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' : 'bg-slate-700/20 text-slate-400'}`}>
              <AlertTriangle className={`h-5 w-5 ${total_criticos > 0 ? 'animate-pulse' : ''}`} />
            </div>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-extrabold font-mono ${total_criticos > 0 ? 'text-amber-400' : 'text-white'}`}>
              {total_criticos}
            </div>
            <span className="text-xs text-amber-400 font-medium">&lt; 5 unidades disponíveis</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Brand Stock Distribution Bar Chart */}
        <div className="p-6 rounded-2xl bg-dark-800/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-rose-500" />
                Distribuição por Marca
              </h3>
              <p className="text-xs text-slate-400">Volume de Peças vs. Estampas</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={brand_stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="slug" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                />
                <Bar dataKey="pecas_quantidade" name="Peças Prontas" fill="#6366F1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="estampas_quantidade" name="Estampas" fill="#E11D48" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 Designs Pie Chart */}
        <div className="p-6 rounded-2xl bg-dark-800/90 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                Top 5 Designs com Maior Estoque
              </h3>
              <p className="text-xs text-slate-400">Total somado de peças e estampas</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {top_designs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={top_designs}
                    dataKey="total_quantidade"
                    nameKey="nome_design"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {top_designs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      color: '#f8fafc',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">Sem dados de designs para exibir.</p>
            )}
          </div>
        </div>
      </div>

      {/* Critical Stock Table */}
      <div className="p-6 rounded-2xl bg-dark-800/90 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Itens em Nível Crítico (&lt; 5 unidades)
            </h3>
            <p className="text-xs text-slate-400">Itens que necessitam de reposição imediata</p>
          </div>

          <button
            type="button"
            onClick={() => onOpenCreate('peca')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-700 text-white text-xs font-semibold self-start sm:self-auto transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Repor / Adicionar Estoque</span>
          </button>
        </div>

        {critical_items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-dark-900/60 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-700/60">
                <tr>
                  <th className="px-4 py-2.5">Categoria</th>
                  <th className="px-4 py-2.5">Marca</th>
                  <th className="px-4 py-2.5">SKU / Identificador</th>
                  <th className="px-4 py-2.5">Design</th>
                  <th className="px-4 py-2.5">Cor</th>
                  <th className="px-4 py-2.5 text-right">Qtd Atual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {critical_items.map((item, idx) => (
                  <tr key={`${item.tipo_item}-${item.id}-${idx}`} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300">
                        {item.tipo_item === 'peca' ? 'Peça' : 'Estampa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {item.brand_slug || item.brand_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300">
                      {item.sku || '-'}
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {item.nome_design || `#${item.codigo_estampa}`}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {item.cor}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-amber-400">
                      {item.quantidade} un
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center bg-dark-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-500">
            Nenhum item com estoque crítico no momento. Todos os itens possuem 5 ou mais unidades!
          </div>
        )}
      </div>
    </div>
  );
}

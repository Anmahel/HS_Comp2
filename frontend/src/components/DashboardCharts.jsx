import React, { useState, useEffect } from 'react';
import { TrendingUp, Sparkles } from 'lucide-react';

const PIE_COLORS = ['#E11D48', '#2563EB', '#8B5CF6', '#10B981', '#F59E0B', '#6366F1'];
const EMPTY_STATS = [];
const EMPTY_DESIGNS = [];

export function DashboardCharts({ brand_stats = EMPTY_STATS, top_designs = EMPTY_DESIGNS }) {
  const [recharts, setRecharts] = useState(null);

  useEffect(() => {
    let isMounted = true;
    import('recharts')
      .then((mod) => {
        if (isMounted) setRecharts(mod);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  if (!recharts) {
    return (
      <div className="h-64 rounded-2xl bg-dark-800/80 border border-slate-800 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
  } = recharts;

  return (
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
                  {top_designs.map((entry) => (
                    <Cell
                      key={`design-${entry.nome_design}-${entry.codigo_estampa}`}
                      fill={PIE_COLORS[top_designs.indexOf(entry) % PIE_COLORS.length]}
                    />
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
  );
}

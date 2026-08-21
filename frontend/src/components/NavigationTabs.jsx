import React from 'react';
import { Search, LayoutDashboard, Shirt, Palette, History, FileSpreadsheet, Clock, Printer, PackageCheck } from 'lucide-react';

export const ROLE_PERMISSIONS = {
  soporte: ['pedidos', 'historico_lotes'],
  jefe: ['dashboard'],
  admin: ['movimentacoes'],
  ing: ['movimentacoes'],
  separacion: ['pecas', 'verificador', 'pedidos_roles'],
  general: ['pecas', 'verificador', 'estampas'],
  geral: ['pecas', 'verificador', 'estampas'],
  imprenta: ['pedidos_roles'],
};

export function NavigationTabs({ activeTab, onSelectTab, counts = {}, userRole = 'geral' }) {
  const allTabs = [
    {
      id: 'pedidos',
      label: 'Processar Pedidos & PDFs',
      icon: FileSpreadsheet,
      badge: null,
      highlight: true,
    },
    {
      id: 'pedidos_roles',
      label: userRole === 'imprenta' ? 'Fila de Impressão' : (userRole === 'separacion' ? 'Separação & Despacho' : 'Painel de Pedidos'),
      icon: userRole === 'imprenta' ? Printer : PackageCheck,
      badge: counts.lotes !== undefined && counts.lotes > 0 ? `${counts.lotes}` : null,
      highlight: false,
    },
    {
      id: 'historico_lotes',
      label: 'Histórico de Lotes',
      icon: Clock,
      badge: counts.lotes !== undefined && counts.lotes > 0 ? `${counts.lotes} lote(s)` : null,
      highlight: false,
    },
    {
      id: 'verificador',
      label: 'Verificador SKU',
      icon: Search,
      badge: null,
      shortcut: 'Ctrl+K',
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: counts.critical > 0 ? `${counts.critical} alerta(s)` : null,
      badgeType: counts.critical > 0 ? 'critical' : 'normal',
    },
    {
      id: 'pecas',
      label: 'Peças Prontas',
      icon: Shirt,
      badge: counts.pecas !== undefined ? counts.pecas : null,
    },
    {
      id: 'estampas',
      label: 'Estampas Avulsas',
      icon: Palette,
      badge: counts.estampas !== undefined ? counts.estampas : null,
    },
    {
      id: 'movimentacoes',
      label: 'Auditoria & Logs',
      icon: History,
      badge: null,
    },
  ];

  // Filter tabs based on role permissions
  const normalizedRole = (userRole || 'geral').toLowerCase();
  const allowedTabIds = ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.geral;
  const visibleTabs = allTabs.filter((tab) => allowedTabIds.includes(tab.id));

  return (
    <nav className="bg-dark-900/60 border-b border-slate-800/80 sticky top-[65px] z-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive
                      ? tab.highlight ? 'text-rose-400' : 'text-rose-500'
                      : 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>

                {tab.shortcut && (
                  <span className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-dark-900 text-slate-400 border border-slate-700/60">
                    {tab.shortcut}
                  </span>
                )}

                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                      tab.badgeType === 'critical'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : tab.highlight
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

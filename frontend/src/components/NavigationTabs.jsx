import React from 'react';
import { Search, LayoutDashboard, Shirt, Palette, History } from 'lucide-react';

export function NavigationTabs({ activeTab, onSelectTab, counts = {} }) {
  const tabs = [
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

  return (
    <nav className="bg-dark-900/60 border-b border-slate-800/80 sticky top-[65px] z-20 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon
                  className={`h-4 w-4 ${
                    isActive ? 'text-rose-400' : 'text-slate-400'
                  }`}
                />
                <span>{tab.label}</span>

                {tab.shortcut && (
                  <span className="hidden sm:inline-block text-[10px] bg-slate-900/80 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/60 font-mono">
                    {tab.shortcut}
                  </span>
                )}

                {tab.badge !== null && tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium ${
                      tab.badgeType === 'critical'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse'
                        : 'bg-slate-700 text-slate-300'
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

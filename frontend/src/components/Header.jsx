import React from 'react';
import { Layers, Plus, Sun, Moon, ShieldCheck, User } from 'lucide-react';

const ROLES = [
  { id: 'soporte', label: 'Soporte (Agatha)', iconColor: 'text-rose-400' },
  { id: 'separacion', label: 'Separação', iconColor: 'text-indigo-400' },
  { id: 'geral', label: 'Geral', iconColor: 'text-emerald-400' },
  { id: 'jefe', label: 'Jefe / Diretoria', iconColor: 'text-amber-400' },
  { id: 'admin', label: 'Admin / Eng', iconColor: 'text-purple-400' },
];

export function Header({
  brands = [],
  selectedBrand,
  onSelectBrand,
  theme,
  onToggleTheme,
  onOpenCreate,
  userRole = 'soporte',
  onSelectRole,
}) {
  return (
    <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-600/20 ring-1 ring-white/20">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                HC_comp
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-medium border border-rose-500/30">
                  v2.0 PRO
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Controle de Estoque & Peças Prontas / Estampas
            </p>
          </div>
        </div>

        {/* Brand Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-800 rounded-xl border border-slate-800/80 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            data-testid="brand-filter-all"
            onClick={() => onSelectBrand('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
              selectedBrand === 'all'
                ? 'bg-gradient-to-r from-rose-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            Todas as Marcas
          </button>
          {brands.map((b) => {
            const isSelected = String(selectedBrand) === String(b.id);
            const isCR = b.slug === 'CR';
            const isRN = b.slug === 'RN';

            return (
              <button
                key={b.id}
                type="button"
                data-testid={`brand-filter-${b.slug.toLowerCase()}`}
                onClick={() => onSelectBrand(b.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  isSelected
                    ? isCR
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                      : isRN
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isCR ? 'bg-rose-400' : isRN ? 'bg-blue-400' : 'bg-emerald-400'
                  }`}
                />
                {b.name}
                <span className="text-[10px] opacity-75 font-mono">({b.slug})</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Role Switcher */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {/* RBAC Role Selector */}
          <div className="flex items-center gap-1.5 bg-dark-800 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs">
            <User className="h-3.5 w-3.5 text-rose-400" />
            <label htmlFor="role-select" className="sr-only">Selecionar Perfil RBAC</label>
            <select
              id="role-select"
              data-testid="select-user-role"
              aria-label="Selecionar Perfil RBAC"
              value={userRole}
              onChange={(e) => onSelectRole && onSelectRole(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
            >
              {ROLES.map((r) => (
                <option key={r.id} value={r.id} className="bg-dark-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-label="Alternar tema"
            className="p-2 rounded-xl bg-dark-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 border border-slate-700/50 transition-colors"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>

          {/* New Item Button */}
          <button
            type="button"
            data-testid="header-new-item-btn"
            onClick={() => onOpenCreate('peca')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-600/25 transition-colors active:scale-95"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Cadastrar Item</span>
          </button>
        </div>
      </div>
    </header>
  );
}

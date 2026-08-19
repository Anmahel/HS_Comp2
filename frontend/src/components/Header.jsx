import React from 'react';
import { Plus, Sun, Moon, ShieldCheck, User, LogOut, LogIn } from 'lucide-react';
import crLogo from '../Static/img/CR1_clean.png';

const ROLE_LABELS = {
  soporte: 'Soporte',
  separacion: 'Separação',
  geral: 'Geral',
  jefe: 'Jefe / Diretoria',
  admin: 'Admin / Eng',
  ing: 'Ing',
  imprenta: 'Imprenta',
};

export function Header({
  brands = [],
  selectedBrand,
  onSelectBrand,
  theme,
  onToggleTheme,
  onOpenCreate,
  user = null,
  onOpenLogin,
  onLogout,
}) {
  return (
    <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <img
            src={crLogo}
            alt="Clube Rock"
            className="h-8 w-auto object-contain shrink-0"
          />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
              HC_comp
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-medium border border-rose-500/30">
                v2.0 PRO
              </span>
            </h1>
          </div>
        </div>

        {/* Brand Selector Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-dark-800 rounded-xl border border-slate-800/80 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            type="button"
            data-testid="brand-filter-all"
            onClick={() => onSelectBrand('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${selectedBrand === 'all'
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
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${isSelected
                  ? isCR
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                    : isRN
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isCR ? 'bg-rose-400' : isRN ? 'bg-blue-400' : 'bg-emerald-400'
                    }`}
                />
                {b.name}
                <span className="text-[10px] opacity-75 font-mono">({b.slug})</span>
              </button>
            );
          })}
        </div>

        {/* Action Controls & Session */}
        <div className="flex items-center gap-2.5 self-end md:self-auto">
          {/* Session: login / user badge */}
          {user ? (
            <div
              data-testid="user-session-badge"
              className="flex items-center gap-1.5 bg-dark-800 px-2.5 py-1 rounded-xl border border-slate-700/60 text-xs"
              title={`${user.name} (${user.role})`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-slate-200 font-semibold">{user.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-700 font-mono text-rose-300 uppercase">
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <button
                type="button"
                data-testid="logout-btn"
                onClick={onLogout}
                title="Sair"
                aria-label="Sair do sistema"
                className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="login-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors"
            >
              <LogIn className="h-3.5 w-3.5 text-emerald-400" />
              Entrar
            </button>
          )}

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
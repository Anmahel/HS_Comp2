import React from 'react';
import { Plus, ShieldCheck, LogOut, LogIn } from 'lucide-react';
import crLogo from '../Static/img/CR1_clean.png';

const ROLE_LABELS = {
  soporte: 'Soporte',
  separacion: 'Separação',
  geral: 'Geral',
  jefe: 'Jefe / Diretoria',
  admin: 'Administrador / Eng',
  ing: 'Engenharia',
  imprenta: 'Imprenta',
};

export function Header({
  onOpenCreate,
  user = null,
  onOpenLogin,
  onLogout,
}) {
  return (
    <header className="border-b border-slate-800 bg-dark-900/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Logo & Title */}
        <div className="flex items-center gap-3">
          <img
            src={crLogo}
            alt="Clube Rock"
            className="h-8 w-auto object-contain shrink-0"
          />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              HC_comp
            </h1>
          </div>
        </div>

        {/* Action Controls & Session */}
        <div className="flex items-center gap-3">
          {/* Session: login / user badge */}
          {user ? (
            <div
              data-testid="user-session-badge"
              className="flex items-center gap-2.5 bg-dark-800/90 px-3 py-1.5 rounded-xl border border-slate-700/80 text-xs shadow-sm"
              title={`${user.name} (${ROLE_LABELS[user.role] || user.role})`}
            >
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-slate-200 font-bold leading-tight">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                  Tipo: <strong className="text-rose-400 uppercase font-semibold">{ROLE_LABELS[user.role] || user.role}</strong>
                </span>
              </div>
              <button
                type="button"
                data-testid="logout-btn"
                onClick={onLogout}
                title="Sair"
                aria-label="Sair do sistema"
                className="ml-1 p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              data-testid="login-btn"
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/60 transition-colors shadow-sm"
            >
              <LogIn className="h-4 w-4 text-emerald-400" />
              Entrar
            </button>
          )}

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
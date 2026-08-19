import React, { useState } from 'react';
import { Lock, User, LogIn, Shield, CheckCircle2 } from 'lucide-react';
import logoCR1 from '../Static/img/CR1_clean.png';

export function LoginView({ onLogin }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await onLogin(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Credenciais inválidas. Verifique usuário e senha.');
    } finally {
      setSubmitting(false);
    }
  };

  const setDemoCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-dark-900 px-4 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-dark-800 border border-slate-700/80 rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-3 pb-6 border-b border-slate-700/60">
          <div className="inline-flex items-center justify-center">
            <img
              src={logoCR1}
              alt="Clube Rock"
              className="h-12 w-auto object-contain drop-shadow-[0_0_12px_rgba(225,29,72,0.35)]"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              HC_comp <span className="text-rose-500 text-xs font-mono px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/30">v2.0 PRO</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Sistema de Gestão de Estoque & Produção Olist / Tiny
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-6">
          {/* Username Input */}
          <div className="space-y-1.5">
            <label htmlFor="view-username" className="block text-xs font-semibold text-slate-200">
              Usuário <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="view-username"
                data-testid="login-view-username"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: admin"
                className="w-full pl-10 pr-3 py-2.5 bg-dark-900 text-white text-xs rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label htmlFor="view-password" className="block text-xs font-semibold text-slate-200">
              Senha <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              <input
                id="view-password"
                data-testid="login-view-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-dark-900 text-white text-xs rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              data-testid="login-view-error"
              className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            data-testid="login-view-submit-btn"
            disabled={submitting || !username.trim() || !password}
            className={`w-full py-3 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
              !submitting && username.trim() && password
                ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-rose-600/30 cursor-pointer active:scale-[0.99]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Acessar Painel
              </>
            )}
          </button>

          {/* Demo Quick Select */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-rose-400" />
              Contas de Acesso Rápido:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoCredentials('admin', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
              >
                👑 <span className="font-semibold">Admin</span> / Eng
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('soporte', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
              >
                🎧 <span className="font-semibold">Agatha</span> (Soporte)
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('imprenta', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-rose-300 rounded-lg border border-rose-500/40 text-left transition-colors truncate"
              >
                🖨️ <span className="font-semibold">Imprenta</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('separacion', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-indigo-300 rounded-lg border border-indigo-500/40 text-left transition-colors truncate"
              >
                📦 <span className="font-semibold">Separación</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('geral', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
              >
                👥 <span className="font-semibold">Geral</span>
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('jefe', 'admin123')}
                className="px-2.5 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 rounded-lg border border-slate-700 text-left transition-colors truncate"
              >
                💼 <span className="font-semibold">Diretoria</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

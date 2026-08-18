import React, { useState } from 'react';
import { X, Lock, User, LogIn } from 'lucide-react';

export function LoginModal({
  isOpen,
  onClose,
  onLogin,
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setSubmitting(true);
    setError(null);
    try {
      await onLogin(username.trim(), password);
      setUsername('');
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.message || 'Falha na autenticação');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-dark-800 border border-slate-700 shadow-2xl p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 id="login-title" className="text-base font-bold text-white">
                Acesso ao Sistema
              </h3>
              <p className="text-xs text-slate-400 font-mono">Autenticação de usuário</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de login"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-xs font-semibold text-slate-200">
              Usuário <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="login-username"
                data-testid="login-username-input"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nome de usuário"
                className="w-full pl-9 pr-3 py-2.5 bg-dark-900 text-white text-xs rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-slate-200">
              Senha <span className="text-rose-400 font-bold">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                id="login-password"
                data-testid="login-password-input"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-dark-900 text-white text-xs rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {error && (
            <div
              data-testid="login-error"
              className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-medium"
            >
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="login-submit-btn"
              disabled={submitting || !username.trim() || !password}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-colors flex items-center gap-1.5 ${
                !submitting && username.trim() && password
                  ? 'bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 shadow-rose-600/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <LogIn className="h-3.5 w-3.5" />
                  Entrar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
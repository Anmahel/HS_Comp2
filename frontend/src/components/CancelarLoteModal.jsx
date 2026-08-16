import React, { useState } from 'react';
import { X, AlertTriangle, RotateCcw } from 'lucide-react';

export function CancelarLoteModal({
  isOpen,
  lote,
  onClose,
  onConfirm,
}) {
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !lote) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!motivo.trim()) return;

    setSubmitting(true);
    try {
      await onConfirm(lote.id, motivo.trim());
      setMotivo('');
    } finally {
      setSubmitting(false);
    }
  };

  const totalRestaurar = (lote.total_descontado_pecas || 0) + (lote.total_descontado_estampas || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg rounded-2xl bg-dark-800 border border-slate-700 shadow-2xl p-6 relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 id="cancelar-lote-title" className="text-base font-bold text-white">
                Cancelar Lote #{lote.id} & Estornar Estoque
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Arquivo: {lote.nome_arquivo}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de cancelamento"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          {/* Warning banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Reversão Atômica de Inventário
            </p>
            <p className="text-[11px] text-amber-200/90 leading-relaxed">
              O cancelamento deste lote devolverá <b>{lote.total_descontado_pecas || 0} peças prontas</b> e{' '}
              <b>{lote.total_descontado_estampas || 0} estampas</b> de volta ao estoque disponível ({totalRestaurar} itens no total).
              Um registro de auditoria tipo <code className="font-mono bg-dark-900 px-1 py-0.5 rounded">ENTRADA</code> será gravado permanentemente.
            </p>
          </div>

          {/* Mandatory reason field */}
          <div className="space-y-1.5">
            <label htmlFor="motivo-cancelamento" className="block text-xs font-semibold text-slate-200">
              Motivo do Cancelamento <span className="text-rose-400 font-bold">*</span>
            </label>
            <textarea
              id="motivo-cancelamento"
              data-testid="input-motivo-cancelamento"
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva obrigatoriamente o motivo do cancelamento (ex: Pedido duplicado pelo cliente, erro na planilha de separação...)"
              className="w-full px-3 py-2.5 bg-dark-900 text-white text-xs rounded-xl border border-slate-700 focus:border-rose-500 focus:outline-none transition-colors"
            />
            <span className="text-[10px] text-slate-500">
              Campo obrigatório para registro de conformidade e auditoria (RBAC).
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Voltar
            </button>
            <button
              type="submit"
              data-testid="btn-confirmar-cancelamento"
              disabled={submitting || !motivo.trim()}
              className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-colors flex items-center gap-1.5 ${
                !submitting && motivo.trim()
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                  Estornando...
                </>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Confirmar Estorno & Cancelamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

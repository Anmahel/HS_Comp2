import React, { useState, useEffect } from 'react';
import { X, MinusCircle, AlertCircle, Check } from 'lucide-react';

export function ModalUsarEstoque({
  isOpen,
  item,
  category = 'peca',
  onClose,
  onConfirm,
}) {
  const [quantidade, setQuantidade] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setQuantidade(1);
      setSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const maxAvailable = item.quantidade || 0;
  const isInvalid = quantidade <= 0 || quantidade > maxAvailable;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isInvalid) return;

    setSubmitting(true);
    await onConfirm(item.id, category, parseInt(quantidade, 10));
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-dark-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-dark-900/60">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <MinusCircle className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Dar Baixa no Estoque</h3>
              <p className="text-[11px] text-slate-400">
                {category === 'peca' ? 'Peça Pronta' : 'Estampa Avulsa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Item Summary Card */}
          <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-700/60 space-y-1.5 text-xs">
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">SKU:</span>
              <span className="font-semibold text-white">{item.sku}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Design:</span>
              <span className="font-medium text-slate-200">{item.nome_design}</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-400">Estoque Atual:</span>
              <span className="font-bold text-emerald-400">{maxAvailable} unidade(s)</span>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Quantidade para dar baixa:
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.max(1, q - 1))}
                className="px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 font-mono font-bold hover:bg-slate-700 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={maxAvailable}
                value={quantidade}
                onChange={(e) => setQuantidade(parseInt(e.target.value, 10) || 0)}
                className="w-full text-center py-2 bg-dark-900 text-white rounded-xl border border-slate-700 font-mono font-bold text-sm focus:border-rose-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setQuantidade((q) => Math.min(maxAvailable, q + 1))}
                className="px-3 py-2 bg-dark-900 text-white rounded-xl border border-slate-700 font-mono font-bold hover:bg-slate-700 transition-colors"
              >
                +
              </button>
            </div>

            {quantidade > maxAvailable && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="h-3 w-3" />
                Quantidade excede o estoque disponível ({maxAvailable}).
              </p>
            )}
          </div>

          {/* Remaining Stock Preview */}
          <div className="flex items-center justify-between text-xs font-mono p-2.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <span className="text-slate-400">Estoque restante pós-baixa:</span>
            <span className={`font-bold ${maxAvailable - quantidade < 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {Math.max(0, maxAvailable - quantidade)} un
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="confirm-deduct-btn"
              disabled={isInvalid || submitting}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-semibold shadow-md shadow-rose-600/30 transition-all active:scale-95"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{submitting ? 'Processando...' : 'Confirmar Baixa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

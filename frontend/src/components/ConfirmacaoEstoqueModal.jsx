import React from 'react';
import { AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

export function ConfirmacaoEstoqueModal({
  isOpen,
  isEditing,
  generatedSku,
  summaryData,
  onCancel,
  onConfirm,
  submitting,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-dark-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-dark-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? 'Confirmar Atualização' : 'Confirmar Cadastro'}
              </h3>
              <p className="text-[11px] text-slate-400">Verifique os dados antes de gravar no estoque</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar modal de confirmação"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-dark-900/90 border border-slate-700/80 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">SKU Gerado:</span>
              <span className="font-mono font-bold text-rose-300">{generatedSku}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Marca:</span>
              <span className="font-semibold text-white">{summaryData.brandName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Design:</span>
              <span className="font-medium text-white">{summaryData.designName} (#{summaryData.codigoEstampa})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Cor do Tecido:</span>
              <span className="font-semibold text-slate-200">{summaryData.corName}</span>
            </div>
            {summaryData.tipoName && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Tipo / Tamanho:</span>
                <span className="font-semibold text-slate-200">{summaryData.tipoName} • {summaryData.tamanhoName}</span>
              </div>
            )}
            <div className="flex justify-between items-center border-t border-slate-800 pt-2 font-mono">
              <span className="text-slate-400">Quantidade:</span>
              <span className="font-bold text-sm text-emerald-400">{summaryData.quantidade} unidade(s)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic">
            * Se já existir um item com esta combinação exata, o sistema somará a quantidade informada ao estoque existente (UPSERT).
          </p>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700 transition-colors"
            >
              Voltar e Ajustar
            </button>
            <button
              type="button"
              data-testid="final-confirm-submit-btn"
              disabled={submitting}
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-rose-600/30 transition-colors active:scale-95"
            >
              <Check className="h-4 w-4" />
              <span>{submitting ? 'Gravando...' : 'Gravar no Estoque'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

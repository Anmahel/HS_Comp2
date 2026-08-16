import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';

export function ProcessadorPreviewCard({
  previewData,
  processing,
  canProcess,
  onReset,
  onSubmit,
}) {
  if (!previewData) return null;

  return (
    <div className="space-y-5 rounded-2xl border border-slate-800 bg-dark-800/90 p-6 shadow-xl animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Prévia da Análise de Desconto em Cascada
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            Arquivo: {previewData.filename} • {previewData.total_itens} unidades solicitadas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="px-3 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Descartar
          </button>
          <button
            type="button"
            data-testid="btn-processar-lote"
            onClick={onSubmit}
            disabled={processing || !canProcess}
            className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-colors flex items-center gap-2 ${
              canProcess
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {processing ? (
              <>
                <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                Processando Lote...
              </>
            ) : (
              <>
                <span>Processar Lote & Descontar Estoque</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4 Simulation KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Total Pedidos</span>
          <div className="text-2xl font-bold font-mono text-white mt-1">{previewData.total_itens}</div>
          <span className="text-[11px] text-slate-400">Total de unidades</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-indigo-500/30">
          <span className="text-[11px] font-semibold text-indigo-400 uppercase">Almoxarifado (Peças)</span>
          <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">{previewData.total_descontado_pecas}</div>
          <span className="text-[11px] text-indigo-400/80">Atendidas por peça pronta</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-amber-500/30">
          <span className="text-[11px] font-semibold text-amber-400 uppercase">Almoxarifado (Estampas)</span>
          <div className="text-2xl font-bold font-mono text-amber-300 mt-1">{previewData.total_descontado_estampas}</div>
          <span className="text-[11px] text-amber-400/80">Atendidas por estampa avulsa</span>
        </div>

        <div className="p-4 rounded-xl bg-dark-900 border border-rose-500/30">
          <span className="text-[11px] font-semibold text-rose-400 uppercase">Fila de Impressão</span>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{previewData.total_necessita_impressao}</div>
          <span className="text-[11px] text-rose-400/80">Necessitam nova estampa</span>
        </div>
      </div>

      {/* Preview Items Table */}
      <div className="rounded-xl border border-slate-800 overflow-hidden">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="px-4 py-2.5">SKU Original</th>
              <th className="px-4 py-2.5">Produto</th>
              <th className="px-4 py-2.5 text-center">Qtd Total</th>
              <th className="px-4 py-2.5 text-center text-indigo-300">Peça Pronta</th>
              <th className="px-4 py-2.5 text-center text-amber-300">Estampa Avulsa</th>
              <th className="px-4 py-2.5 text-center text-rose-400">A Imprimir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {previewData.items.map((it) => (
              <tr
                key={`preview-${it.sku_original}-${it.quantidade_solicitada}-${it.quantidade_necessita_impressao}`}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="px-4 py-2.5 font-mono font-semibold text-slate-200">
                  {it.sku_original}
                </td>
                <td className="px-4 py-2.5 text-slate-300">{it.produto_nome}</td>
                <td className="px-4 py-2.5 text-center font-mono font-bold">{it.quantidade_solicitada}</td>
                <td className="px-4 py-2.5 text-center font-mono text-indigo-400">
                  {it.quantidade_descontada_peca > 0 ? `${it.quantidade_descontada_peca} un` : '-'}
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-amber-400">
                  {it.quantidade_descontada_estampa > 0 ? `${it.quantidade_descontada_estampa} un` : '-'}
                </td>
                <td className="px-4 py-2.5 text-center font-mono text-rose-400 font-bold">
                  {it.quantidade_necessita_impressao > 0 ? `${it.quantidade_necessita_impressao} un` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

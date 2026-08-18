import React from 'react';
import { CheckCircle2, Printer, PackageCheck, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';

async function downloadPdf(endpoint, filename) {
  try {
    await api.downloadPdf(endpoint, filename);
    toast.success(`PDF "${filename}" baixado com sucesso!`);
  } catch (e) {
    toast.error(e.message || 'Erro ao baixar PDF');
  }
}

export function ProcessadorSuccessCard({
  lote,
  onReset,
}) {
  if (!lote) return null;

  const handleShareWhatsApp = async () => {
    try {
      const res = await api.getWhatsappShareLink(lote.id);
      if (res.whatsapp_link) {
        window.open(res.whatsapp_link, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      toast.error('Erro ao gerar link do WhatsApp');
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 shadow-2xl space-y-4 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Lote #{lote.id} Processado & Descontado com Sucesso!
            </h3>
            <p className="text-xs text-emerald-300 font-mono">
              Arquivo: {lote.nome_arquivo} • Total: {lote.total_itens} itens
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
        >
          Processar Novo Arquivo
        </button>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
          <span className="text-[11px] text-indigo-400 font-semibold block">Peças Almoxarifado (PDF 2)</span>
          <span className="text-xl font-bold font-mono text-white">{lote.total_descontado_pecas} un</span>
        </div>
        <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
          <span className="text-[11px] text-amber-400 font-semibold block">Estampas Almoxarifado (PDF 2)</span>
          <span className="text-xl font-bold font-mono text-white">{lote.total_descontado_estampas} un</span>
        </div>
        <div className="p-3.5 rounded-xl bg-dark-900/80 border border-slate-800">
          <span className="text-[11px] text-rose-400 font-semibold block">Fila de Impressão (PDF 1)</span>
          <span className="text-xl font-bold font-mono text-white">{lote.total_necessita_impressao} un</span>
        </div>
      </div>

      {/* Action Downloads & WhatsApp */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={() => downloadPdf(`/pedidos/lotes/${lote.id}/pdf-imprenta`, `lote_${lote.id}_imprenta.pdf`)}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-2"
        >
          <Printer className="h-4 w-4" />
          Baixar PDF 1 (Imprenta / Produção)
        </button>

        <button
          type="button"
          onClick={() => downloadPdf(`/pedidos/lotes/${lote.id}/pdf-separacao`, `lote_${lote.id}_separacao.pdf`)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-2"
        >
          <PackageCheck className="h-4 w-4" />
          Baixar PDF 2 (Separação / Almoxarifado)
        </button>

        <button
          type="button"
          onClick={handleShareWhatsApp}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition-colors flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Enviar Resumo via WhatsApp
        </button>
      </div>
    </div>
  );
}

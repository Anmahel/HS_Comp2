import React, { useState } from 'react';
import { CheckCircle2, Printer, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';

export function ProcessadorSuccessCard({
  lote,
  onReset,
}) {
  const [downloadingPdf1, setDownloadingPdf1] = useState(false);
  const [downloadingPdf2, setDownloadingPdf2] = useState(false);
  const [hasPdf1, setHasPdf1] = useState(Boolean(lote?.has_pdf1));
  const [hasPdf2, setHasPdf2] = useState(Boolean(lote?.has_pdf2));

  if (!lote) return null;

  const handleDownloadPdf1 = async () => {
    setDownloadingPdf1(true);
    try {
      await api.downloadPdf(`/pedidos/lotes/${lote.id}/pdf-imprenta`, `lote_${lote.id}_imprenta.pdf`);
      await api.registrarEmissaoPdf(lote.id, 'PDF1');
      setHasPdf1(true);
      toast.success(`PDF 1 (S - Imprenta) baixado! Notificação emitida para Imprenta, Separação e Geral.`);
    } catch (e) {
      toast.error(e.message || 'Erro ao baixar PDF 1');
    } finally {
      setDownloadingPdf1(false);
    }
  };

  const handleDownloadPdf2 = async () => {
    setDownloadingPdf2(true);
    try {
      await api.downloadPdf(`/pedidos/lotes/${lote.id}/pdf-separacao`, `lote_${lote.id}_separacao.pdf`);
      await api.registrarEmissaoPdf(lote.id, 'PDF2');
      setHasPdf2(true);
      toast.success(`PDF 2 (P - Separação) baixado! Notificação emitida para Separação e Geral.`);
    } catch (e) {
      toast.error(e.message || 'Erro ao baixar PDF 2');
    } finally {
      setDownloadingPdf2(false);
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
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Lote #{lote.id} Processado com Sucesso!
              {hasPdf1 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  (S) PDF 1 Ativo
                </span>
              )}
              {hasPdf2 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  (P) PDF 2 Ativo
                </span>
              )}
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

      {/* Action Downloads with Event Dispatching */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="button"
          onClick={handleDownloadPdf1}
          disabled={downloadingPdf1}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          {downloadingPdf1 ? 'Baixando PDF 1...' : 'Baixar PDF 1 (S - Imprenta)'}
        </button>

        <button
          type="button"
          onClick={handleDownloadPdf2}
          disabled={downloadingPdf2}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <PackageCheck className="h-4 w-4" />
          {downloadingPdf2 ? 'Baixando PDF 2...' : 'Baixar PDF 2 (P - Separação)'}
        </button>
      </div>
    </div>
  );
}

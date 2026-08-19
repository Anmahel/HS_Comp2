import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Download, Eye, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';

const IMPRENTA_PAGE_SIZE = 5;
const EMPTY_LOTES = [];

async function handleDownloadPdf1(lote) {
  try {
    await api.downloadPdf(`/pedidos/lotes/${lote.id}/pdf-imprenta`, `PDF_Imprenta_Lote_${lote.id}.pdf`);
    await api.registrarEmissaoPdf(lote.id, 'PDF1');
    toast.success(`PDF 1 (S) baixado! Notificação emitida com sucesso.`);
  } catch (e) {
    toast.error(e.message || 'Erro ao baixar PDF 1');
  }
}

export function ImprentaOrdersList({ lotes = EMPTY_LOTES, loading = false, onOpenModal }) {
  const [currentPage, setCurrentPage] = useState(1);

  const sortedLotes = lotes.slice().sort((a, b) => (b.id || 0) - (a.id || 0));
  const totalItems = sortedLotes.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / IMPRENTA_PAGE_SIZE));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (safePage - 1) * IMPRENTA_PAGE_SIZE;
  const currentLotes = sortedLotes.slice(startIndex, startIndex + IMPRENTA_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-dark-800/90 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-dark-900 text-[11px] font-bold text-slate-400 uppercase font-mono border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Lote</th>
              <th className="px-4 py-3">Data de Envio</th>
              <th className="px-4 py-3 text-center">Qtd Total Pedidos</th>
              <th className="px-4 py-3 text-center text-rose-400">Só a Imprimir</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  <div className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-2 border-rose-500 border-t-transparent" />
                    Carregando lotes de impressão...
                  </div>
                </td>
              </tr>
            ) : currentLotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  Nenhum lote enviado para impressão até o momento.
                </td>
              </tr>
            ) : (
              currentLotes.map((lote) => (
                <tr key={`imprenta-lote-${lote.id}`} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-white">
                    #{lote.id}
                    <span className="block text-[10px] text-slate-500 font-normal font-sans truncate max-w-[150px]">
                      {lote.nome_arquivo}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-slate-300 font-mono">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {lote.created_at ? new Date(lote.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A'}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-center font-mono font-bold text-slate-200">
                    {lote.total_itens} un
                  </td>

                  <td className="px-4 py-3 text-center font-mono">
                    <span className="px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                      {lote.total_necessita_impressao} un
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      lote.status === 'CANCELADO'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {lote.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPdf1(lote)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 font-semibold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Descargar PDF</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onOpenModal(lote)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Ver Dados</span>
                      </button>

                      <button
                        type="button"
                        disabled
                        title="Impressão direta em desenvolvimento"
                        className="p-1.5 rounded-lg bg-dark-900 border border-slate-800 text-slate-600 cursor-not-allowed"
                      >
                        <Printer className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-2">
        <span>
          Mostrando {totalItems > 0 ? startIndex + 1 : 0} a {Math.min(startIndex + IMPRENTA_PAGE_SIZE, totalItems)} de {totalItems} lotes
        </span>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            aria-label="Página anterior"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 py-1 bg-dark-900 rounded-lg border border-slate-800 font-mono text-slate-300">
            Página <strong className="text-white">{safePage}</strong> de <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            aria-label="Próxima página"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

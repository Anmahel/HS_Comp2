import React from 'react';
import {
  AlertTriangle, CheckCircle2,
  XCircle, Clock, Printer, PackageCheck
} from 'lucide-react';
import { api } from '../api';

const EMPTY_LOTES = [];

export function HistoricoLotesTable({
  lotes = EMPTY_LOTES,
  loading = false,
  onOpenCancelModal,
  userRole = 'soporte',
}) {
  const canCancel = ['soporte', 'jefe', 'admin', 'ing'].includes(userRole);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-rose-500" />
            Histórico de Lotes Processados
          </h3>
          <p className="text-xs text-slate-400">
            Registro de todas as planilhas ingeridas, descontos em cascata e auditoria de cancelamentos.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-dark-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-dark-900/90 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 font-mono">
              <tr>
                <th className="px-4 py-3.5">Lote</th>
                <th className="px-4 py-3.5">Arquivo & Origem</th>
                <th className="px-4 py-3.5">Data & Responsável</th>
                <th className="px-4 py-3.5 text-center">Total Pedidos</th>
                <th className="px-4 py-3.5 text-center text-indigo-400">Peças Almoxarifado</th>
                <th className="px-4 py-3.5 text-center text-amber-400">Estampas Almox.</th>
                <th className="px-4 py-3.5 text-center text-rose-400">Fila Impressão</th>
                <th className="px-4 py-3.5 text-center">Status</th>
                <th className="px-4 py-3.5 text-center">PDFs & Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-rose-500 border-t-transparent mb-2" />
                    <p className="font-mono text-xs">Carregando lotes...</p>
                  </td>
                </tr>
              ) : lotes.length > 0 ? (
                lotes.map((lote) => {
                  const isCanceled = lote.is_deleted || lote.status === 'CANCELADO';
                  return (
                    <tr
                      key={lote.id}
                      data-testid={`row-lote-${lote.id}`}
                      className={`transition-colors ${
                        isCanceled ? 'bg-slate-900/40 opacity-75' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-mono font-bold text-slate-200">
                        #{lote.id}
                      </td>

                      {/* Arquivo */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-white truncate max-w-[180px]" title={lote.nome_arquivo}>
                          {lote.nome_arquivo}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {lote.formato_origem}
                        </span>
                      </td>

                      {/* Data & Usuário */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-300">
                        <div>{lote.created_at ? new Date(lote.created_at).toLocaleString('pt-BR') : '-'}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{lote.usuario_responsavel}</div>
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-sm text-white">
                        {lote.total_itens}
                      </td>

                      {/* Peças Prontas */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-sm text-indigo-300">
                        {lote.total_descontado_pecas}
                      </td>

                      {/* Estampas */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-sm text-amber-300">
                        {lote.total_descontado_estampas}
                      </td>

                      {/* Impressão */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-sm text-rose-400">
                        {lote.total_necessita_impressao}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isCanceled ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="h-3 w-3" />
                              CANCELADO
                            </span>
                            {lote.motivo_cancelamento && (
                              <div
                                className="text-[10px] text-slate-400 italic truncate max-w-[140px]"
                                title={`Motivo: ${lote.motivo_cancelamento}`}
                              >
                                {lote.motivo_cancelamento}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3" />
                            PROCESSADO
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* PDF 1: Imprenta */}
                          <a
                            href={api.getPdfImprentaUrl(lote.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Baixar PDF 1 (Imprenta / Produção)"
                            aria-label={`Baixar PDF 1 de Imprenta para lote ${lote.id}`}
                            className="p-1.5 rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500 hover:text-white border border-rose-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            <span>PDF 1</span>
                          </a>

                          {/* PDF 2: Separação */}
                          <a
                            href={api.getPdfSeparacaoUrl(lote.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Baixar PDF 2 (Separação / Almoxarifado)"
                            aria-label={`Baixar PDF 2 de Separação para lote ${lote.id}`}
                            className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-300 hover:bg-indigo-500 hover:text-white border border-indigo-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                          >
                            <PackageCheck className="h-3.5 w-3.5" />
                            <span>PDF 2</span>
                          </a>

                          {/* Cancel button if active */}
                          {!isCanceled && canCancel && (
                            <button
                              type="button"
                              onClick={() => onOpenCancelModal(lote)}
                              title="Cancelar lote e estornar estoque"
                              aria-label={`Cancelar lote ${lote.id}`}
                              className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white border border-slate-700 transition-colors"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-500 text-xs">
                    Nenhum lote de pedidos processado até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

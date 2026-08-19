import React from 'react';
import { PackageCheck, Calendar } from 'lucide-react';

const EMPTY_LOTES = [];

export function SeparacaoSidebar({
  lotes = EMPTY_LOTES,
  selectedId,
  onSelectLote,
}) {
  return (
    <div className="w-full lg:w-[30%] shrink-0 space-y-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
          <PackageCheck className="h-4 w-4 text-indigo-400" />
          Lotes para Separação ({lotes.length})
        </h2>
        <span className="text-[11px] text-slate-500 font-mono">Por data</span>
      </div>

      {lotes.length === 0 ? (
        <div className="p-8 rounded-2xl bg-dark-800/60 border border-slate-800 text-center text-xs text-slate-500">
          Nenhum lote disponível para separação.
        </div>
      ) : (
        <div className="max-h-[780px] overflow-y-auto space-y-2.5 pr-1 no-scrollbar">
          {lotes.map((lote) => {
            const isSelected = selectedId === lote.id;
            const hasS = Boolean(lote.has_pdf1);
            const hasP = Boolean(lote.has_pdf2);

            return (
              <button
                key={`sidebar-lote-${lote.id}`}
                type="button"
                onClick={() => onSelectLote(lote.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-950/50'
                    : 'bg-dark-800/80 border-slate-800 hover:border-slate-700 hover:bg-dark-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-sm text-white">
                    Lote #{lote.id}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      lote.status === 'CANCELADO'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {lote.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 truncate mt-1 font-medium">
                  {lote.nome_arquivo}
                </p>

                <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/60 text-[11px]">
                  <span className="text-slate-400 font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-slate-500" />
                    {lote.created_at
                      ? new Date(lote.created_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                      : 'N/A'}
                  </span>

                  {/* Circular Badges (S) and (P) */}
                  <div className="flex items-center gap-1.5">
                    <span
                      title={hasS ? 'PDF 1 (S - Imprenta/Separação) Disponível' : 'PDF 1 (S) Pendente'}
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] ${
                        hasS
                          ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      S
                    </span>
                    <span
                      title={hasP ? 'PDF 2 (P - Produção/Separação) Disponível' : 'PDF 2 (P) Pendente'}
                      className={`h-5 w-5 rounded-full flex items-center justify-center font-mono font-black text-[10px] ${
                        hasP
                          ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}
                    >
                      P
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

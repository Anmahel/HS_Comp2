import React, { useState } from 'react';
import { Download, Check, Shirt, Palette, Layers, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { SeparacaoSidebar } from './SeparacaoSidebar';
import { SeparacaoItemsTable } from './SeparacaoItemsTable';

const EMPTY_LOTES = [];

async function handleDownloadPdf2(lote) {
  try {
    await api.downloadPdf(`/pedidos/lotes/${lote.id}/pdf-separacao`, `PDF_Separacao_Lote_${lote.id}.pdf`);
    await api.registrarEmissaoPdf(lote.id, 'PDF2');
    toast.success(`PDF 2 (P) baixado! Notificação emitida com sucesso.`);
  } catch (e) {
    toast.error(e.message || 'Erro ao baixar PDF 2');
  }
}

export function SeparacaoDespacho({ lotes = EMPTY_LOTES }) {
  const sortedLotes = lotes.slice().sort((a, b) => (b.id || 0) - (a.id || 0));

  const [selectedId, setSelectedId] = useState(sortedLotes[0]?.id || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedItems, setCheckedItems] = useState({});

  const activeLote = sortedLotes.find((l) => l.id === selectedId) || sortedLotes[0] || null;

  const handleSelectLote = (loteId) => {
    setSelectedId(loteId);
    setCurrentPage(1);
  };

  const toggleCheck = (itemKey) => {
    setCheckedItems((prev) => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const items = activeLote?.itens || [];
  const totalItems = items.length;
  const totalCheckedForLote = items.filter((_, idx) => checkedItems[`${activeLote?.id}-${idx}`]).length;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn items-start">
      {/* Columna Izquierda: Sidebar de Lotes */}
      <SeparacaoSidebar
        lotes={sortedLotes}
        selectedId={activeLote?.id}
        onSelectLote={handleSelectLote}
      />

      {/* Columna Derecha: Panel Principal Detallado */}
      <div className="flex-1 w-full space-y-5">
        {!activeLote ? (
          <div className="p-16 rounded-2xl bg-dark-800/60 border border-slate-800 text-center text-slate-500">
            Selecione um lote no menu lateral para visualizar os dados e realizar a separação.
          </div>
        ) : (
          <>
            {/* Header of Active Lote */}
            <div className="p-5 rounded-2xl bg-dark-800/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">
                    Lote #{activeLote.id} • {activeLote.nome_arquivo}
                  </h2>
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-mono font-extrabold text-xs ${
                      activeLote.has_pdf1
                        ? 'bg-rose-500 text-white shadow-rose-500/40 ring-2 ring-rose-400/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    title={activeLote.has_pdf1 ? 'PDF 1 (S) Emitido' : 'PDF 1 (S) Pendente'}
                  >
                    S
                  </span>
                  <span
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-mono font-extrabold text-xs ${
                      activeLote.has_pdf2
                        ? 'bg-indigo-500 text-white shadow-indigo-500/40 ring-2 ring-indigo-400/40'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                    title={activeLote.has_pdf2 ? 'PDF 2 (P) Emitido' : 'PDF 2 (P) Pendente'}
                  >
                    P
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Data: {activeLote.created_at ? new Date(activeLote.created_at).toLocaleString('pt-BR') : 'N/A'} • Responsável: {activeLote.usuario_responsavel}
                </p>
              </div>

              {/* Action Button: Baixar PDF 2 */}
              <button
                type="button"
                onClick={() => handleDownloadPdf2(activeLote)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Download className="h-4 w-4" />
                Baixar PDF 2 (Separação)
              </button>
            </div>

            {/* Zona Superior: 4 Tarjetas KPI en Fila Horizontal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Prontas */}
              <div className="p-4 rounded-xl bg-dark-900 border border-indigo-500/30">
                <span className="text-[11px] font-semibold text-indigo-400 uppercase flex items-center gap-1">
                  <Shirt className="h-3.5 w-3.5" /> Prontas
                </span>
                <div className="text-2xl font-bold font-mono text-indigo-300 mt-1">
                  {activeLote.total_descontado_pecas} un
                </div>
                <span className="text-[10px] text-indigo-400/70">Peças Prontas</span>
              </div>

              {/* 2. Estampas */}
              <div className="p-4 rounded-xl bg-dark-900 border border-amber-500/30">
                <span className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" /> Estampas
                </span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {activeLote.total_descontado_estampas} un
                </div>
                <span className="text-[10px] text-amber-400/70">Estampas Avulsas</span>
              </div>

              {/* 3. Total */}
              <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Total
                </span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {activeLote.total_itens} un
                </div>
                <span className="text-[10px] text-slate-400">Total Pedidos</span>
              </div>

              {/* 4. Faltan */}
              <div className="p-4 rounded-xl bg-dark-900 border border-rose-500/30">
                <span className="text-[11px] font-semibold text-rose-400 uppercase flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Faltan
                </span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {activeLote.total_necessita_impressao} un
                </div>
                <span className="text-[10px] text-rose-400/70">Fila Impressão</span>
              </div>
            </div>

            {/* Checklist progress bar */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between px-4 py-2.5 bg-dark-800/80 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-300">
                  Progresso da Separação (Checklist): <strong className="text-emerald-400 font-mono">{totalCheckedForLote} / {totalItems}</strong> concluídos
                </span>
                {totalCheckedForLote === totalItems && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> 100% Conferido
                  </span>
                )}
              </div>
            )}

            {/* Zona Inferior: LISTA DE DATOS */}
            <SeparacaoItemsTable
              items={items}
              loteId={activeLote.id}
              checkedItems={checkedItems}
              onToggleCheck={toggleCheck}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Eye, Shirt, Palette, Layers, AlertCircle } from 'lucide-react';
import { SeparacaoSidebar } from './SeparacaoSidebar';
import { SeparacaoItemsTable } from './SeparacaoItemsTable';
import { DetalhesPedidoModal } from './DetalhesPedidoModal';

const EMPTY_LOTES = [];

export function SeparacaoDespacho({ lotes = EMPTY_LOTES }) {
  const sortedLotes = lotes.slice().sort((a, b) => (b.id || 0) - (a.id || 0));

  const [selectedId, setSelectedId] = useState(sortedLotes[0]?.id || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checkedItems, setCheckedItems] = useState({});
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

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
  const totalUnidades = activeLote?.total_itens || 0;

  // Calculate checked units to discount from Falta dynamically
  const checkedUnits = items.reduce((sum, item, idx) => {
    const isChecked = Boolean(checkedItems[`${activeLote?.id}-${idx}`]);
    if (!isChecked) return sum;
    return sum + (item.quantidade_solicitada || item.quantidade_necessita_impressao || 1);
  }, 0);

  const faltanUnits = Math.max(0, totalUnidades - checkedUnits);

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
                <h2 className="text-base font-bold text-white">
                  Lote #{activeLote.id} • {activeLote.nome_arquivo}
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  Data: {activeLote.created_at ? new Date(activeLote.created_at).toLocaleString('pt-BR') : 'N/A'} • Responsável: {activeLote.usuario_responsavel}
                </p>
              </div>

              {/* Action Button: Ver Pedido (Abre Modal de Vista) */}
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 font-semibold text-xs transition-colors flex items-center gap-2 self-start sm:self-auto shrink-0"
              >
                <Eye className="h-4 w-4 text-indigo-400" />
                Ver Pedido
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
              </div>

              {/* 2. Estampas */}
              <div className="p-4 rounded-xl bg-dark-900 border border-amber-500/30">
                <span className="text-[11px] font-semibold text-amber-400 uppercase flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" /> Estampas
                </span>
                <div className="text-2xl font-bold font-mono text-amber-300 mt-1">
                  {activeLote.total_descontado_estampas} un
                </div>
              </div>

              {/* 3. Total */}
              <div className="p-4 rounded-xl bg-dark-900 border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 uppercase flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> Total
                </span>
                <div className="text-2xl font-bold font-mono text-white mt-1">
                  {activeLote.total_itens} un
                </div>
              </div>

              {/* 4. Faltan (Descuenta al marcar casillas de productos) */}
              <div className="p-4 rounded-xl bg-dark-900 border border-rose-500/30">
                <span className="text-[11px] font-semibold text-rose-400 uppercase flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Faltan
                </span>
                <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
                  {faltanUnits} un
                </div>
              </div>
            </div>

            {/* Zona Inferior: LISTA DE DATOS (OK, SKU Original, Produto, Unidad) */}
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

            {/* Modal de Detalhes do Pedido */}
            {isDetailModalOpen && (
              <DetalhesPedidoModal
                isOpen={isDetailModalOpen}
                lote={activeLote}
                onClose={() => setIsDetailModalOpen(false)}
                showCheckboxes={false}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

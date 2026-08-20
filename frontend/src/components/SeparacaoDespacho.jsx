import React, { useState } from 'react';
import { Shirt, Palette, Layers, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { SeparacaoSidebar } from './SeparacaoSidebar';
import { SeparacaoItemsTable } from './SeparacaoItemsTable';
import { ModalItensProducidos } from './ModalItensProducidos';

const EMPTY_LOTES = [];

export function SeparacaoDespacho({ lotes = EMPTY_LOTES }) {
  const sortedLotes = lotes.slice().sort((a, b) => (b.id || 0) - (a.id || 0));

  const [selectedId, setSelectedId] = useState(sortedLotes[0]?.id || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localStatus, setLocalStatus] = useState({});
  const [isProducedModalOpen, setIsProducedModalOpen] = useState(false);

  const activeLote = sortedLotes.find((l) => l.id === selectedId) || sortedLotes[0] || null;

  const handleSelectLote = (loteId) => {
    setSelectedId(loteId);
    setCurrentPage(1);
  };

  // Map active items with local optimistic status or backend status
  const allItems = (activeLote?.itens || []).map((it) => ({
    ...it,
    status: localStatus[it.id] !== undefined ? localStatus[it.id] : (it.status || 'pendiente'),
  }));

  const pendingItems = allItems.filter((it) => it.status !== 'producido');
  const producedItems = allItems.filter((it) => it.status === 'producido');

  const totalUnidades = activeLote?.total_itens || 0;
  const producedUnits = producedItems.reduce((sum, item) => sum + (item.quantidade_solicitada || 1), 0);
  const faltanUnits = Math.max(0, totalUnidades - producedUnits);

  // Mark item as produced (optimistic + backend PATCH)
  const handleMarkProduced = async (item) => {
    const prevStatus = item.status;
    const now = new Date().toISOString();

    setLocalStatus((prev) => ({
      ...prev,
      [item.id]: 'producido',
    }));

    toast.success(`Item ${item.sku_original} concluído!`);

    try {
      if (item.id) {
        await api.updateItemStatus(item.id, 'producido');
      }
    } catch (e) {
      // Revert optimistic update on failure
      setLocalStatus((prev) => ({
        ...prev,
        [item.id]: prevStatus,
      }));
      toast.error(e.message || 'Erro ao sincronizar status do item.');
    }
  };

  // Revert item back to pending
  const handleRevertItem = async (item) => {
    const prevStatus = item.status;

    setLocalStatus((prev) => ({
      ...prev,
      [item.id]: 'pendiente',
    }));

    toast.info(`Item ${item.sku_original} retornado para pendentes.`);

    try {
      if (item.id) {
        await api.updateItemStatus(item.id, 'pendiente');
      }
    } catch (e) {
      setLocalStatus((prev) => ({
        ...prev,
        [item.id]: prevStatus,
      }));
      toast.error(e.message || 'Erro ao reverter status do item.');
    }
  };

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

            {/* Zona Inferior: LISTA DE PENDENCIAS (OK, SKU Original, Produto, Unidad) */}
            <SeparacaoItemsTable
              items={pendingItems}
              loteId={activeLote.id}
              onToggleCheck={handleMarkProduced}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              producedCount={producedItems.length}
              onOpenProducedModal={() => setIsProducedModalOpen(true)}
            />

            {/* Modal de Itens Produzidos com Busca em Tempo Real */}
            <ModalItensProducidos
              isOpen={isProducedModalOpen}
              onClose={() => setIsProducedModalOpen(false)}
              items={allItems}
              onRevertItem={handleRevertItem}
              loteNome={`Lote #${activeLote.id}`}
            />
          </>
        )}
      </div>
    </div>
  );
}

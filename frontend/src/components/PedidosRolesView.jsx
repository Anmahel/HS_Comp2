import React, { useState } from 'react';
import { Layers } from 'lucide-react';
import { ImprentaOrdersList } from './ImprentaOrdersList';
import { SeparacaoDespacho } from './SeparacaoDespacho';
import { DetalhesPedidoModal } from './DetalhesPedidoModal';

const EMPTY_LOTES = [];

export function PedidosRolesView({
  lotes = EMPTY_LOTES,
  loading = false,
  user = null,
}) {
  const userRole = user?.role || 'geral';
  const isImprenta = userRole === 'imprenta';

  const [selectedLoteForModal, setSelectedLoteForModal] = useState(null);

  if (isImprenta) {
    return (
      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-dark-800/80 p-5 rounded-2xl border border-slate-800 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                <Layers className="h-5 w-5" />
              </span>
              <h1 className="text-lg font-bold text-white tracking-tight">
                Fila de Impressão & Produção
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Listagem de lotes para impressão direta de estampas e controle de demanda.
            </p>
          </div>
        </div>

        <ImprentaOrdersList
          lotes={lotes}
          loading={loading}
          onOpenModal={setSelectedLoteForModal}
        />

        {selectedLoteForModal && (
          <DetalhesPedidoModal
            isOpen={Boolean(selectedLoteForModal)}
            lote={selectedLoteForModal}
            onClose={() => setSelectedLoteForModal(null)}
            showCheckboxes={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <SeparacaoDespacho lotes={lotes} />
    </div>
  );
}

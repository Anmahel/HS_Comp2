import React, { useState } from 'react';
import { Layers, Printer, PackageCheck } from 'lucide-react';
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
  const isAdminOrManager = ['admin', 'jefe', 'soporte', 'ing'].includes(userRole);

  const [managerViewMode, setManagerViewMode] = useState(
    userRole === 'imprenta' ? 'imprenta' : 'separacion'
  );
  const activeView = isAdminOrManager ? managerViewMode : (userRole === 'imprenta' ? 'imprenta' : 'separacion');

  const [selectedLoteForModal, setSelectedLoteForModal] = useState(null);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar - only displayed if in imprenta view OR to show the manager switcher */}
      {activeView === 'imprenta' ? (
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

          {/* Manager/Admin View Mode Switcher */}
          {isAdminOrManager && (
            <div className="flex items-center p-1 bg-dark-900 rounded-xl border border-slate-700 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setManagerViewMode('imprenta')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 bg-rose-600 text-white shadow-md"
              >
                <Printer className="h-3.5 w-3.5" />
                Visão Imprenta
              </button>
              <button
                type="button"
                onClick={() => setManagerViewMode('separacion')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 text-slate-400 hover:text-white"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Visão Separação
              </button>
            </div>
          )}
        </div>
      ) : (
        isAdminOrManager && (
          <div className="flex justify-end">
            <div className="flex items-center p-1 bg-dark-900 rounded-xl border border-slate-700">
              <button
                type="button"
                onClick={() => setManagerViewMode('imprenta')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 text-slate-400 hover:text-white"
              >
                <Printer className="h-3.5 w-3.5" />
                Visão Imprenta
              </button>
              <button
                type="button"
                onClick={() => setManagerViewMode('separacion')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 bg-indigo-600 text-white shadow-md"
              >
                <PackageCheck className="h-3.5 w-3.5" />
                Visão Separação
              </button>
            </div>
          </div>
        )
      )}

      {/* Main Subviews */}
      {activeView === 'imprenta' ? (
        <ImprentaOrdersList
          lotes={lotes}
          loading={loading}
          onOpenModal={setSelectedLoteForModal}
        />
      ) : (
        <SeparacaoDespacho
          lotes={lotes}
        />
      )}

      {/* Detail Modal */}
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

import React, { useEffect } from 'react';
import { Toaster } from 'sonner';
import { useEstoque } from './hooks/useEstoque';
import { Header } from './components/Header';
import { NavigationTabs } from './components/NavigationTabs';
import { BuscaSKU } from './components/BuscaSKU';
import { DashboardView } from './components/DashboardView';
import { TabelaPecasProntas } from './components/TabelaPecasProntas';
import { TabelaEstampas } from './components/TabelaEstampas';
import { TabelaMovimentacoes } from './components/TabelaMovimentacoes';
import { FormularioEstoqueModal } from './components/FormularioEstoqueModal';
import { ModalUsarEstoque } from './components/ModalUsarEstoque';

export function App() {
  const {
    theme,
    toggleTheme,
    activeTab,
    setActiveTab,
    selectedBrand,
    setSelectedBrand,
    catalogs,
    pecasProntas,
    estampas,
    movimentacoes,
    dashboardStats,
    loading,
    // Form Modal
    isFormModalOpen,
    formCategory,
    itemToEdit,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveInventoryItem,
    // Deduct Modal
    isDeductModalOpen,
    itemToDeduct,
    deductCategory,
    openDeductModal,
    closeDeductModal,
    deductStock,
    deleteItem,
  } = useEstoque();

  // Keyboard Shortcuts (Ctrl+K / Cmd+K and Esc)
  useEffect(() => {
    let animFrameId = null;
    const handleKeyDown = (e) => {
      // Ctrl+K / Cmd+K -> Focus SKU Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('verificador');
        animFrameId = requestAnimationFrame(() => {
          const input = document.getElementById('sku-search-input');
          if (input) {
            input.focus();
            input.select();
          }
        });
      }

      // Esc -> Close active modal
      if (e.key === 'Escape') {
        if (isFormModalOpen) closeFormModal();
        if (isDeductModalOpen) closeDeductModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (animFrameId) cancelAnimationFrame(animFrameId);
    };
  }, [isFormModalOpen, isDeductModalOpen, setActiveTab, closeFormModal, closeDeductModal]);

  return (
    <div className="min-h-screen flex flex-col bg-dark-900 text-slate-100 selection:bg-rose-500/30 selection:text-rose-200">
      {/* Sonner Toast Notifications */}
      <Toaster position="top-right" richColors closeButton />

      {/* Top Header */}
      <Header
        brands={catalogs.brands}
        selectedBrand={selectedBrand}
        onSelectBrand={setSelectedBrand}
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenCreate={openCreateModal}
      />

      {/* Navigation Tabs Bar */}
      <NavigationTabs
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        counts={{
          pecas: pecasProntas.length,
          estampas: estampas.length,
          critical: dashboardStats ? dashboardStats.total_criticos : 0,
        }}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'verificador' && (
          <BuscaSKU
            catalogs={catalogs}
            selectedBrand={selectedBrand}
            onOpenDeduct={openDeductModal}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardView
            stats={dashboardStats}
            onOpenCreate={openCreateModal}
            onOpenDeduct={openDeductModal}
          />
        )}

        {activeTab === 'pecas' && (
          <TabelaPecasProntas
            items={pecasProntas}
            loading={loading}
            onOpenCreate={openCreateModal}
            onOpenEdit={openEditModal}
            onOpenDeduct={openDeductModal}
            onDelete={deleteItem}
          />
        )}

        {activeTab === 'estampas' && (
          <TabelaEstampas
            items={estampas}
            loading={loading}
            onOpenCreate={openCreateModal}
            onOpenEdit={openEditModal}
            onOpenDeduct={openDeductModal}
            onDelete={deleteItem}
          />
        )}

        {activeTab === 'movimentacoes' && (
          <TabelaMovimentacoes movimentacoes={movimentacoes} />
        )}
      </main>

      {/* Global Modals */}
      {isFormModalOpen && (
        <FormularioEstoqueModal
          isOpen={isFormModalOpen}
          key={`form-${formCategory}-${itemToEdit ? itemToEdit.id : 'new'}`}
          category={formCategory}
          itemToEdit={itemToEdit}
          catalogs={catalogs}
          onClose={closeFormModal}
          onSave={saveInventoryItem}
        />
      )}

      {isDeductModalOpen && (
        <ModalUsarEstoque
          isOpen={isDeductModalOpen}
          key={`deduct-${deductCategory}-${itemToDeduct ? itemToDeduct.id : 'item'}`}
          item={itemToDeduct}
          category={deductCategory}
          onClose={closeDeductModal}
          onConfirm={deductStock}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-dark-900/60 py-4 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HC_comp © 2026 — Controle de Estoque & Produção Multi-Marcas</span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              API Online
            </span>
            <span>•</span>
            <span>MariaDB / SQLite Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

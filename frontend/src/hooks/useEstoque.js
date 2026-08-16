import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../api';
import { useCatalogs } from './useCatalogs';
import { useInventory } from './useInventory';
import { useOrders } from './useOrders';
import { useModals } from './useModals';

export function useEstoque() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hc_theme') || 'dark';
  });

  // Role-Based Access Control (RBAC) User state
  const [userRole, setUserRoleState] = useState(() => {
    return localStorage.getItem('hc_user_role') || 'soporte';
  });

  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('hc_user_name') || 'Agatha';
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('hc_active_tab') || 'pedidos';
  });

  // Global Brand filter state
  const [selectedBrand, setSelectedBrand] = useState(() => {
    return localStorage.getItem('hc_selected_brand') || 'all';
  });

  // Analytics state
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Sub-hooks
  const { catalogs, catalogsLoaded, fetchCatalogs } = useCatalogs();

  const modals = useModals();

  const {
    pecasProntas,
    estampas,
    loading,
    fetchPecas,
    fetchEstampas,
    saveInventoryItem: baseSaveInventoryItem,
    deductStock: baseDeductStock,
    deleteItem: baseDeleteItem,
  } = useInventory({
    selectedBrand,
    onRefreshCatalogs: fetchCatalogs,
  });

  // Fetch audit trail
  const fetchMovimentacoes = useCallback(async (params = {}) => {
    try {
      const data = await api.getMovimentacoes(params);
      setMovimentacoes(data || []);
    } catch (err) {
      toast.error(`Erro ao carregar movimentações: ${err.message}`);
    }
  }, []);

  // Fetch dashboard stats
  const fetchDashboardStats = useCallback(async () => {
    try {
      const data = await api.getDashboardStats();
      setDashboardStats(data);
    } catch (err) {
      toast.error(`Erro ao carregar estatísticas do dashboard: ${err.message}`);
    }
  }, []);

  const handleDataMutation = useCallback(() => {
    fetchPecas();
    fetchEstampas();
    fetchMovimentacoes();
  }, [fetchPecas, fetchEstampas, fetchMovimentacoes]);

  const {
    lotes,
    lotesLoading,
    fetchLotes,
    processarPedidosBatch,
    cancelarLoteBatch: baseCancelarLoteBatch,
  } = useOrders({
    userRole,
    userName,
    onOrderProcessed: handleDataMutation,
  });

  // Apply theme to document
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
    localStorage.setItem('hc_theme', theme);
  }, [theme]);

  // Persist tab, brand, and role
  useEffect(() => {
    localStorage.setItem('hc_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hc_selected_brand', selectedBrand);
  }, [selectedBrand]);

  useEffect(() => {
    localStorage.setItem('hc_user_role', userRole);
  }, [userRole]);

  useEffect(() => {
    localStorage.setItem('hc_user_name', userName);
  }, [userName]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setUserRole = (role, name = null) => {
    setUserRoleState(role);
    if (name) {
      setUserName(name);
    } else {
      const defaultNames = {
        soporte: 'Agatha',
        separacion: 'Equipe Separação',
        geral: 'Colaborador',
        jefe: 'Diretoria / Gestão',
        admin: 'Engenharia / Admin',
      };
      setUserName(defaultNames[role] || 'Usuário');
    }
  };

  // Refresh current view data
  const refreshCurrentView = useCallback(() => {
    fetchCatalogs();
    if (activeTab === 'pedidos') {
      fetchLotes();
      fetchPecas();
      fetchEstampas();
    }
    if (activeTab === 'pecas') fetchPecas();
    if (activeTab === 'estampas') fetchEstampas();
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'movimentacoes') fetchMovimentacoes();
  }, [activeTab, fetchCatalogs, fetchLotes, fetchPecas, fetchEstampas, fetchDashboardStats, fetchMovimentacoes]);

  // Initial load
  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  useEffect(() => {
    refreshCurrentView();
  }, [activeTab, selectedBrand, refreshCurrentView]);

  // Wrapped saveInventoryItem with modal integration
  const saveInventoryItem = async (formData) => {
    const success = await baseSaveInventoryItem(formData, modals.formCategory, modals.itemToEdit);
    if (success) {
      modals.closeFormModal();
    }
    return success;
  };

  // Wrapped deductStock with modal integration
  const deductStock = async (itemId, category, quantity) => {
    const success = await baseDeductStock(itemId, category, quantity);
    if (success) {
      modals.closeDeductModal();
      refreshCurrentView();
    }
    return success;
  };

  // Wrapped cancelarLoteBatch with modal integration
  const cancelarLoteBatch = async (loteId, motivo) => {
    const res = await baseCancelarLoteBatch(loteId, motivo);
    modals.closeCancelLoteModal();
    return res;
  };

  return {
    theme,
    toggleTheme,
    userRole,
    userName,
    setUserRole,
    activeTab,
    setActiveTab,
    selectedBrand,
    setSelectedBrand,
    catalogs,
    catalogsLoaded,
    pecasProntas,
    estampas,
    movimentacoes,
    dashboardStats,
    lotes,
    loading,
    lotesLoading,
    // Modals
    isFormModalOpen: modals.isFormModalOpen,
    formCategory: modals.formCategory,
    itemToEdit: modals.itemToEdit,
    openCreateModal: modals.openCreateModal,
    openEditModal: modals.openEditModal,
    closeFormModal: modals.closeFormModal,
    saveInventoryItem,
    // Deduction
    isDeductModalOpen: modals.isDeductModalOpen,
    itemToDeduct: modals.itemToDeduct,
    deductCategory: modals.deductCategory,
    openDeductModal: modals.openDeductModal,
    closeDeductModal: modals.closeDeductModal,
    deductStock,
    deleteItem: baseDeleteItem,
    // Batches & Orders
    fetchLotes,
    processarPedidosBatch,
    cancelarLoteBatch,
    isCancelLoteModalOpen: modals.isCancelLoteModalOpen,
    loteToCancel: modals.loteToCancel,
    openCancelLoteModal: modals.openCancelLoteModal,
    closeCancelLoteModal: modals.closeCancelLoteModal,
    // Refresh
    fetchPecas,
    fetchEstampas,
    fetchMovimentacoes,
    fetchDashboardStats,
    refreshCurrentView,
  };
}

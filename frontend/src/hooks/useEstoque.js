import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../api';
import { useCatalogs } from './useCatalogs';
import { useInventory } from './useInventory';
import { useOrders } from './useOrders';
import { useModals } from './useModals';

const USER_STORAGE_KEY = 'hc_auth_user_v1';

const userStorage = () =>
  typeof window !== 'undefined' && window.sessionStorage ? window.sessionStorage : null;

function loadStoredUser() {
  const s = userStorage();
  if (!s) return null;
  try {
    const raw = s.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function useEstoque() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hc_theme') || 'dark';
  });

  // Authenticated session state (aligned with in-memory token security)
  const [user, setUser] = useState(() => (getAuthToken() ? loadStoredUser() : null));

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

  // Global Inventory Mutation Version for real-time reactivity
  const [inventoryVersion, setInventoryVersion] = useState(0);

  const notifyInventoryChange = useCallback(() => {
    setInventoryVersion((v) => v + 1);
  }, []);

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
    onInventoryChange: notifyInventoryChange,
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
    notifyInventoryChange();
  }, [fetchPecas, fetchEstampas, fetchMovimentacoes, notifyInventoryChange]);

  const {
    lotes,
    lotesLoading,
    fetchLotes,
    processarPedidosBatch,
    cancelarLoteBatch: baseCancelarLoteBatch,
  } = useOrders({
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

  // Persist tab and brand
  useEffect(() => {
    localStorage.setItem('hc_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hc_selected_brand', selectedBrand);
  }, [selectedBrand]);

  // Force logout when the backend rejects the session
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      clearAuthToken();
      userStorage()?.removeItem(USER_STORAGE_KEY);
      toast.error('Sessão expirada. Faça login novamente.');
    };
    window.addEventListener('hc:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hc:unauthorized', handleUnauthorized);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const login = useCallback(async (username, password) => {
    const data = await api.login(username, password);
    setAuthToken(data.token);
    setUser(data.user);
    userStorage()?.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearAuthToken();
    userStorage()?.removeItem(USER_STORAGE_KEY);
    setUser(null);
  }, []);

  // Restore session on load if a token exists but no user object
  useEffect(() => {
    if (getAuthToken() && !user) {
      clearAuthToken();
      userStorage()?.removeItem(USER_STORAGE_KEY);
    }
  }, [user]);

  // Refresh current view data
  const refreshCurrentView = useCallback(() => {
    fetchCatalogs();
    if (activeTab === 'pedidos') {
      fetchLotes();
      fetchPecas();
      fetchEstampas();
    }
    if (activeTab === 'historico_lotes') fetchLotes();
    if (activeTab === 'pecas') fetchPecas();
    if (activeTab === 'estampas') fetchEstampas();
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'movimentacoes') fetchMovimentacoes();
  }, [activeTab, fetchCatalogs, fetchLotes, fetchPecas, fetchEstampas, fetchDashboardStats, fetchMovimentacoes]);

  // Initial load only when user is authenticated
  useEffect(() => {
    if (user) {
      fetchCatalogs();
    }
  }, [user, fetchCatalogs]);

  useEffect(() => {
    if (user) {
      refreshCurrentView();
    }
  }, [user, activeTab, selectedBrand, refreshCurrentView]);

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
    user,
    isAuthenticated: Boolean(user),
    userRole: user ? user.role : null,
    userName: user ? user.name : null,
    login,
    logout,
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
    inventoryVersion,
  };
}
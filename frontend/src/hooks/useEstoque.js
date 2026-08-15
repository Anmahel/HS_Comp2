import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../api';

export function useEstoque() {
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('hc_theme') || 'dark';
  });

  // Navigation tab state
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('hc_active_tab') || 'verificador';
  });

  // Global Brand filter state
  const [selectedBrand, setSelectedBrand] = useState(() => {
    return localStorage.getItem('hc_selected_brand') || 'all';
  });

  // Catalogs
  const [catalogs, setCatalogs] = useState({
    brands: [],
    cores: [],
    designs: [],
    skus: [],
    tamanhos: [],
    tipos: [],
  });

  // Data lists
  const [pecasProntas, setPecasProntas] = useState([]);
  const [estampas, setEstampas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [dashboardStats, setDashboardStats] = useState(null);

  // Loading & error flags
  const [loading, setLoading] = useState(false);
  const [catalogsLoaded, setCatalogsLoaded] = useState(false);

  // Form Modal state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formCategory, setFormCategory] = useState('peca'); // 'peca' | 'estampa'
  const [itemToEdit, setItemToEdit] = useState(null);

  // Deduct Modal state
  const [isDeductModalOpen, setIsDeductModalOpen] = useState(false);
  const [itemToDeduct, setItemToDeduct] = useState(null);
  const [deductCategory, setDeductCategory] = useState('peca');

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

  // Persist tab & brand
  useEffect(() => {
    localStorage.setItem('hc_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('hc_selected_brand', selectedBrand);
  }, [selectedBrand]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch all catalogs
  const fetchCatalogs = useCallback(async () => {
    try {
      const [brands, cores, designs, skus, tamanhos, tipos] = await Promise.all([
        api.getBrands(),
        api.getCores(),
        api.getDesigns(),
        api.getSkus(),
        api.getTamanhos(),
        api.getTipos(),
      ]);

      setCatalogs({
        brands: brands || [],
        cores: cores || [],
        designs: designs || [],
        skus: skus || [],
        tamanhos: tamanhos || [],
        tipos: tipos || [],
      });
      setCatalogsLoaded(true);
    } catch (err) {
      toast.error(`Falha ao carregar catálogos: ${err.message}`);
    }
  }, []);

  // Fetch finished pieces
  const fetchPecas = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const finalParams = { ...params };
      if (selectedBrand !== 'all') {
        finalParams.brand_id = selectedBrand;
      }
      const data = await api.getPecasProntas(finalParams);
      setPecasProntas(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(`Erro ao carregar peças prontas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

  // Fetch standalone prints
  const fetchEstampas = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const finalParams = { ...params };
      if (selectedBrand !== 'all') {
        finalParams.brand_id = selectedBrand;
      }
      const data = await api.getEstampas(finalParams);
      setEstampas(Array.isArray(data) ? data : data.items || []);
    } catch (err) {
      toast.error(`Erro ao carregar estampas: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedBrand]);

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

  // Refresh current view data
  const refreshCurrentView = useCallback(() => {
    fetchCatalogs();
    if (activeTab === 'pecas') fetchPecas();
    if (activeTab === 'estampas') fetchEstampas();
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'movimentacoes') fetchMovimentacoes();
  }, [activeTab, fetchCatalogs, fetchPecas, fetchEstampas, fetchDashboardStats, fetchMovimentacoes]);

  // Initial load
  useEffect(() => {
    fetchCatalogs();
  }, [fetchCatalogs]);

  useEffect(() => {
    refreshCurrentView();
  }, [activeTab, selectedBrand, refreshCurrentView]);

  // Handlers for Modals
  const openCreateModal = (category = 'peca') => {
    setFormCategory(category);
    setItemToEdit(null);
    setIsFormModalOpen(true);
  };

  const openEditModal = (item, category = 'peca') => {
    setFormCategory(category);
    setItemToEdit(item);
    setIsFormModalOpen(true);
  };

  const closeFormModal = () => {
    setIsFormModalOpen(false);
    setItemToEdit(null);
  };

  const openDeductModal = (item, category = 'peca') => {
    setItemToDeduct(item);
    setDeductCategory(category);
    setIsDeductModalOpen(true);
  };

  const closeDeductModal = () => {
    setIsDeductModalOpen(false);
    setItemToDeduct(null);
  };

  // Save Item (Create / Update)
  const saveInventoryItem = async (formData) => {
    try {
      if (formCategory === 'peca') {
        if (itemToEdit) {
          await api.updatePecaPronta(itemToEdit.id, formData);
          toast.success('Peça pronta atualizada com sucesso!');
        } else {
          const res = await api.createPecaPronta(formData);
          toast.success(res.message || 'Peça pronta cadastrada com sucesso!');
        }
        fetchPecas();
      } else {
        if (itemToEdit) {
          await api.updateEstampa(itemToEdit.id, formData);
          toast.success('Estampa atualizada com sucesso!');
        } else {
          const res = await api.createEstampa(formData);
          toast.success(res.message || 'Estampa cadastrada com sucesso!');
        }
        fetchEstampas();
      }
      fetchCatalogs();
      closeFormModal();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // Deduct Stock
  const deductStock = async (itemId, category, quantity) => {
    try {
      const res = await api.usarEstoque({
        categoria: category,
        id: itemId,
        quantidade: quantity,
      });
      toast.success(res.message || `Baixa de ${quantity} unidade(s) realizada!`);
      closeDeductModal();
      refreshCurrentView();
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  // Delete Item
  const deleteItem = async (id, category = 'peca') => {
    try {
      if (category === 'peca') {
        await api.deletePecaPronta(id);
        toast.success('Peça pronta excluída do estoque');
        fetchPecas();
      } else {
        await api.deleteEstampa(id);
        toast.success('Estampa excluída do estoque');
        fetchEstampas();
      }
      return true;
    } catch (err) {
      toast.error(err.message);
      return false;
    }
  };

  return {
    theme,
    toggleTheme,
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
    loading,
    // Modals
    isFormModalOpen,
    formCategory,
    itemToEdit,
    openCreateModal,
    openEditModal,
    closeFormModal,
    saveInventoryItem,
    // Deduction
    isDeductModalOpen,
    itemToDeduct,
    deductCategory,
    openDeductModal,
    closeDeductModal,
    deductStock,
    deleteItem,
    // Refresh
    fetchPecas,
    fetchEstampas,
    fetchMovimentacoes,
    fetchDashboardStats,
    refreshCurrentView,
  };
}

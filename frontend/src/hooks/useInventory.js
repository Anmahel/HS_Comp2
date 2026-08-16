import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../api';

export function useInventory({ selectedBrand = 'all', onRefreshCatalogs } = {}) {
  const [pecasProntas, setPecasProntas] = useState([]);
  const [estampas, setEstampas] = useState([]);
  const [loading, setLoading] = useState(false);

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

  // Save Item (Create / Update)
  const saveInventoryItem = async (formData, category = 'peca', itemToEdit = null) => {
    try {
      if (category === 'peca') {
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
      if (onRefreshCatalogs) {
        onRefreshCatalogs();
      }
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
      if (category === 'peca') fetchPecas();
      else fetchEstampas();
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
    pecasProntas,
    estampas,
    loading,
    fetchPecas,
    fetchEstampas,
    saveInventoryItem,
    deductStock,
    deleteItem,
  };
}

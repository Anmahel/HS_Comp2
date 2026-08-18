import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '../api';

export function useOrders({ onOrderProcessed } = {}) {
  const [lotes, setLotes] = useState([]);
  const [lotesLoading, setLotesLoading] = useState(false);

  // Fetch order batches
  const fetchLotes = useCallback(async () => {
    setLotesLoading(true);
    try {
      const data = await api.getLotesPedidos({ include_deleted: 'true' });
      setLotes(data || []);
    } catch (err) {
      toast.error(`Erro ao carregar histórico de lotes: ${err.message}`);
    } finally {
      setLotesLoading(false);
    }
  }, []);

  // Process Batch of Orders
  const processarPedidosBatch = async (fileOrData) => {
    try {
      const res = await api.procesarPedidos(fileOrData);
      toast.success(res.message || `Lote #${res.lote?.id} processado com sucesso!`);
      fetchLotes();
      if (onOrderProcessed) {
        onOrderProcessed();
      }
      return res;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  // Cancel Batch & Rollback Stock
  const cancelarLoteBatch = async (loteId, motivo) => {
    try {
      const res = await api.cancelarLotePedido(loteId, motivo);
      toast.success(res.message || 'Lote cancelado e estoque estornado com sucesso!');
      fetchLotes();
      if (onOrderProcessed) {
        onOrderProcessed();
      }
      return res;
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  return {
    lotes,
    lotesLoading,
    fetchLotes,
    processarPedidosBatch,
    cancelarLoteBatch,
  };
}
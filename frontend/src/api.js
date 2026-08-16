const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (!isFormData && config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMsg = errorData && errorData.error ? errorData.error : `Erro HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json().catch(() => null);
  return data;
}

export const api = {
  // Catalogs
  getBrands: () => request('/brands'),
  getCores: () => request('/cores'),
  getDesigns: () => request('/designs'),
  getSkus: () => request('/skus'),
  getTamanhos: () => request('/tamanhos'),
  getTipos: () => request('/tipos'),

  // Inventory Peças Prontas
  getPecasProntas: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/pecas-prontas?${query.toString()}`);
  },
  createPecaPronta: (data) => request('/pecas-prontas', { method: 'POST', body: data }),
  updatePecaPronta: (id, data) => request(`/pecas-prontas/${id}`, { method: 'PUT', body: data }),
  deletePecaPronta: (id) => request(`/pecas-prontas/${id}`, { method: 'DELETE' }),

  // Inventory Estampas
  getEstampas: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/estampas?${query.toString()}`);
  },
  createEstampa: (data) => request('/estampas', { method: 'POST', body: data }),
  updateEstampa: (id, data) => request(`/estampas/${id}`, { method: 'PUT', body: data }),
  deleteEstampa: (id) => request(`/estampas/${id}`, { method: 'DELETE' }),

  // Stock Deduction (Concurrency-Safe)
  usarEstoque: (payload) => request('/usar-estoque', { method: 'POST', body: payload }),

  // Search & Availability Verifier
  verificarDisponibilidade: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return request(`/verificar-disponibilidade?${query.toString()}`);
  },

  // Order Processing & Ingestion (RBAC)
  previaPedidos: (body) => {
    return request('/pedidos/previa', {
      method: 'POST',
      body,
    });
  },

  procesarPedidos: (body, role = 'soporte', userName = 'Agatha') => {
    return request('/pedidos/procesar', {
      method: 'POST',
      body,
      headers: {
        'X-User-Role': role,
        'X-User-Name': userName,
      },
    });
  },

  getLotesPedidos: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/pedidos/lotes?${query.toString()}`);
  },

  getLoteDetalhe: (id) => request(`/pedidos/lotes/${id}`),

  cancelarLotePedido: (id, motivo, role = 'soporte', userName = 'Agatha') => {
    return request(`/pedidos/lotes/${id}/cancelar`, {
      method: 'POST',
      body: { motivo },
      headers: {
        'X-User-Role': role,
        'X-User-Name': userName,
      },
    });
  },

  getWhatsappShareLink: (loteId, phone = '') => {
    const q = phone ? `?phone=${encodeURIComponent(phone)}` : '';
    return request(`/pedidos/lotes/${loteId}/whatsapp-link${q}`);
  },

  getPdfImprentaUrl: (loteId) => `${API_BASE}/pedidos/lotes/${loteId}/pdf-imprenta`,
  getPdfSeparacaoUrl: (loteId) => `${API_BASE}/pedidos/lotes/${loteId}/pdf-separacao`,

  // Analytics & Audit Trail
  getMovimentacoes: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/movimentacoes?${query.toString()}`);
  },
  getDashboardStats: () => request('/dashboard/stats'),
};

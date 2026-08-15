const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
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

  // Analytics & Audit Trail
  getMovimentacoes: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/movimentacoes?${query.toString()}`);
  },
  getDashboardStats: () => request('/dashboard/stats'),
};

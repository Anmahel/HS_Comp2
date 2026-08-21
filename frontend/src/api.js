const API_BASE = '/api';

// In-memory token storage (XSS-safe, compliant with React Doctor security recommendations)
let inMemoryAuthToken = null;

export function setAuthToken(token) {
  inMemoryAuthToken = token ? String(token).trim() : null;
}

export function getAuthToken() {
  return inMemoryAuthToken;
}

export function clearAuthToken() {
  inMemoryAuthToken = null;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  if (!isFormData && config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new CustomEvent('hc:unauthorized'));
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMsg = errorData && errorData.error ? errorData.error : `Erro HTTP ${response.status}`;
    throw new Error(errorMsg);
  }

  const data = await response.json().catch(() => null);
  return data;
}

export const api = {
  // Auth
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),

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

  // Order Processing & Ingestion (RBAC via authenticated token)
  previaPedidos: (body) => {
    return request('/pedidos/previa', {
      method: 'POST',
      body,
    });
  },

  procesarPedidos: (body) => {
    return request('/pedidos/procesar', {
      method: 'POST',
      body,
    });
  },

  getLotesPedidos: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/pedidos/lotes?${query.toString()}`);
  },

  getLoteDetalhe: (id) => request(`/pedidos/lotes/${id}`),

  cancelarLotePedido: (id, motivo) => {
    return request(`/pedidos/lotes/${id}/cancelar`, {
      method: 'POST',
      body: { motivo },
    });
  },

  registrarEmissaoPdf: (loteId, tipoPdf) => {
    return request(`/pedidos/lotes/${loteId}/registrar-pdf`, {
      method: 'POST',
      body: { tipo_pdf: tipoPdf },
    });
  },

  updateItemStatus: (itemId, status) => {
    return request(`/lotes/items/${itemId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  },

  getNotificacoes: () => request('/pedidos/notificacoes'),

  getPdfImprentaUrl: (loteId) => `${API_BASE}/pedidos/lotes/${loteId}/pdf-imprenta`,
  getPdfSeparacaoUrl: (loteId) => `${API_BASE}/pedidos/lotes/${loteId}/pdf-separacao`,

  downloadPdf: async (endpoint, filename) => {
    const token = getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE}${endpoint}`, { headers });

    if (response.status === 401) {
      clearAuthToken();
      window.dispatchEvent(new CustomEvent('hc:unauthorized'));
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // Analytics & Audit Trail
  getMovimentacoes: (params = {}) => {
    const query = new URLSearchParams(params);
    return request(`/movimentacoes?${query.toString()}`);
  },
  getDashboardStats: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const qs = query.toString();
    return request(`/dashboard/stats${qs ? `?${qs}` : ''}`);
  },
};
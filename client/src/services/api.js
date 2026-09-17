// Support configurable backend URL for separate cloud deployment (e.g. Vercel + Render)
const API_ORIGIN = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '';
const BASE_URL = `${API_ORIGIN}/api`;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    try {
      const data = await response.json();
      errorMessage = data.error || errorMessage;
    } catch {
      errorMessage = `Server error (${response.status})`;
    }
    const error = new Error(errorMessage);
    error.status = response.status;
    throw error;
  }

  // If response is 204 No Content
  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export const api = {
  // Categories
  async getCategories() {
    return request('/categories');
  },

  async createCategory(data) {
    return request('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateCategory(id, data) {
    return request(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteCategory(id) {
    return request(`/categories/${id}`, {
      method: 'DELETE'
    });
  },

  // Transactions
  async getTransactions(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        params.append(key, val);
      }
    });
    const queryString = params.toString();
    return request(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  async getTransaction(id) {
    return request(`/transactions/${id}`);
  },

  async createTransaction(data) {
    return request('/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  async updateTransaction(id, data) {
    return request(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  async deleteTransaction(id) {
    return request(`/transactions/${id}`, {
      method: 'DELETE'
    });
  },

  // Dashboard
  async getDashboard(filters = {}) {
    const params = new URLSearchParams();
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    const queryString = params.toString();
    return request(`/dashboard${queryString ? `?${queryString}` : ''}`);
  },

  // CSV Export Download
  async downloadCSV(filters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '' && val !== 'All') {
        params.append(key, val);
      }
    });
    const queryString = params.toString();
    const url = `${BASE_URL}/transactions/export${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }

    // Extract filename from Content-Disposition header if available
    const disposition = response.headers.get('Content-Disposition');
    let filename = 'money-tracker-transactions.csv';
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename="?([^";]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return filename;
  }
};

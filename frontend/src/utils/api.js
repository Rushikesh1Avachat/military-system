const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'military-auth-token';
const USER_KEY = 'military-auth-user';

function readStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function getToken() {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  return readStoredUser();
}

export function persistSession(token, user) {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    throw new Error(payload?.message || `Request failed: ${response.status}`);
  }

  return payload;
}

export const api = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  googleLogin: (body) => request('/auth/google', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  getMeta: () => request('/meta'),
  getDashboard: (params = {}) => request(`/dashboard?${new URLSearchParams(params)}`),
  getPurchases: (params = {}) => request(`/purchases?${new URLSearchParams(params)}`),
  createPurchase: (body) => request('/purchases', { method: 'POST', body: JSON.stringify(body) }),
  getTransfers: () => request('/transfers'),
  createTransfer: (body) => request('/transfers', { method: 'POST', body: JSON.stringify(body) }),
  getAssignments: () => request('/assignments'),
  createAssignment: (body) => request('/assignments', { method: 'POST', body: JSON.stringify(body) }),
  getExpenditures: () => request('/expenditures'),
  createExpenditure: (body) => request('/expenditures', { method: 'POST', body: JSON.stringify(body) }),
  getAuditLogs: () => request('/audit-logs'),
};

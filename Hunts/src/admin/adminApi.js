const API_BASE = process.env.REACT_APP_API_URL || '';
const ADMIN_AUTH_KEY = 'admin_auth';

function getAdminAuth() {
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getAdminToken() {
  const auth = getAdminAuth();
  return auth?.token || null;
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = { method, headers: headers() };
  if (body != null) options.body = JSON.stringify(body);
  
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const err = new Error(res.statusText || 'Request failed');
      err.status = res.status;
      err.response = { 
        status: res.status,
        headers: {},
        data: null
      };
      try {
        const data = await res.json();
        const d = data?.detail;
        err.detail = Array.isArray(d) ? d.map((x) => x.msg || x).join(', ') : d;
        err.response.data = data;
        
        err.response.headers = {
          'x-error-type': res.headers.get('x-error-type')
        };
      } catch (_) {}
      throw err;
    }
    if (res.status === 204) return null;
    return res.json();
  } catch (error) {
    
    if (error.status) throw error;
    
    const networkError = new Error(error.message || 'Network error. Please check your connection.');
    networkError.status = 0;
    networkError.isNetworkError = true;
    throw networkError;
  }
}

export const adminApi = {
  login: (body) => request('POST', '/admin/login', body),

  setAuth: (data) => {
    const token = data?.token || data?.access_token;
    if (data && token) {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify({
        token: token,
        role: data.role || null,
        store_id: data.store_id ?? data.storeId ?? null,
      }));
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  },

  getAuth: getAdminAuth,
  getToken: getAdminToken,
  getRole: () => getAdminAuth()?.role || null,
  getStoreId: () => {
    const auth = getAdminAuth();
    const id = auth?.store_id ?? auth?.storeId;
    return id != null && id !== '' ? String(id) : null;
  },

  isAuthenticated: () => !!getAdminToken(),

  getStores: () => request('GET', '/admin/stores'),
  createStore: (body) => request('POST', '/admin/stores', body),

  getAdmins: () => request('GET', '/admin/admins'),
  createAdmin: (body) => request('POST', '/admin/create-admin', body),

  getOrders: (storeId = null) => {
    if (storeId) {
      return request('GET', `/admin/orders?store_id=${encodeURIComponent(storeId)}`);
    }
    return request('GET', '/admin/orders');
  },

  updateOrderStatus: (orderId, status) => request('PATCH', `/admin/orders/${orderId}`, { status }),

  getStats: () => request('GET', '/admin/stats'),
};

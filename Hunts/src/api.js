const API_BASE = process.env.REACT_APP_API_URL || '';
const SESSION_KEY = 'pizza_session_id';
const TOKEN_KEY = 'pizza_token';

let on401Callback = null;
function setOn401(fn) {
  on401Callback = fn;
}

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function headers() {
  const h = { 'Content-Type': 'application/json' };
  if (API_BASE) h['X-Session-Id'] = getSessionId();
  const token = getToken();
  if (token) h['Authorization'] = 'Bearer ' + token;
  return h;
}

async function request(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = { method, headers: headers() };
  if (body != null) options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  if (!res.ok) {
    if (res.status === 401 && on401Callback) on401Callback();
    const err = new Error(res.statusText || 'Request failed');
    err.status = res.status;
    try {
      const data = await res.json();
      const d = data?.detail;
      err.detail = Array.isArray(d) ? d.map((x) => x.msg || x).join(', ') : d;
    } catch (_) {}
    throw err;
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  isConfigured: () => !!API_BASE,
  setOn401,

  signup: (body) => request('POST', '/auth/signup', body),
  login: (body) => request('POST', '/auth/login', body),
  me: () => request('GET', '/auth/me'),
  updateProfile: (body) => request('PATCH', '/auth/me', body),
  changePassword: (body) => request('POST', '/auth/change-password', body),

  getCart: () => request('GET', '/cart'),
  addCartItem: (body) => request('POST', '/cart/add', body),
  updateCartItem: (itemId, body) => request('PUT', '/cart/update', { item_id: itemId, quantity: body.quantity }),
  removeCartItem: (itemId) => request('DELETE', `/cart/remove/${itemId}`),
  clearCart: () => request('DELETE', '/cart/clear'),

  getCategories: () => request('GET', '/menu/categories'),
  getProducts: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return request('GET', '/menu/products' + (q ? `?${q}` : ''));
  },
  getToppings: (params) => {
    const q = new URLSearchParams(params || {}).toString();
    return request('GET', '/menu/toppings' + (q ? `?${q}` : ''));
  },
  getSpecialty: () => request('GET', '/menu/specialty'),

  checkout: (delivery) => request('POST', '/orders/checkout', delivery),
  getOrders: () => request('GET', '/orders'),
  getOrder: (id) => request('GET', `/orders/${id}`),

  getLocations: () => request('GET', '/locations'),
  searchLocations: (q, radiusMiles = null) => {
    const params = new URLSearchParams({ q: q || '' });
    if (radiusMiles != null && radiusMiles > 0) params.set('radius', String(radiusMiles));
    return request('GET', '/locations/search?' + params.toString());
  },
};

export { getSessionId, getToken, TOKEN_KEY, setOn401 };

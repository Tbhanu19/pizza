import axios from 'axios';

const ADMIN_TOKEN_KEY = 'adminToken';

const baseURL = process.env.REACT_APP_API_URL || '';

const adminAxios = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAdminToken = () => localStorage.getItem(ADMIN_TOKEN_KEY);
export const setAdminToken = (token) => {
  if (token) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

export default adminAxios;

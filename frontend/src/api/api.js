import axios from 'axios';

/**
 * Single Axios instance.  All HTTP calls live here; no URLs anywhere else.
 * baseURL is set via VITE_API_BASE_URL in .env (see .env.example).
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// ── Orders ──────────────────────────────────────────────────
/**
 * @param {string|null} restaurant  Optional restaurant name filter (partner view).
 */
export const getOrders = (restaurant = null) =>
  api.get('/orders', { params: restaurant ? { restaurant } : {} }).then((r) => r.data);

export const getOrder = (id) =>
  api.get(`/orders/${id}`).then((r) => r.data);

export const createOrder = (payload) =>
  api.post('/orders', payload).then((r) => r.data);

export const updateOrderStatus = (id, status) =>
  api.put(`/orders/${id}/status`, { status }).then((r) => r.data);

// ── Stats ───────────────────────────────────────────────────
export const getStats = () =>
  api.get('/orders/stats').then((r) => r.data);

// ── Leaderboard ─────────────────────────────────────────────
export const getLeaderboard = (limit = 5) =>
  api.get('/leaderboard', { params: { limit } }).then((r) => r.data);

// ── Health ──────────────────────────────────────────────────
export const getHealth = () =>
  api.get('/health').then((r) => r.data);

// ── Restaurants ─────────────────────────────────────────────
export const getRestaurants = () =>
  api.get('/restaurants').then((r) => r.data);

export const getRestaurant = (id) =>
  api.get(`/restaurants/${id}`).then((r) => r.data);

// ── Analytics ───────────────────────────────────────────────
export const getAnalytics = () =>
  api.get('/analytics/summary').then((r) => r.data);

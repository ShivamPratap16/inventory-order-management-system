// Central Axios instance + thin API helpers.
// Keeping every backend call in one file means components never hardcode URLs
// and error handling stays consistent.
import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL });

// Turn a backend/axios error into a readable message for the UI.
export function extractError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors come back as an array of objects.
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d.msg).join(", ");
  }
  return err?.message || "Something went wrong";
}

// Build a params object only when there's a non-empty search term, so we send
// a clean `/products` (not `/products?search=`) when not searching.
const searchParams = (search) => (search ? { params: { search } } : {});

// ---- Products ----
export const productsApi = {
  // `params` is a plain object of query params (search + filters + sort),
  // built by lib/productFilters.js. Empty object = no filters.
  list: (params = {}) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

// ---- Customers ----
export const customersApi = {
  list: (search) => api.get("/customers", searchParams(search)).then((r) => r.data),
  create: (data) => api.post("/customers", data).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`),
};

// ---- Orders ----
export const ordersApi = {
  list: (search) => api.get("/orders", searchParams(search)).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => api.post("/orders", data).then((r) => r.data),
  remove: (id) => api.delete(`/orders/${id}`),
};

// ---- Dashboard ----
export const dashboardApi = {
  stats: () => api.get("/dashboard/stats").then((r) => r.data),
  analytics: () => api.get("/dashboard/analytics").then((r) => r.data),
};

export default api;

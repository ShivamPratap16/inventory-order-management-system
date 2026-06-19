import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({ baseURL });

export function extractError(err) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => d.msg).join(", ");
  }
  return err?.message || "Something went wrong";
}

const searchParams = (search) => (search ? { params: { search } } : {});

export const productsApi = {
  list: (params = {}) => api.get("/products", { params }).then((r) => r.data),
  get: (id) => api.get(`/products/${id}`).then((r) => r.data),
  create: (data) => api.post("/products", data).then((r) => r.data),
  update: (id, data) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/products/${id}`),
};

export const customersApi = {
  list: (search) => api.get("/customers", searchParams(search)).then((r) => r.data),
  create: (data) => api.post("/customers", data).then((r) => r.data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const ordersApi = {
  list: (search) => api.get("/orders", searchParams(search)).then((r) => r.data),
  get: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  create: (data) => api.post("/orders", data).then((r) => r.data),
  remove: (id) => api.delete(`/orders/${id}`),
};

export const dashboardApi = {
  stats: () => api.get("/dashboard/stats").then((r) => r.data),
  analytics: () => api.get("/dashboard/analytics").then((r) => r.data),
};

export default api;

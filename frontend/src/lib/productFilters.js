
export const emptyFilters = {
  stock_status: [],
  min_price: "",
  max_price: "",
  min_stock: "",
  max_stock: "",
  sort: "",
};

export const STOCK_STATUS_OPTIONS = [
  { value: "out", label: "Out of stock" },
  { value: "low", label: "Low stock" },
  { value: "healthy", label: "Healthy" },
];

export const SORT_OPTIONS = [
  { value: "", label: "Newest first (default)" },
  { value: "stock_asc", label: "Stock: low to high" },
  { value: "stock_desc", label: "Stock: high to low" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "name_asc", label: "Name: A to Z" },
  { value: "name_desc", label: "Name: Z to A" },
];

export function buildProductParams(filters, search = "") {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  if (filters.stock_status.length) params.stock_status = filters.stock_status.join(",");
  if (filters.min_price !== "") params.min_price = filters.min_price;
  if (filters.max_price !== "") params.max_price = filters.max_price;
  if (filters.min_stock !== "") params.min_stock = filters.min_stock;
  if (filters.max_stock !== "") params.max_stock = filters.max_stock;
  if (filters.sort) params.sort = filters.sort;
  return params;
}

export function stockSectionTitle(filters) {
  const set = new Set(filters.stock_status);
  if (set.size === 0) return "All Products";
  if (!set.has("healthy")) return "Low Stock Products";
  const labels = { out: "Out of Stock", low: "Low Stock", healthy: "Healthy" };
  return [...set].map((s) => labels[s]).join(" + ") + " Products";
}

export function countActiveFilters(filters) {
  let n = 0;
  if (filters.stock_status.length) n += 1;
  if (filters.min_price !== "" || filters.max_price !== "") n += 1;
  if (filters.min_stock !== "" || filters.max_stock !== "") n += 1;
  if (filters.sort) n += 1;
  return n;
}

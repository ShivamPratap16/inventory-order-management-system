import { useEffect, useState } from "react";
import { productsApi, extractError } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import Modal from "../components/Modal.jsx";
import FilterModal from "../components/FilterModal.jsx";
import ProductTile from "../components/ProductTile.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { SkeletonTable } from "../components/Skeleton.jsx";
import { IconPlus, IconEdit, IconTrash, IconSearch, IconFilter } from "../components/Icons.jsx";
import {
  emptyFilters,
  buildProductParams,
  countActiveFilters,
} from "../lib/productFilters.js";

const emptyForm = { name: "", sku: "", price: "", quantity_in_stock: "" };

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const toast = useToast();

  const debouncedQuery = useDebounce(query, 300);
  const activeFilters = countActiveFilters(filters);

  const load = () => {
    setLoading(true);
    productsApi
      .list(buildProductParams(filters, debouncedQuery))
      .then(setProducts)
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [debouncedQuery, filters]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      sku: p.sku,
      price: String(p.price),
      quantity_in_stock: String(p.quantity_in_stock),
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.sku.trim()) e.sku = "SKU is required";
    if (form.price === "" || Number(form.price) < 0) e.price = "Price must be 0 or more";
    if (form.quantity_in_stock === "" || Number(form.quantity_in_stock) < 0)
      e.quantity_in_stock = "Stock must be 0 or more";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      quantity_in_stock: Number(form.quantity_in_stock),
    };

    try {
      if (editingId) {
        await productsApi.update(editingId, payload);
        toast.success("Product updated");
      } else {
        await productsApi.create(payload);
        toast.success("Product created");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    try {
      await productsApi.remove(p.id);
      toast.success("Product deleted");
      load();
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const setField = (field) => (ev) => setForm({ ...form, [field]: ev.target.value });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-subtitle">Manage your product catalogue</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <IconPlus width={18} height={18} /> Add Product
        </button>
      </div>

      {(query || activeFilters > 0 || products.length > 0) && (
        <div className="toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name or SKU…"
          />
          <div className="toolbar__right">
            {!loading && (
              <span className="search__count">{products.length} result(s)</span>
            )}
            <button className="btn" onClick={() => setFilterOpen(true)}>
              <IconFilter width={16} height={16} /> Filters
              {activeFilters > 0 && <span className="btn__badge">{activeFilters}</span>}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : products.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">
            <IconSearch width={26} height={26} />
          </div>
          <h3>
            {debouncedQuery || activeFilters > 0
              ? "No matching products"
              : "No products yet"}
          </h3>
          <p>
            {debouncedQuery || activeFilters > 0
              ? "No products match your search and filters. Try adjusting them."
              : "Add your first product to start managing inventory."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="cell-with-tile">
                        <ProductTile product={p} />
                        <span className="cell-strong">{p.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono">{p.sku}</span>
                    </td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>
                      <span
                        className={
                          "badge " +
                          (p.quantity_in_stock === 0
                            ? "badge--danger"
                            : p.quantity_in_stock <= 10
                            ? "badge--warn"
                            : "badge--ok")
                        }
                      >
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn--sm btn--icon"
                          onClick={() => openEdit(p)}
                          aria-label="Edit"
                        >
                          <IconEdit width={16} height={16} />
                        </button>
                        <button
                          className="btn btn--sm btn--icon btn--danger"
                          onClick={() => remove(p)}
                          aria-label="Delete"
                        >
                          <IconTrash width={16} height={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editingId ? "Edit Product" : "Add Product"}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={submit} className="form" noValidate>
          <label className={"field" + (errors.name ? " field--error" : "")}>
            <span>Product Name</span>
            <input value={form.name} onChange={setField("name")} placeholder="e.g. Wireless Mouse" />
            {errors.name && <small className="field__error">{errors.name}</small>}
          </label>
          <label className={"field" + (errors.sku ? " field--error" : "")}>
            <span>SKU / Code</span>
            <input value={form.sku} onChange={setField("sku")} placeholder="e.g. SKU-001" />
            {errors.sku && <small className="field__error">{errors.sku}</small>}
          </label>
          <label className={"field" + (errors.price ? " field--error" : "")}>
            <span>Price</span>
            <input type="number" step="0.01" value={form.price} onChange={setField("price")} placeholder="0.00" />
            {errors.price && <small className="field__error">{errors.price}</small>}
          </label>
          <label className={"field" + (errors.quantity_in_stock ? " field--error" : "")}>
            <span>Quantity in Stock</span>
            <input
              type="number"
              value={form.quantity_in_stock}
              onChange={setField("quantity_in_stock")}
              placeholder="0"
            />
            {errors.quantity_in_stock && (
              <small className="field__error">{errors.quantity_in_stock}</small>
            )}
          </label>
          <div className="form__actions">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              {editingId ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      <FilterModal
        open={filterOpen}
        value={filters}
        onApply={setFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}

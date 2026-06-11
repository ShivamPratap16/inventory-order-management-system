// Orders page: list orders, build a new multi-line order, view details, delete.
import { useEffect, useMemo, useState } from "react";
import {
  ordersApi,
  productsApi,
  customersApi,
  extractError,
} from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import Modal from "../components/Modal.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { SkeletonTable } from "../components/Skeleton.jsx";
import { IconPlus, IconEye, IconTrash, IconReceipt, IconSearch } from "../components/Icons.jsx";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [customerId, setCustomerId] = useState("");
  // Each line: { product_id, quantity }
  const [lines, setLines] = useState([{ product_id: "", quantity: 1 }]);
  const [formError, setFormError] = useState("");

  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState("");
  const toast = useToast();

  const debouncedQuery = useDebounce(query, 300);

  // Orders list is search-filtered by the backend (customer name or order id).
  const loadOrders = (search) => {
    setLoading(true);
    ordersApi
      .list(search)
      .then(setOrders)
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  };

  // Products + customers are the full reference lists used by the create-order
  // dropdowns. They don't depend on the search box, so they load once on mount
  // and refresh after a mutation (an order changes product stock).
  const loadRefData = () => {
    Promise.all([productsApi.list(), customersApi.list()])
      .then(([p, c]) => {
        setProducts(p);
        setCustomers(c);
      })
      .catch((err) => toast.error(extractError(err)));
  };

  useEffect(() => {
    loadRefData();
  }, []);

  useEffect(() => {
    loadOrders(debouncedQuery);
  }, [debouncedQuery]);

  const productById = useMemo(() => {
    const map = {};
    products.forEach((p) => (map[p.id] = p));
    return map;
  }, [products]);

  // Live total preview computed on the client. The backend recalculates the
  // authoritative total - this is just for instant feedback.
  const previewTotal = useMemo(() => {
    return lines.reduce((sum, l) => {
      const p = productById[Number(l.product_id)];
      if (!p) return sum;
      return sum + Number(p.price) * Number(l.quantity || 0);
    }, 0);
  }, [lines, productById]);

  const openCreate = () => {
    setCustomerId("");
    setLines([{ product_id: "", quantity: 1 }]);
    setFormError("");
    setCreateOpen(true);
  };

  const updateLine = (index, field, value) => {
    setLines((curr) =>
      curr.map((l, i) => (i === index ? { ...l, [field]: value } : l))
    );
  };

  const addLine = () => setLines((curr) => [...curr, { product_id: "", quantity: 1 }]);
  const removeLine = (index) =>
    setLines((curr) => curr.filter((_, i) => i !== index));

  const submit = async (ev) => {
    ev.preventDefault();
    setFormError("");

    if (!customerId) return setFormError("Please select a customer");
    const valid = lines.filter((l) => l.product_id && Number(l.quantity) > 0);
    if (valid.length === 0)
      return setFormError("Add at least one product with a quantity");

    try {
      await ordersApi.create({
        customer_id: Number(customerId),
        items: valid.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
        })),
      });
      toast.success("Order created");
      setCreateOpen(false);
      loadOrders(debouncedQuery);
      loadRefData(); // stock changed
    } catch (err) {
      // Surfaces backend errors like "Insufficient stock for ...".
      toast.error(extractError(err));
    }
  };

  const remove = async (o) => {
    if (!window.confirm(`Cancel order #${o.id}? Stock will be restored.`)) return;
    try {
      await ordersApi.remove(o.id);
      toast.success("Order cancelled");
      loadOrders(debouncedQuery);
      loadRefData(); // stock restored
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const openDetail = async (id) => {
    try {
      setDetail(await ordersApi.get(id));
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Track and manage orders</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <IconPlus width={18} height={18} /> Create Order
        </button>
      </div>

      {(query || orders.length > 0) && (
        <div className="toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by customer or order #…"
          />
          {!loading && (
            <span className="search__count">{orders.length} result(s)</span>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={6} />
      ) : orders.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">
            {debouncedQuery ? (
              <IconSearch width={26} height={26} />
            ) : (
              <IconReceipt width={26} height={26} />
            )}
          </div>
          <h3>{debouncedQuery ? "No matching orders" : "No orders yet"}</h3>
          <p>
            {debouncedQuery
              ? `Nothing matches "${debouncedQuery}". Try a different search.`
              : "Create an order to reduce stock and track sales."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="cell-strong">#{o.id}</td>
                    <td>
                      <div className="cell-with-tile">
                        <span className="avatar">
                          {(o.customer_name || "?")
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </span>
                        <span>{o.customer_name}</span>
                      </div>
                    </td>
                    <td>
                      {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                    </td>
                    <td className="cell-strong">${Number(o.total_amount).toFixed(2)}</td>
                    <td>
                      <span className="badge badge--ok">Completed</span>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn--sm btn--icon"
                          onClick={() => openDetail(o.id)}
                          aria-label="View"
                        >
                          <IconEye width={16} height={16} />
                        </button>
                        <button
                          className="btn btn--sm btn--icon btn--danger"
                          onClick={() => remove(o)}
                          aria-label="Cancel"
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

      {/* Create order modal */}
      <Modal open={createOpen} title="Create Order" onClose={() => setCreateOpen(false)}>
        <form onSubmit={submit} className="form" noValidate>
          <label className="field">
            <span>Customer</span>
            <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Select a customer…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.email})
                </option>
              ))}
            </select>
          </label>

          <div className="order-lines">
            <div className="order-lines__head">
              <span>Products</span>
              <button type="button" className="btn btn--sm" onClick={addLine}>
                <IconPlus width={14} height={14} /> Add line
              </button>
            </div>
            {lines.map((line, i) => {
              const p = productById[Number(line.product_id)];
              return (
                <div className="order-line" key={i}>
                  <select
                    value={line.product_id}
                    onChange={(e) => updateLine(i, "product_id", e.target.value)}
                  >
                    <option value="">Select product…</option>
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name} (stock: {prod.quantity_in_stock})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) => updateLine(i, "quantity", e.target.value)}
                  />
                  <span className="order-line__sub">
                    {p ? `$${(Number(p.price) * Number(line.quantity || 0)).toFixed(2)}` : "—"}
                  </span>
                  {lines.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--sm btn--icon btn--danger"
                      onClick={() => removeLine(i)}
                      aria-label="Remove line"
                    >
                      <IconTrash width={14} height={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <div className="order-total">
            <span>Estimated Total</span>
            <strong>${previewTotal.toFixed(2)}</strong>
          </div>

          {formError && <small className="field__error">{formError}</small>}

          <div className="form__actions">
            <button type="button" className="btn" onClick={() => setCreateOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Place Order
            </button>
          </div>
        </form>
      </Modal>

      {/* Order detail modal */}
      <Modal
        open={!!detail}
        title={detail ? `Order #${detail.id}` : ""}
        onClose={() => setDetail(null)}
      >
        {detail && (
          <div>
            <div className="detail-meta">
              <div className="detail-meta__item">
                <span>Customer</span>
                <strong>{detail.customer_name}</strong>
              </div>
              <div className="detail-meta__item">
                <span>Date</span>
                <strong>{new Date(detail.created_at).toLocaleDateString()}</strong>
              </div>
              <div className="detail-meta__item">
                <span>Total</span>
                <strong>${Number(detail.total_amount).toFixed(2)}</strong>
              </div>
            </div>
            <div className="table-wrap">
              <div className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((it) => (
                      <tr key={it.id}>
                        <td className="cell-strong">{it.product_name}</td>
                        <td>{it.quantity}</td>
                        <td>${Number(it.unit_price).toFixed(2)}</td>
                        <td>${(Number(it.unit_price) * it.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="order-total" style={{ marginTop: 16 }}>
              <span>Total</span>
              <strong>${Number(detail.total_amount).toFixed(2)}</strong>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

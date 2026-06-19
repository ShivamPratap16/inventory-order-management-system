import { useEffect, useState } from "react";
import { customersApi, extractError } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useDebounce } from "../hooks/useDebounce.js";
import Modal from "../components/Modal.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { SkeletonTable } from "../components/Skeleton.jsx";
import { IconPlus, IconTrash, IconUsers, IconSearch } from "../components/Icons.jsx";

const emptyForm = { full_name: "", email: "", phone: "" };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [query, setQuery] = useState("");
  const toast = useToast();

  const debouncedQuery = useDebounce(query, 300);

  const load = (search) => {
    setLoading(true);
    customersApi
      .list(search)
      .then(setCustomers)
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(debouncedQuery);
  }, [debouncedQuery]);

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name = "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.phone.trim()) e.phone = "Phone is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await customersApi.create({
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
      });
      toast.success("Customer created");
      setModalOpen(false);
      load(debouncedQuery);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete "${c.full_name}"?`)) return;
    try {
      await customersApi.remove(c.id);
      toast.success("Customer deleted");
      load(debouncedQuery);
    } catch (err) {
      toast.error(extractError(err));
    }
  };

  const setField = (field) => (ev) => setForm({ ...form, [field]: ev.target.value });

  const initials = (name) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">Manage your customers</p>
        </div>
        <button className="btn btn--primary" onClick={openCreate}>
          <IconPlus width={18} height={18} /> Add Customer
        </button>
      </div>

      {(query || customers.length > 0) && (
        <div className="toolbar">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Search by name, email or phone…"
          />
          {!loading && (
            <span className="search__count">{customers.length} result(s)</span>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : customers.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">
            {debouncedQuery ? (
              <IconSearch width={26} height={26} />
            ) : (
              <IconUsers width={26} height={26} />
            )}
          </div>
          <h3>{debouncedQuery ? "No matching customers" : "No customers yet"}</h3>
          <p>
            {debouncedQuery
              ? `Nothing matches "${debouncedQuery}". Try a different search.`
              : "Add a customer to start creating orders."}
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span className="avatar">{initials(c.full_name)}</span>
                        <span className="cell-strong">{c.full_name}</span>
                      </div>
                    </td>
                    <td>{c.email}</td>
                    <td>{c.phone}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="btn btn--sm btn--icon btn--danger"
                          onClick={() => remove(c)}
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

      <Modal open={modalOpen} title="Add Customer" onClose={() => setModalOpen(false)}>
        <form onSubmit={submit} className="form" noValidate>
          <label className={"field" + (errors.full_name ? " field--error" : "")}>
            <span>Full Name</span>
            <input value={form.full_name} onChange={setField("full_name")} placeholder="e.g. Asha Verma" />
            {errors.full_name && <small className="field__error">{errors.full_name}</small>}
          </label>
          <label className={"field" + (errors.email ? " field--error" : "")}>
            <span>Email</span>
            <input value={form.email} onChange={setField("email")} placeholder="name@example.com" />
            {errors.email && <small className="field__error">{errors.email}</small>}
          </label>
          <label className={"field" + (errors.phone ? " field--error" : "")}>
            <span>Phone</span>
            <input value={form.phone} onChange={setField("phone")} placeholder="9876543210" />
            {errors.phone && <small className="field__error">{errors.phone}</small>}
          </label>
          <div className="form__actions">
            <button type="button" className="btn" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary">
              Create Customer
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

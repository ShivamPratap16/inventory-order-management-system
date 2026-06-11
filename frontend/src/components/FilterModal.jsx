// Multi-filter modal for products. Edits a local DRAFT copy of the filters so
// nothing is applied until the user clicks "Apply" (Cancel discards the draft).
import { useEffect, useState } from "react";
import Modal from "./Modal.jsx";
import {
  emptyFilters,
  STOCK_STATUS_OPTIONS,
  SORT_OPTIONS,
} from "../lib/productFilters.js";

export default function FilterModal({ open, value, onApply, onClose }) {
  const [draft, setDraft] = useState(value);

  // Reset the draft to the live filters every time the modal is (re)opened.
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const toggleStatus = (status) =>
    setDraft((d) => ({
      ...d,
      stock_status: d.stock_status.includes(status)
        ? d.stock_status.filter((s) => s !== status)
        : [...d.stock_status, status],
    }));

  const apply = () => {
    onApply(draft);
    onClose();
  };

  const clearAll = () => {
    setDraft(emptyFilters);
    onApply(emptyFilters);
    onClose();
  };

  return (
    <Modal open={open} title="Filter Products" onClose={onClose}>
      <div className="form">
        {/* Stock status (multi-select chips) */}
        <div className="field">
          <span>Stock status</span>
          <div className="chip-group">
            {STOCK_STATUS_OPTIONS.map((opt) => {
              const active = draft.stock_status.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={"chip" + (active ? " chip--active" : "")}
                  onClick={() => toggleStatus(opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Price range */}
        <div className="field">
          <span>Price range</span>
          <div className="range">
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Min"
              value={draft.min_price}
              onChange={(e) => set("min_price", e.target.value)}
            />
            <span className="range__sep">to</span>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Max"
              value={draft.max_price}
              onChange={(e) => set("max_price", e.target.value)}
            />
          </div>
        </div>

        {/* Stock quantity range */}
        <div className="field">
          <span>Stock quantity range</span>
          <div className="range">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={draft.min_stock}
              onChange={(e) => set("min_stock", e.target.value)}
            />
            <span className="range__sep">to</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={draft.max_stock}
              onChange={(e) => set("max_stock", e.target.value)}
            />
          </div>
        </div>

        {/* Sort */}
        <label className="field">
          <span>Sort by</span>
          <select value={draft.sort} onChange={(e) => set("sort", e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form__actions form__actions--split">
          <button type="button" className="btn btn--ghost-danger" onClick={clearAll}>
            Clear all
          </button>
          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn--primary" onClick={apply}>
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

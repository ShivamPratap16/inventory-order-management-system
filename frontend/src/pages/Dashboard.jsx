// Dashboard: summary cards + charts + a (filterable) table of low-stock products.
import { useEffect, useState } from "react";
import { dashboardApi, productsApi, extractError } from "../api/client.js";
import { useToast } from "../components/Toast.jsx";
import { useCountUp } from "../hooks/useCountUp.js";
import { SkeletonCards, SkeletonTable } from "../components/Skeleton.jsx";
import { OrdersAreaChart, TopProductsBar, StockDonut } from "../components/Charts.jsx";
import FilterModal from "../components/FilterModal.jsx";
import ProductTile from "../components/ProductTile.jsx";
import {
  emptyFilters,
  buildProductParams,
  countActiveFilters,
  stockSectionTitle,
} from "../lib/productFilters.js";
import {
  IconBox,
  IconUsers,
  IconReceipt,
  IconAlert,
  IconFilter,
} from "../components/Icons.jsx";

// The low-stock table defaults to showing out-of-stock + low items, sorted by
// stock ascending. The filter modal lets the user widen or change this.
const defaultLowStockFilters = {
  ...emptyFilters,
  stock_status: ["out", "low"],
  sort: "stock_asc",
};

const cards = [
  { key: "total_products", label: "Total Products", Icon: IconBox, accent: "blue" },
  { key: "total_customers", label: "Total Customers", Icon: IconUsers, accent: "green" },
  { key: "total_orders", label: "Total Orders", Icon: IconReceipt, accent: "purple" },
  { key: "low_stock_count", label: "Low Stock Items", Icon: IconAlert, accent: "red" },
];

const money = (n) =>
  "$" + Number(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Stat card with its value animating up from 0 on mount.
function StatCard({ value, label, Icon, accent }) {
  const display = useCountUp(value);
  return (
    <div className="card">
      <span className={`card__chip card__chip--${accent}`}>
        <Icon width={24} height={24} />
      </span>
      <div>
        <div className="card__value">{display}</div>
        <div className="card__label">{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // The low-stock table fetches products separately so it can be filtered
  // independently of the cards/charts.
  const [lowStock, setLowStock] = useState([]);
  const [lowLoading, setLowLoading] = useState(true);
  const [lowFilters, setLowFilters] = useState(defaultLowStockFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const activeFilters = countActiveFilters(lowFilters);

  const toast = useToast();

  useEffect(() => {
    // Fetch summary counts and chart analytics together.
    Promise.all([dashboardApi.stats(), dashboardApi.analytics()])
      .then(([s, a]) => {
        setStats(s);
        setAnalytics(a);
      })
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch the low-stock table whenever its filters change.
  useEffect(() => {
    setLowLoading(true);
    productsApi
      .list(buildProductParams(lowFilters))
      .then(setLowStock)
      .catch((err) => toast.error(extractError(err)))
      .finally(() => setLowLoading(false));
  }, [lowFilters]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Hero band: greeting + date on the left, headline revenue on the right */}
      <div className="hero">
        <div>
          <p className="hero__date">{today}</p>
          <h1 className="hero__title">{greeting} 👋</h1>
          <p className="hero__sub">Here's what's happening with your store today.</p>
        </div>
        <div className="hero__stat">
          <span className="hero__stat-label">Total Revenue</span>
          <span className="hero__stat-value">
            {analytics ? money(analytics.total_revenue) : "—"}
          </span>
        </div>
      </div>

      {/* ---- Stat cards ---- */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="cards">
          {cards.map(({ key, label, Icon, accent }) => (
            <StatCard
              key={key}
              value={stats?.[key] ?? 0}
              label={label}
              Icon={Icon}
              accent={accent}
            />
          ))}
        </div>
      )}

      {/* ---- Charts ---- */}
      {loading ? (
        <div className="chart-grid">
          <div className="chart-card">
            <span className="skeleton chart-skeleton" />
          </div>
          <div className="chart-card">
            <span className="skeleton chart-skeleton" />
          </div>
        </div>
      ) : (
        analytics && (
          <div className="chart-grid">
            <div className="chart-card">
              <div className="chart-card__head">
                <span className="chart-card__title">Orders — last 7 days</span>
                <span className="chart-card__meta">
                  <strong>
                    {analytics.orders_per_day.reduce((s, d) => s + d.orders, 0)}
                  </strong>{" "}
                  orders this week
                </span>
              </div>
              <OrdersAreaChart data={analytics.orders_per_day} />
            </div>

            <div className="chart-card">
              <div className="chart-card__head">
                <span className="chart-card__title">Stock Health</span>
              </div>
              <StockDonut breakdown={analytics.stock_breakdown} />
            </div>

            <div className="chart-card chart-card--full">
              <div className="chart-card__head">
                <span className="chart-card__title">Top Products by Units Sold</span>
              </div>
              {analytics.top_products.length === 0 ? (
                <p className="muted" style={{ padding: "60px 0", textAlign: "center" }}>
                  No sales yet — create an order to see top products.
                </p>
              ) : (
                <TopProductsBar data={analytics.top_products} />
              )}
            </div>
          </div>
        )
      )}

      {/* ---- Low stock table (filterable) ---- */}
      <div className="section-head">
        <h2 className="section-title">{stockSectionTitle(lowFilters)}</h2>
        <button className="btn btn--sm" onClick={() => setFilterOpen(true)}>
          <IconFilter width={15} height={15} /> Filters
          {activeFilters > 0 && <span className="btn__badge">{activeFilters}</span>}
        </button>
      </div>

      {lowLoading ? (
        <SkeletonTable rows={4} cols={4} />
      ) : lowStock.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">
            <IconBox width={26} height={26} />
          </div>
          <h3>No products to show</h3>
          <p>Nothing matches the selected filters.</p>
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
                  <th>In Stock</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((p) => (
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
                        {p.quantity_in_stock} left
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <FilterModal
        open={filterOpen}
        value={lowFilters}
        onApply={setLowFilters}
        onClose={() => setFilterOpen(false)}
      />
    </div>
  );
}

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Label,
} from "recharts";

import { useTheme } from "../context/ThemeContext.jsx";

function useChartTheme() {
  const { isDark } = useTheme();
  return {
    grid: isDark ? "#243150" : "#eef0f5",
    axis: isDark ? "#64748b" : "#94a3b8",
    axisLabel: isDark ? "#8e9cb8" : "#64748b",
    strongText: isDark ? "#e8edf7" : "#0f172a",
    tooltip: {
      borderRadius: 10,
      border: isDark ? "1px solid #2f3e61" : "1px solid #e8ebf2",
      background: isDark ? "#1a2440" : "#ffffff",
      color: isDark ? "#e8edf7" : "#0f172a",
      boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.4)" : "0 4px 12px rgba(15,23,42,0.08)",
      fontSize: 13,
    },
  };
}

const fmtDay = (iso) =>
  new Date(iso + "T00:00:00").toLocaleDateString(undefined, { weekday: "short" });

export function OrdersAreaChart({ data }) {
  const ct = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={fmtDay}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={ct.axis}
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={ct.axis}
          width={28}
        />
        <Tooltip
          contentStyle={ct.tooltip}
          labelFormatter={(iso) =>
            new Date(iso + "T00:00:00").toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })
          }
        />
        <Area
          type="monotone"
          dataKey="orders"
          name="Orders"
          stroke="#6366f1"
          strokeWidth={2.5}
          fill="url(#ordersGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function TopProductsBar({ data }) {
  const ct = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={ct.grid} horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={ct.axis}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={120}
          tickLine={false}
          axisLine={false}
          fontSize={12}
          stroke={ct.axisLabel}
        />
        <Tooltip contentStyle={ct.tooltip} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
        <Bar dataKey="units" name="Units sold" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const STOCK = [
  { key: "healthy", name: "Healthy", color: "#10b981" },
  { key: "low", name: "Low", color: "#f59e0b" },
  { key: "out", name: "Out of stock", color: "#ef4444" },
];

export function StockDonut({ breakdown }) {
  const ct = useChartTheme();
  const data = STOCK.map((s) => ({ name: s.name, value: breakdown[s.key], color: s.color }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return <p className="muted" style={{ textAlign: "center", padding: "80px 0" }}>No products yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={56}
          outerRadius={88}
          paddingAngle={3}
          stroke="none"
        >
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
          <Label
            content={({ viewBox }) => {
              const { cx, cy } = viewBox;
              return (
                <g>
                  <text x={cx} y={cy - 4} textAnchor="middle" fontSize="26" fontWeight="800" fill={ct.strongText}>
                    {total}
                  </text>
                  <text x={cx} y={cy + 16} textAnchor="middle" fontSize="12" fontWeight="500" fill={ct.axisLabel}>
                    products
                  </text>
                </g>
              );
            }}
          />
        </Pie>
        <Tooltip contentStyle={ct.tooltip} />
        <Legend
          iconType="circle"
          formatter={(value) => <span style={{ color: ct.axisLabel, fontSize: 13 }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

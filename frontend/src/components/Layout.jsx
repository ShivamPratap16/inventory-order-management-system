import { NavLink, Outlet } from "react-router-dom";
import { useTheme } from "../context/ThemeContext.jsx";
import {
  IconDashboard,
  IconBox,
  IconUsers,
  IconReceipt,
  IconSun,
  IconMoon,
} from "./Icons.jsx";

const links = [
  { to: "/", label: "Dashboard", icon: IconDashboard, end: true },
  { to: "/products", label: "Products", icon: IconBox },
  { to: "/customers", label: "Customers", icon: IconUsers },
  { to: "/orders", label: "Orders", icon: IconReceipt },
];

export default function Layout() {
  const { isDark, toggle } = useTheme();

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="sidebar__logo">
            <IconBox width={22} height={22} />
          </span>
          <div className="sidebar__brand-text">
            <strong>Inventory</strong>
            <span>Order Manager</span>
          </div>
          <button
            className="theme-toggle"
            onClick={toggle}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? <IconSun width={17} height={17} /> : <IconMoon width={17} height={17} />}
          </button>
        </div>

        <nav className="sidebar__nav">
          <span className="sidebar__label">Menu</span>
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                "navlink" + (isActive ? " navlink--active" : "")
              }
            >
              <Icon className="navlink__icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__bottom">
          <div className="sidebar__profile">
            <span className="sidebar__profile-avatar">SR</span>
            <div className="sidebar__profile-text">
              <strong>Shivam Raj</strong>
              <span>Store Manager</span>
            </div>
          </div>
          <div className="sidebar__footer">
            <span className="sidebar__dot" /> All systems operational
          </div>
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}

import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Vote, Users, UserRound, BarChart3,
  LogOut, Search, Menu, X, ShieldCheck
} from "lucide-react";
import { useState } from "react";
const admin = JSON.parse(sessionStorage.getItem("admin"));

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Elections", path: "/elections", icon: Vote },
  { label: "Voters", path: "/voters", icon: Users },
  { label: "Candidates", path: "/candidates", icon: UserRound },
  { label: "Reports", path: "/reports", icon: BarChart3 },
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const current = navItems.find((item) => location.pathname.startsWith(item.path));

  const logout = () => navigate("/login");

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><ShieldCheck size={23} /></div>
          <div>
            <div className="brand-name">SMART ELECTION</div>
            <div className="brand-subtitle">ADMIN PORTAL</div>
          </div>
          <button className="mobile-close" onClick={() => setMobileOpen(false)}><X size={20}/></button>
        </div>

        <div className="sidebar-label">MAIN MENU</div>
        <nav className="nav-list">
          {navItems.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            >
              <Icon size={19} strokeWidth={2} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="security-card">
            <div className="security-icon"><ShieldCheck size={18}/></div>
            <div>
              <strong>System Secure</strong>
              <span>All services operational</span>
            </div>
          </div>
          <button className="logout-btn" onClick={logout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={22}/></button>
          <div>
            <div className="breadcrumb">Admin Portal / <span>{current?.label || "Dashboard"}</span></div>
            <h2>{current?.label || "Dashboard"}</h2>
          </div>
          <div className="topbar-actions">
            <div className="system-status"><span className="online-dot" /> System Online</div>
            <div className="admin-profile">
              <div className="avatar">{admin?.name?.charAt(0) || "A"}</div>
              <div className="profile-text"><strong>{admin?.name || "Administrator"}</strong><span>{admin?.role || "Super Admin"}</span></div>
            </div>
          </div>
        </header>
        <div className="page-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
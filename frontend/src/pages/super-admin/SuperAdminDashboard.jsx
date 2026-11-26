
import React, { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Users,
  ChartNoAxesCombined,
  FileBarChart,
  Settings,
  LogOut,
  Bell,
  Menu
} from "lucide-react";

import Companies from "./Companies";
import UserManagement from "./UserManagement";
import "./SuperAdminDashboard.css";

export default function SuperAdminDashboard() {
  const [activePage, setActivePage] = useState("Overview");

  const user = JSON.parse(
    sessionStorage.getItem("crmUser") || "{}"
  );

  const stats = [
    { title: "Total Companies", value: "0", icon: Building2 },
    { title: "Total Users", value: "0", icon: Users },
    { title: "Total Leads", value: "0", icon: ChartNoAxesCombined },
    { title: "Active Companies", value: "0", icon: FileBarChart },
  ];

  const menuItems = [
    { name: "Overview", icon: LayoutDashboard },
    { name: "Companies", icon: Building2 },
    { name: "User Management", icon: Users },
    { name: "Lead Analytics", icon: ChartNoAxesCombined },
    { name: "Global Reports", icon: FileBarChart },
    { name: "Settings", icon: Settings },
  ];

  const handleLogout = () => {
    sessionStorage.removeItem("crmToken");
    sessionStorage.removeItem("crmUser");
    window.location.href = "/";
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="brand-logo">C</div>
          <div>
            <h2>LeadCRM</h2>
            <span>Super Admin</span>
          </div>
        </div>

        <p className="menu-heading">MAIN MENU</p>

        <nav className="admin-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                key={item.name}
                onClick={() => setActivePage(item.name)}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={19} />
          Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <button className="mobile-menu">
              <Menu />
            </button>

            <h2>
              {activePage === "Overview"
                ? "Dashboard Overview"
                : activePage}
            </h2>

            <p>
              {activePage === "Companies"
                ? "Manage all registered companies."
                : activePage === "User Management"
                ? "Create and manage company administrators."
                : "Welcome to your CRM control center."}
            </p>
          </div>

          <div className="header-actions">
            <button className="icon-button">
              <Bell size={20} />
            </button>

            <div className="admin-profile">
              <div className="profile-avatar">S</div>
              <div>
                <strong>{user.name || "Super Admin"}</strong>
                <span>Super Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {activePage === "Companies" ? (
          <Companies />
        ) : activePage === "User Management" ? (
          <UserManagement />
        ) : activePage === "Overview" ? (
          <>
            <section className="welcome-section">
              <div>
                <h1>Welcome back, {user.name || "Super Admin"}!</h1>
                <p>
                  Manage your companies and monitor CRM performance.
                </p>
              </div>
              <span className="welcome-badge">
                Super Admin Access
              </span>
            </section>

            <section className="stats-grid">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div className="stat-card" key={stat.title}>
                    <div className="stat-icon">
                      <Icon size={23} />
                    </div>
                    <p>{stat.title}</p>
                    <h2>{stat.value}</h2>
                    <span>Live data integration pending</span>
                  </div>
                );
              })}
            </section>

            <section className="dashboard-bottom">
              <div className="dashboard-panel">
                <h3>Company Management</h3>
                <p>
                  Your registered companies will appear here.
                </p>

                <div className="empty-state">
                  <Building2 size={36} />
                  <strong>No company data loaded yet</strong>
                  <span>
                    Open Companies from the sidebar to manage companies.
                  </span>
                  <button
                    className="nav-item"
                    onClick={() => setActivePage("Companies")}
                  >
                    Manage Companies
                  </button>
                </div>
              </div>

              <div className="dashboard-panel quick-panel">
                <h3>Quick Overview</h3>
                <p>CRM administration at a glance.</p>

                <div className="quick-item">
                  <span>System Role</span>
                  <strong>Super Admin</strong>
                </div>

                <div className="quick-item">
                  <span>Account Status</span>
                  <strong className="active-status">Active</strong>
                </div>

                <div className="quick-item">
                  <span>Authentication</span>
                  <strong>JWT</strong>
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="dashboard-panel">
            <h3>{activePage}</h3>
            <p>This section will be developed in the next steps.</p>
          </section>
        )}
      </main>
    </div>
  );
}

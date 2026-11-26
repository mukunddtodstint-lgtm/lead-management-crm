
import { useState } from "react";

import AddEmployee from "./AddEmployee";
import SalesExecutives from "./SalesExecutives";
import GoogleSheets from "./GoogleSheets";
import AllLeads from "./AllLeads";
import LeadAssignment from "./LeadAssignment";
import ReportsAnalytics from "./ReportsAnalytics";
import FollowUps from "./FollowUps";
import AddSalesManager from "./AddSalesManager";
import MonthlyPerformance from "./MonthlyPerformance";
import DashboardOverview from "./DashboardOverview";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  Database,
  ClipboardList,
  BarChart3,
  LogOut,
  Menu,
  X,
  CalendarDays,
} from "lucide-react";

import "./CompanyAdminDashboard.css";

function CompanyAdminDashboard({ onLogout }) {
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const user = JSON.parse(
    sessionStorage.getItem("crmUser") || "{}"
  );

  const isCEO = user.role === "company_ceo";
  const isManager = user.role === "sales_manager";

  // Company CEO Menu
 const ceoMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Add Sales Manager", icon: UserPlus },
  { name: "Monthly Sales Performance", icon: BarChart3 },
  { name: "Reports & Analytics", icon: BarChart3 },
];

  // Sales Manager Menu
  const managerMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Sales Executives", icon: Users },
  { name: "Add Employee", icon: UserPlus },
  { name: "Google Sheets", icon: Database },
  { name: "All Leads", icon: ClipboardList },
  { name: "Lead Assignment", icon: UserPlus },
  { name: "Monthly Sales Performance", icon: BarChart3 },
  { name: "Reports & Analytics", icon: BarChart3 },
  { name: "Follow-ups", icon: CalendarDays },
];
  // Select menu according to role
  const menuItems = isCEO
    ? ceoMenuItems
    : isManager
    ? managerMenuItems
    : [];

  // Prevent unauthorized page navigation
  const allowedPages = menuItems.map(
    (item) => item.name
  );

  const currentPage = allowedPages.includes(activePage)
    ? activePage
    : "Dashboard";

  // Reject unsupported roles
  if (!isCEO && !isManager) {
    return (
      <div className="admin-layout">
        <main className="admin-main">
          <div className="admin-content">
            <h2>Access Denied</h2>
            <p>
              Your account does not have permission
              to access this dashboard.
            </p>

            <button
              className="admin-logout"
              onClick={onLogout}
            >
              <LogOut size={19} />
              Logout
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="admin-layout">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "open" : ""
        }`}
      >

        {/* Brand */}
        <div className="admin-brand">
          <h2>
            Lead<span>CRM</span>
          </h2>

          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* User Profile */}
        <div className="admin-profile">
          <div className="profile-avatar">
            {user.name?.charAt(0)?.toUpperCase() || "U"}
          </div>

          <div>
            <h4>{user.name || "User"}</h4>
            <p>
              {isCEO ? "Company CEO" : "Head of Sales"}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="admin-navigation">
          <p className="nav-heading">MAIN MENU</p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.name}
                className={
                  currentPage === item.name
                    ? "admin-nav-item active"
                    : "admin-nav-item"
                }
                onClick={() => {
                  setActivePage(item.name);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <button
          className="admin-logout"
          onClick={onLogout}
        >
          <LogOut size={19} />
          Logout
        </button>

      </aside>

      {/* Main Content */}
      <main className="admin-main">

        {/* Topbar */}
        <header className="admin-topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={23} />
          </button>

          <div>
            <h3>{currentPage}</h3>

            <p>
              {isCEO
                ? "Company leadership and performance overview"
                : "Manage your company's sales activities"}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <section className="admin-content">

          {/* Dashboard */}
          {/* Dashboard - CEO and Sales Manager */}
{currentPage === "Dashboard" && (
  <DashboardOverview />
)}

          {/* Add Sales Manager - CEO Only */}
          {currentPage === "Add Sales Manager" && isCEO && (
            <AddSalesManager />
          )}

          {/* Add Sales Executive - Sales Manager Only */}
          {currentPage === "Add Employee" && isManager && (
            <AddEmployee />
          )}

          {/* Sales Executives - Sales Manager Only */}
          {currentPage === "Sales Executives" && isManager && (
            <SalesExecutives />
          )}

          {/* Google Sheets - Sales Manager Only */}
          {currentPage === "Google Sheets" && isManager && (
            <GoogleSheets />
          )}

          {/* All Leads - Sales Manager Only */}
          {currentPage === "All Leads" && isManager && (
            <AllLeads />
          )}

          {/* Lead Assignment - Sales Manager Only */}
          {currentPage === "Lead Assignment" && isManager && (
            <LeadAssignment />
          )}

          {/* Monthly Sales Performance - CEO and Sales Manager */}
{currentPage === "Monthly Sales Performance" &&
  (isCEO || isManager) && (
    <MonthlyPerformance />
  )}

          {/* Reports - CEO and Sales Manager */}
          {currentPage === "Reports & Analytics" &&
            (isCEO || isManager) && (
              <ReportsAnalytics />
            )}

          {/* Follow-ups - Sales Manager Only */}
          {currentPage === "Follow-ups" && isManager && (
            <FollowUps />
          )}

        </section>

      </main>
    </div>
  );
}

export default CompanyAdminDashboard;

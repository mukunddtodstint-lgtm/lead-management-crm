
import { useState } from "react";

import Login from "./pages/auth/Login";
import SuperAdminDashboard from "./pages/super-admin/SuperAdminDashboard";
import CompanyAdminDashboard from "./pages/company-admin/CompanyAdminDashboard";
import SalesExecutiveDashboard from "./pages/sales/SalesExecutiveDashboard";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    Boolean(sessionStorage.getItem("crmToken"))
  );

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("crmToken");
    sessionStorage.removeItem("crmUser");
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const user = JSON.parse(
    sessionStorage.getItem("crmUser") || "{}"
  );

  // Super Admin Dashboard
  if (user.role === "super_admin") {
    return <SuperAdminDashboard onLogout={handleLogout} />;
  }

  // Company CEO Dashboard
  if (user.role === "company_ceo") {
    return <CompanyAdminDashboard onLogout={handleLogout} />;
  }

  // Sales Manager / Head of Sales Dashboard
  if (user.role === "sales_manager") {
    return <CompanyAdminDashboard onLogout={handleLogout} />;
  }

  // Legacy Company Admin (temporary compatibility)
  if (user.role === "company_admin") {
    return <CompanyAdminDashboard onLogout={handleLogout} />;
  }

  // Sales Executive Dashboard
  if (user.role === "sales") {
    return <SalesExecutiveDashboard onLogout={handleLogout} />;
  }

  return <Login onLoginSuccess={handleLoginSuccess} />;
}

export default App;

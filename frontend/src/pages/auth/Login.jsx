
import { useState } from "react";
import {
  LockKeyhole,
  Mail,
  Building2,
  User,
  Eye,
  EyeOff,
  ChartNoAxesCombined,
  Users,
  Target,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

import api from "../../services/api";
import "./Login.css";

export default function Login({ onLoginSuccess })  {
  const [role, setRole] = useState("company");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    companyId: "",
    employeeId: "",
    password: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  // Switch between Company User and Super Admin
  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
    setSuccess("");
  };

  // Login API
  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload =
        role === "admin"
          ? {
              email: formData.email.trim().toLowerCase(),
              password: formData.password,
            }
          : {
              companyId: formData.companyId.trim().toUpperCase(),
              employeeId: formData.employeeId.trim().toUpperCase(),
              password: formData.password,
            };

      const response = await api.post("/auth/login", payload);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      // Save login session
      sessionStorage.setItem("crmToken", token);
      sessionStorage.setItem("crmUser", JSON.stringify(user));

      setSuccess(`Welcome ${user.name}! Login successful.`);
      onLoginSuccess(response.data.user);

      // Dashboard redirect will be implemented next.

    } catch (err) {
      console.error("Login Error:", err);

      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">

      {/* LEFT BRANDING SECTION */}
      <section className="login-left">

        <div className="brand">
          <div className="brand-icon">
            <ChartNoAxesCombined size={27} />
          </div>

          <span>
            LeadFlow
            <span className="brand-light"> CRM</span>
          </span>
        </div>

        <div className="hero-content">

          <div className="hero-badge">
            <span className="live-dot"></span>
            SMART LEAD MANAGEMENT
          </div>

          <h1>
            Turn Every Lead
            <br />
            Into A <span>Business</span>
            <br />
            Opportunity.
          </h1>

          <p className="hero-description">
            Manage your companies, teams and customers
            from one powerful platform. Simplify your
            workflow and accelerate your growth.
          </p>

          <div className="feature-list">

            <div className="feature-item">
              <div className="feature-icon">
                <Users size={20} />
              </div>

              <div>
                <h3>Team Management</h3>
                <p>Manage your entire sales team</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <Target size={20} />
              </div>

              <div>
                <h3>Lead Tracking</h3>
                <p>Track every opportunity efficiently</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <ChartNoAxesCombined size={20} />
              </div>

              <div>
                <h3>Business Analytics</h3>
                <p>Make smarter business decisions</p>
              </div>
            </div>

          </div>
        </div>

        <div className="left-footer">
          © 2026 LeadFlow CRM. All rights reserved.
        </div>

      </section>

      {/* RIGHT LOGIN SECTION */}
      <section className="login-right">

        <div className="login-card">

          <div className="mobile-brand">
            <div className="brand-icon">
              <ChartNoAxesCombined size={24} />
            </div>

            <span>LeadFlow CRM</span>
          </div>

          <div className="login-heading">

            <div className="welcome-icon">
              <LockKeyhole size={23} />
            </div>

            <h2>Welcome Back!</h2>

            <p>
              Enter your credentials to access your account.
            </p>

          </div>

          {/* ROLE SELECTION */}
          <div className="role-switch">

            <button
              type="button"
              className={role === "company" ? "role-active" : ""}
              onClick={() => handleRoleChange("company")}
            >
              Company User
            </button>

            <button
              type="button"
              className={role === "admin" ? "role-active" : ""}
              onClick={() => handleRoleChange("admin")}
            >
              Super Admin
            </button>

          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit} className="login-form">

            {role === "company" ? (
              <>

                {/* COMPANY ID */}
                <div className="form-group">

                  <label>Company ID</label>

                  <div className="input-wrapper">

                    <Building2 size={19} />

                    <input
                      type="text"
                      name="companyId"
                      value={formData.companyId}
                      onChange={handleChange}
                      placeholder="Enter your company ID"
                      autoComplete="organization"
                      required
                    />

                  </div>
                </div>

                {/* EMPLOYEE ID */}
                <div className="form-group">

                  <label>Employee ID</label>

                  <div className="input-wrapper">

                    <User size={19} />

                    <input
                      type="text"
                      name="employeeId"
                      value={formData.employeeId}
                      onChange={handleChange}
                      placeholder="Enter your employee ID"
                      autoComplete="username"
                      required
                    />

                  </div>
                </div>

              </>
            ) : (

              /* SUPER ADMIN EMAIL */
              <div className="form-group">

                <label>Email Address</label>

                <div className="input-wrapper">

                  <Mail size={19} />

                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email address"
                    autoComplete="username"
                    required
                  />

                </div>
              </div>

            )}

            {/* PASSWORD */}
            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <LockKeyhole size={19} />

                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>

              </div>
            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
              <div className="login-success" role="status">
                {success}
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                "Signing In..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={19} />
                </>
              )}
            </button>

          </form>

          {/* SECURITY FOOTER */}
          <div className="security-note">
            <ShieldCheck size={17} />
            Secure and protected account access
          </div>

          <div className="login-footer">
            Need assistance? Contact your administrator.
          </div>

        </div>

      </section>

    </main>
  );
}


import { useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  Building2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import api from "../../services/api";
import "./UserManagement.css";

export default function UserManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    companyId: "",
    password: "",
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Fetch active companies
  const fetchCompanies = async () => {
    try {
      setLoading(true);

      const response = await api.get("/companies");

      const companyList =
        response.data.companies || response.data;

      const activeCompanies = companyList.filter(
        (company) => company.status === "active"
      );

      setCompanies(activeCompanies);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to load companies.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create Company CEO
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage({
      type: "",
      text: "",
    });

    if (!form.companyId) {
      setMessage({
        type: "error",
        text: "Please select a company.",
      });
      return;
    }

    if (form.password.length < 12) {
      setMessage({
        type: "error",
        text: "Password must contain at least 12 characters.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post(
        "/users/company-ceo",
        {
          name: form.name.trim(),
          email: form.email.trim(),
          employeeId: form.employeeId.trim().toUpperCase(),
          companyId: form.companyId,
          password: form.password,
        }
      );

      setMessage({
        type: "success",
        text:
          response.data.message ||
          "Company CEO created successfully.",
      });

      setForm({
        name: "",
        email: "",
        employeeId: "",
        companyId: "",
        password: "",
      });

      setShowPassword(false);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to create Company CEO. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="user-management">

      {/* Page Heading */}
      <div className="um-heading">
        <div>
          <h2>User Management</h2>
          <p>Create and manage Company CEO accounts.</p>
        </div>

        <div className="um-count">
          <Building2 size={18} />
          {companies.length} Active Companies
        </div>
      </div>

      {/* CEO Creation Form */}
      <div className="um-form-card">

        <div className="um-card-heading">
          <div className="um-icon">
            <UserPlus size={22} />
          </div>

          <div>
            <h3>Create Company CEO</h3>
            <p>
              Register a CEO for a selected company.
            </p>
          </div>
        </div>

        {/* Success / Error Message */}
        {message.text && (
          <div className={`um-message ${message.type}`}>
            {message.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}

            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          <div className="um-form-grid">

            {/* Company Selection */}
            <div className="um-field">
              <label>Company *</label>

              <select
                name="companyId"
                value={form.companyId}
                onChange={handleChange}
                required
                disabled={loading || submitting}
              >
                <option value="">
                  {loading
                    ? "Loading companies..."
                    : "Select Company"}
                </option>

                {companies.map((company) => (
                  <option
                    key={company._id}
                    value={company._id}
                  >
                    {company.companyName} ({company.companyId})
                  </option>
                ))}
              </select>
            </div>

            {/* CEO Name */}
            <div className="um-field">
              <label>CEO Name *</label>

              <input
                type="text"
                name="name"
                placeholder="Enter CEO full name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

            {/* Email */}
            <div className="um-field">
              <label>Email Address *</label>

              <input
                type="email"
                name="email"
                placeholder="ceo@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

            {/* Employee ID */}
            <div className="um-field">
              <label>Employee ID *</label>

              <input
                type="text"
                name="employeeId"
                placeholder="Example: CEO001"
                value={form.employeeId}
                onChange={handleChange}
                required
                disabled={submitting}
              />
            </div>

            {/* Password */}
            <div className="um-field">
              <label>Password *</label>

              <div className="um-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 12 characters"
                  value={form.password}
                  onChange={handleChange}
                  minLength={12}
                  required
                  disabled={submitting}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword((prev) => !prev)
                  }
                  disabled={submitting}
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

          </div>

          {/* Form Footer */}
          <div className="um-form-footer">

            <p>
              <Users size={15} />
              Company CEO will only access their own company's data.
            </p>

            <button
              type="submit"
              className="um-submit"
              disabled={
                submitting ||
                loading ||
                companies.length === 0
              }
            >
              <UserPlus size={18} />

              {submitting
                ? "Creating..."
                : "Create Company CEO"}
            </button>

          </div>

        </form>
      </div>
    </div>
  );
}


import { useState } from "react";
import { UserPlus, Eye, EyeOff, Users } from "lucide-react";
import api from "../../services/api";
import "./AddSalesManager.css";


export default function AddSalesManager() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    employeeId: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: "", text: "" });

    if (form.password.length < 12) {
      setMessage({
        type: "error",
        text: "Password must contain at least 12 characters.",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({
        type: "error",
        text: "Passwords do not match.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const { confirmPassword, ...managerData } = form;

      const response = await api.post(
        "/users/sales-manager",
        managerData
      );

      setMessage({
        type: "success",
        text: response.data.message || "Sales Manager created successfully.",
      });

      setForm({
        name: "",
        email: "",
        employeeId: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to create Sales Manager.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-employee-page">
      <div className="ae-heading">
        <div>
          <h2>Add Sales Manager</h2>
          <p>Create a Head of Sales account for your company.</p>
        </div>

        <div className="ae-count">
          <Users size={18} />
          Management Team
        </div>
      </div>

      <div className="ae-card">
        <div className="ae-card-heading">
          <div className="ae-icon">
            <UserPlus size={22} />
          </div>
          <div>
            <h3>Create Sales Manager</h3>
            <p>Enter the manager's account details below.</p>
          </div>
        </div>

        {message.text && (
          <div className={`ae-message ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="ae-grid">
            <div className="ae-field">
              <label>Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder="Enter manager name"
                required
              />
            </div>

            <div className="ae-field">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                placeholder="manager@example.com"
                required
              />
            </div>

            <div className="ae-field">
              <label>Employee ID *</label>
              <input
                name="employeeId"
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                placeholder="Example: MGR001"
                required
              />
            </div>

            <div className="ae-field">
              <label>Password *</label>
              <div className="ae-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Minimum 12 characters"
                  minLength={12}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            <div className="ae-field">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
                placeholder="Re-enter password"
                minLength={12}
                required
              />
            </div>
          </div>

          <div className="ae-footer">
            <p>
              <Users size={15} />
              This manager will belong to your company only.
            </p>

            <button
              type="submit"
              className="ae-submit"
              disabled={submitting}
            >
              <UserPlus size={18} />
              {submitting ? "Creating..." : "Create Sales Manager"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


import { useState } from "react";
import { UserPlus, Eye, EyeOff, Users } from "lucide-react";
import api from "../../services/api";
import "./AddEmployee.css";

export default function AddEmployee() {
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

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

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

      const { confirmPassword, ...employeeData } = form;

      const response = await api.post(
        "/users/sales-executive",
        employeeData
      );

      setMessage({
        type: "success",
        text:
          response.data.message ||
          "Sales Executive created successfully.",
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
          "Unable to create Sales Executive.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-employee-page">

      <div className="ae-heading">
        <div>
          <h2>Add Sales Executive</h2>
          <p>Create a Sales Executive account for your company.</p>
        </div>

        <div className="ae-count">
          <Users size={18} />
          Sales Team
        </div>
      </div>

      <div className="ae-card">

        <div className="ae-card-heading">
          <div className="ae-icon">
            <UserPlus size={22} />
          </div>

          <div>
            <h3>Create Sales Executive</h3>
            <p>Enter the employee's account details below.</p>
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
                type="text"
                name="name"
                placeholder="Enter employee name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ae-field">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="employee@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ae-field">
              <label>Employee ID *</label>
              <input
                type="text"
                name="employeeId"
                placeholder="Example: EMP001"
                value={form.employeeId}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ae-field">
              <label>Password *</label>

              <div className="ae-password">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 12 characters"
                  value={form.password}
                  onChange={handleChange}
                  minLength={12}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
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

            <div className="ae-field">
              <label>Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={handleChange}
                minLength={12}
                required
              />
            </div>

          </div>

          <div className="ae-footer">
            <p>
              <Users size={15} />
              This employee will belong to your company only.
            </p>

            <button
              type="submit"
              className="ae-submit"
              disabled={submitting}
            >
              <UserPlus size={18} />
              {submitting
                ? "Creating..."
                : "Create Sales Executive"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

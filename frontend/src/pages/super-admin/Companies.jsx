
import { useEffect, useState } from "react";
import {
  Plus,
  Building2,
  RefreshCw,
  X,
  Pencil,
  Power,
} from "lucide-react";
import api from "../../services/api";
import "./Companies.css";

const emptyForm = {
  companyName: "",
  companyId: "",
  email: "",
  phone: "",
  address: "",
};

export default function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState(emptyForm);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/companies");
      const data = response.data.companies || response.data;

      setCompanies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to fetch companies."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const openAddForm = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const openEditForm = (company) => {
    setEditingId(company._id);
    setFormData({
      companyName: company.companyName || "",
      companyId: company.companyId || "",
      email: company.email || "",
      phone: company.phone || "",
      address: company.address || "",
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await api.put(`/companies/${editingId}`, {
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
        });

        setSuccess("Company details updated successfully!");
      } else {
        await api.post("/companies", formData);
        setSuccess("Company registered successfully!");
      }

      setShowForm(false);
      setEditingId(null);
      setFormData(emptyForm);

      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save company details."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (company) => {
    const newStatus =
      company.status === "active" ? "inactive" : "active";

    const confirmed = window.confirm(
      `Are you sure you want to mark ${company.companyName} as ${newStatus}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await api.patch(`/companies/${company._id}/status`, {
        status: newStatus,
      });

      setSuccess(
        `${company.companyName} is now ${newStatus}.`
      );

      await fetchCompanies();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update company status."
      );
    }
  };

  return (
    <div className="companies-page">
      <div className="companies-heading">
        <div>
          <h1>Company Management</h1>
          <p>Register and manage all your companies.</p>
        </div>

        <button className="add-company-btn" onClick={openAddForm}>
          <Plus size={18} />
          Add New Company
        </button>
      </div>

      {success && <div className="company-success">{success}</div>}
      {error && <div className="company-error">{error}</div>}

      {showForm && (
        <div className="company-form-card">
          <div className="company-form-heading">
            <h2>
              {editingId ? "Edit Company" : "Register New Company"}
            </h2>

            <button
              type="button"
              className="close-form-btn"
              onClick={() => setShowForm(false)}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="company-form-grid">
              <div className="company-field">
                <label>Company Name *</label>
                <input
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Enter company name"
                  required
                />
              </div>

              <div className="company-field">
                <label>Company ID *</label>
                <input
                  name="companyId"
                  value={formData.companyId}
                  onChange={handleChange}
                  placeholder="Example: GOMAANEK"
                  required
                  disabled={Boolean(editingId)}
                />
                {editingId && (
                  <small>Company ID cannot be changed.</small>
                )}
              </div>

              <div className="company-field">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="company@example.com"
                />
              </div>

              <div className="company-field">
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>

              <div className="company-field full-width">
                <label>Company Address</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter company address"
                  rows="3"
                />
              </div>
            </div>

            <div className="company-form-actions">
              <button
                type="button"
                className="cancel-company-btn"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-company-btn"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Company"
                    : "Save Company"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="companies-list-card">
        <div className="companies-list-heading">
          <div>
            <h2>Registered Companies</h2>
            <p>Total Companies: {companies.length}</p>
          </div>

          <button
            className="refresh-company-btn"
            onClick={fetchCompanies}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {loading ? (
          <p className="company-empty">Loading companies...</p>
        ) : companies.length === 0 ? (
          <div className="company-empty">
            <Building2 size={40} />
            <h3>No companies registered yet</h3>
            <p>Click Add New Company to register your first company.</p>
          </div>
        ) : (
          <div className="company-table-wrapper">
            <table className="company-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Company ID</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {companies.map((company) => (
                  <tr key={company._id}>
                    <td>{company.companyName}</td>
                    <td>{company.companyId}</td>
                    <td>{company.email || "-"}</td>
                    <td>{company.phone || "-"}</td>
                    <td>
                      <span
                        className={`company-status ${company.status}`}
                      >
                        {company.status}
                      </span>
                    </td>
                    <td>
                      <div className="company-actions">
                        <button
                          className="edit-company-btn"
                          onClick={() => openEditForm(company)}
                          title="Edit company"
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          className="toggle-company-btn"
                          onClick={() => handleStatusChange(company)}
                          title={
                            company.status === "active"
                              ? "Deactivate company"
                              : "Activate company"
                          }
                        >
                          <Power size={16} />
                          {company.status === "active"
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

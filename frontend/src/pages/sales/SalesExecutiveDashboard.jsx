
import { useEffect, useState } from "react";
import api from "../../services/api";
import FollowUps from "../company-admin/FollowUps";

import "./SalesExecutiveDashboard.css";

import {
  LogOut,
  Users,
  CheckCircle,
  PhoneOff,
  CalendarDays,
  ClipboardList,
} from "lucide-react";

const leadFieldDefinitions = [
  {
    key: "created_time",
    label: "Created Time",
  },
  {
    key: "full_name",
    label: "Name",
  },
  {
    key: "phone_number",
    label: "Phone",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "city",
    label: "City",
  },
  {
    key: "what_are_you_looking_for?",
    label: "Looking For",
  },
  {
    key: "what_is_your_preferred_investment_budget?",
    label: "Investment Budget",
  },
];

// Lead status labels
const getStatusLabel = (status) => {
  const labels = {
    new: "New",
    qualified: "Qualified",
    not_qualified: "Not Qualified",
    not_connected: "Not Connected",
    converted: "Converted",
  };

  return labels[status] || status;
};

function SalesExecutiveDashboard({ onLogout }) {
  const [leads, setLeads] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [status, setStatus] = useState("qualified");
  const [remarks, setRemarks] = useState("");
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeView, setActiveView] = useState("leads");

  // Fetch settings and assigned leads
  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const [leadsResponse, settingsResponse] = await Promise.all([
        api.get("/leads/my-leads"),
        api.get("/companies/lead-field-settings"),
      ]);

      setLeads(leadsResponse.data.leads || []);
      setSettings(settingsResponse.data.settings || {});
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load your leads and settings."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeads();
  }, []);

  // Only enabled fields will be displayed
  const visibleFields = leadFieldDefinitions.filter(
    (field) => settings[field.key] !== false
  );

  const openUpdateForm = (lead) => {
    setSelectedLead(lead);
    setStatus(lead.status || "qualified");
    setRemarks("");
    setNextFollowUpDate("");
    setMessage("");
  };

  // Update lead
  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!remarks.trim()) {
      setMessage("Please enter mandatory remarks.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await api.patch(`/leads/${selectedLead._id}/update`, {
        status,
        remarks: remarks.trim(),
        nextFollowUpDate:
          status === "converted" ? null : nextFollowUpDate || null,
      });

      setSelectedLead(null);
      setMessage("Lead updated successfully!");

      await fetchMyLeads();
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to update lead."
      );
    } finally {
      setSaving(false);
    }
  };

  const qualifiedCount = leads.filter(
    (lead) => lead.status === "qualified"
  ).length;

  const notConnectedCount = leads.filter(
    (lead) => lead.status === "not_connected"
  ).length;

  if (loading) {
    return (
      <div className="sales-dashboard">
        <p>Loading your leads...</p>
      </div>
    );
  }

  return (
    <div className="sales-dashboard">

      {/* Header */}
      <div className="sales-header">
        <div>
          <h1>Sales Executive Dashboard</h1>
          <p>Manage your assigned leads and follow-ups.</p>
        </div>

        <button className="sales-logout" onClick={onLogout}>
          <LogOut size={17} />
          Logout
        </button>
      </div>

      {/* Dashboard Navigation */}
      <div className="sales-view-navigation">
        <button
          className={
            activeView === "leads"
              ? "sales-view-btn active"
              : "sales-view-btn"
          }
          onClick={() => {
            setActiveView("leads");
            setSelectedLead(null);
            setMessage("");
          }}
        >
          <ClipboardList size={18} />
          My Assigned Leads
        </button>

        <button
          className={
            activeView === "followups"
              ? "sales-view-btn active"
              : "sales-view-btn"
          }
          onClick={() => {
            setActiveView("followups");
            setSelectedLead(null);
            setMessage("");
          }}
        >
          <CalendarDays size={18} />
          Follow-ups
        </button>
      </div>

      {/* Follow-ups Section */}
      {activeView === "followups" && <FollowUps />}

      {/* Assigned Leads Section */}
      {activeView === "leads" && (
        <>
          {/* Statistics */}
          <div className="sales-summary">
            <div className="sales-stat-card">
              <Users size={24} />
              <p>Total Assigned Leads</p>
              <h2>{leads.length}</h2>
            </div>

            <div className="sales-stat-card">
              <CheckCircle size={24} />
              <p>Qualified Leads</p>
              <h2>{qualifiedCount}</h2>
            </div>

            <div className="sales-stat-card">
              <PhoneOff size={24} />
              <p>Not Connected</p>
              <h2>{notConnectedCount}</h2>
            </div>
          </div>

          {error && (
            <div className="sales-error">{error}</div>
          )}

          {message && (
            <div className="sales-message">{message}</div>
          )}

          {/* Leads Table */}
          <div className="sales-leads-card">
            <h2>My Assigned Leads</h2>

            {leads.length === 0 ? (
              <div className="sales-empty">
                <Users size={40} />
                <h3>No Leads Assigned Yet</h3>
                <p>Your assigned leads will appear here.</p>
              </div>
            ) : (
              <div className="sales-table-wrapper">
                <table className="sales-table">
                  <thead>
                    <tr>
                      {visibleFields.map((field) => (
                        <th key={field.key}>{field.label}</th>
                      ))}

                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leads.map((lead) => (
                      <tr key={lead._id}>
                        {visibleFields.map((field) => (
                          <td key={field.key}>
                            {lead.leadData?.[field.key] || "-"}
                          </td>
                        ))}

                        <td>
                          <span
                            className={`sales-status ${
                              lead.status || "new"
                            }`}
                          >
                            {getStatusLabel(lead.status || "new")}
                          </span>
                        </td>

                        <td>
                          <button
                            className="sales-btn"
                            onClick={() => openUpdateForm(lead)}
                          >
                            Update Lead
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Update Lead Form */}
          {selectedLead && (
            <div className="sales-form-card">
              <h2>Update Lead</h2>

              <p>
                Customer:{" "}
                <strong>
                  {selectedLead.leadData?.full_name ||
                    "Selected Lead"}
                </strong>
              </p>

              <form onSubmit={handleUpdate}>
                <label>Lead Status *</label>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="qualified">Qualified</option>
                  <option value="not_qualified">Not Qualified</option>
                  <option value="not_connected">Not Connected</option>
                  <option value="converted">Converted</option>
                </select>

                <label>Remarks *</label>

                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter conversation details or reason..."
                  rows={4}
                  required
                />

                {status !== "converted" && (
                  <>
                    <label>Next Follow-up Date</label>

                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) =>
                        setNextFollowUpDate(e.target.value)
                      }
                    />
                  </>
                )}

                <div className="sales-form-actions">
                  <button
                    type="submit"
                    className="sales-btn"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save Update"}
                  </button>

                  <button
                    type="button"
                    className="sales-cancel-btn"
                    onClick={() => {
                      setSelectedLead(null);
                      setMessage("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SalesExecutiveDashboard;

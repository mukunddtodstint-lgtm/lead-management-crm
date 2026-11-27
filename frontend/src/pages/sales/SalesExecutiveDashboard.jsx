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

// ==========================================
// LEAD FIELD DEFINITIONS
// ==========================================

const leadFieldDefinitions = [
  { key: "created_time", label: "Created Time" },
  { key: "full_name", label: "Name" },
  { key: "phone_number", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
  {
    key: "what_are_you_looking_for?",
    label: "Looking For",
  },
  {
    key: "what_is_your_preferred_investment_budget?",
    label: "Investment Budget",
  },
];

// ==========================================
// STATUS LABELS
// ==========================================

const getStatusLabel = (status) => {
  const labels = {
    new: "New",
    qualified: "Qualified",
    not_qualified: "Not Qualified",
    not_connected: "Not Connected",
    converted: "Converted",
  };

  return labels[status] || status || "New";
};

// ==========================================
// SALES EXECUTIVE DASHBOARD
// ==========================================

function SalesExecutiveDashboard({ onLogout }) {
  const [leads, setLeads] = useState([]);
  const [totalLeads, setTotalLeads] = useState(0);
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

  // ==========================================
  // FETCH ASSIGNED LEADS AND SETTINGS
  // ==========================================

  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      setError("");

      const [leadsResponse, settingsResponse] =
        await Promise.all([
          api.get("/leads/my-leads"),
          api.get("/companies/lead-field-settings"),
        ]);

      const fetchedLeads =
        leadsResponse.data?.leads || [];

      setLeads(fetchedLeads);

      setTotalLeads(
        leadsResponse.data?.totalLeads ?? fetchedLeads.length
      );

      setSettings(
        settingsResponse.data?.settings || {}
      );

      console.log("MY LEADS:", fetchedLeads);
      console.log(
        "LEAD FIELD SETTINGS:",
        settingsResponse.data?.settings
      );

    } catch (err) {
      console.error(
        "FETCH LEADS ERROR:",
        err.response?.data || err.message
      );

      setError(
        err.response?.data?.message ||
          "Unable to load your leads and settings."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // INITIAL LOAD
  // ==========================================

  useEffect(() => {
    fetchMyLeads();
  }, []);

  // ==========================================
  // VISIBLE LEAD FIELDS
  // ==========================================

  const visibleFields = leadFieldDefinitions.filter(
    (field) => settings[field.key] !== false
  );

  // ==========================================
  // OPEN UPDATE FORM
  // ==========================================

  const openUpdateForm = (lead) => {
    setSelectedLead(lead);

    setStatus(
      [
        "qualified",
        "not_qualified",
        "not_connected",
        "converted",
      ].includes(lead.status)
        ? lead.status
        : "qualified"
    );

    setRemarks("");
    setNextFollowUpDate("");
    setMessage("");
    setError("");

    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: "smooth",
    });
  };

  // ==========================================
  // UPDATE LEAD
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!selectedLead?._id) {
      setMessage("Please select a valid lead.");
      return;
    }

    if (!remarks.trim()) {
      setMessage("Remarks are mandatory.");
      return;
    }

    const normalizedStatus = String(status || "")
      .trim()
      .toLowerCase()
      .replace(/[\s-]+/g, "_");

    const allowedStatuses = [
      "qualified",
      "not_qualified",
      "not_connected",
      "converted",
    ];

    if (!allowedStatuses.includes(normalizedStatus)) {
      setMessage("Please select a valid lead status.");
      return;
    }

    // Prepare API payload
    const payload = {
      status: normalizedStatus,
      remarks: remarks.trim(),
      nextFollowUpDate:
        normalizedStatus === "converted"
          ? null
          : nextFollowUpDate || null,
    };

    console.log("========== LEAD UPDATE ==========");
    console.log("LEAD ID:", selectedLead._id);
    console.log("UPDATE PAYLOAD:", payload);
    console.log("=================================");

    try {
      setSaving(true);
      setMessage("");
      setError("");

      // PATCH API
      const response = await api.patch(
        `/leads/${selectedLead._id}/update`,
        payload
      );

      console.log(
        "LEAD UPDATE RESPONSE:",
        response.data
      );

      if (!response.data?.success) {
        throw new Error(
          response.data?.message ||
            "Lead update failed."
        );
      }

      // Close form
      setSelectedLead(null);

      setRemarks("");
      setNextFollowUpDate("");

      // Refresh assigned leads
      await fetchMyLeads();

      // Display backend success message
      setMessage(
        response.data?.message ||
          "Lead updated successfully!"
      );

    } catch (err) {
      console.error(
        "LEAD UPDATE ERROR:",
        err.response?.data || err.message
      );

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to update lead. Please try again.";

      setMessage(errorMessage);

    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // DASHBOARD STATISTICS
  // ==========================================

  const qualifiedCount = leads.filter(
    (lead) => lead.status === "qualified"
  ).length;

  const notConnectedCount = leads.filter(
    (lead) => lead.status === "not_connected"
  ).length;

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="sales-dashboard">
        <p>Loading your leads...</p>
      </div>
    );
  }

  // ==========================================
  // MAIN DASHBOARD
  // ==========================================

  return (
    <div className="sales-dashboard">

      {/* HEADER */}

      <div className="sales-header">
        <div>
          <h1>Sales Executive Dashboard</h1>
          <p>
            Manage your assigned leads and follow-ups.
          </p>
        </div>

        <button
          className="sales-logout"
          onClick={onLogout}
        >
          <LogOut size={17} />
          Logout
        </button>
      </div>

      {/* NAVIGATION */}

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

      {/* FOLLOW-UPS */}

      {activeView === "followups" && (
        <FollowUps />
      )}

      {/* MY ASSIGNED LEADS */}

      {activeView === "leads" && (
        <>

          {/* STATISTICS */}

          <div className="sales-summary">

            <div className="sales-stat-card">
              <Users size={24} />
              <p>Total Assigned Leads</p>
              <h2>{totalLeads}</h2>
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

          {/* ERROR MESSAGE */}

          {error && (
            <div className="sales-error">
              {error}
            </div>
          )}

          {/* SUCCESS / UPDATE MESSAGE */}

          {message && (
            <div className="sales-message">
              {message}
            </div>
          )}

          {/* LEADS TABLE */}

          <div className="sales-leads-card">

            <h2>My Assigned Leads</h2>

            {leads.length === 0 ? (

              <div className="sales-empty">
                <Users size={40} />
                <h3>No Leads Assigned Yet</h3>
                <p>
                  Your assigned leads will appear here.
                </p>
              </div>

            ) : (

              <div className="sales-table-wrapper">

                <table className="sales-table">

                  <thead>
                    <tr>

                      {visibleFields.map((field) => (
                        <th key={field.key}>
                          {field.label}
                        </th>
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
                            {lead.leadData?.[field.key] ?? "-"}
                          </td>

                        ))}

                        <td>
                          <span
                            className={`sales-status ${
                              lead.status || "new"
                            }`}
                          >
                            {getStatusLabel(lead.status)}
                          </span>
                        </td>

                        <td>

                          <button
                            className="sales-btn"
                            onClick={() =>
                              openUpdateForm(lead)
                            }
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

          {/* UPDATE LEAD FORM */}

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

                {/* STATUS */}

                <label>Lead Status *</label>

                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value)
                  }
                  required
                >

                  <option value="qualified">
                    Qualified
                  </option>

                  <option value="not_qualified">
                    Not Qualified
                  </option>

                  <option value="not_connected">
                    Not Connected
                  </option>

                  <option value="converted">
                    Converted
                  </option>

                </select>

                {/* REMARKS */}

                <label>Remarks *</label>

                <textarea
                  value={remarks}
                  onChange={(e) =>
                    setRemarks(e.target.value)
                  }
                  placeholder="Enter conversation details or reason..."
                  rows={4}
                  required
                />

                {/* FOLLOW-UP DATE */}

                {status !== "converted" && (
                  <>

                    <label>
                      Next Follow-up Date
                    </label>

                    <input
                      type="date"
                      value={nextFollowUpDate}
                      onChange={(e) =>
                        setNextFollowUpDate(
                          e.target.value
                        )
                      }
                    />

                  </>
                )}

                {/* FORM ACTIONS */}

                <div className="sales-form-actions">

                  <button
                    type="submit"
                    className="sales-btn"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : "Save Update"}
                  </button>

                  <button
                    type="button"
                    className="sales-cancel-btn"
                    disabled={saving}
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

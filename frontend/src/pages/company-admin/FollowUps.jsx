
import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  RefreshCw,
  Clock,
  AlertCircle,
  CheckCircle,
  Search,
  X,
} from "lucide-react";
import api from "../../services/api";
import "./FollowUps.css";

function FollowUps() {
  const user = JSON.parse(sessionStorage.getItem("crmUser") || "{}");
  const isSales = user.role === "sales";

  const [leads, setLeads] = useState([]);
  const [activeTab, setActiveTab] = useState("today");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedLead, setSelectedLead] = useState(null);
  const [remarks, setRemarks] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [status, setStatus] = useState("qualified");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError("");

      if (isSales) {
        const response = await api.get("/leads/my-leads");
        const data = response.data.leads || response.data;
        setLeads(Array.isArray(data) ? data : []);
      } else {
        let allLeads = [];
        let page = 1;
        const limit = 100;

        while (true) {
          const response = await api.get("/leads", {
            params: { page, limit },
          });

          const batch = response.data.leads || [];
          allLeads = [...allLeads, ...batch];

          const totalPages =
            response.data.totalPages ||
            response.data.pagination?.totalPages;

          if (totalPages) {
            if (page >= totalPages) break;
          } else if (batch.length < limit) {
            break;
          }

          page += 1;
        }

        setLeads(allLeads);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load follow-ups. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const today = new Date();

  const todayKey = `${today.getFullYear()}-${String(
    today.getMonth() + 1
  ).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const getDateKey = (value) => {
    if (!value) return "";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  };

  const followUpLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (!lead.nextFollowUpDate) return false;

      if (
        !["qualified", "not_connected"].includes(lead.status)
      ) {
        return false;
      }

      const dateKey = getDateKey(lead.nextFollowUpDate);

      if (!dateKey) return false;

      const name = lead.leadData?.full_name || "";
      const phone = lead.leadData?.phone_number || "";
      const searchText = `${name} ${phone}`.toLowerCase();

      if (search && !searchText.includes(search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [leads, search]);

  const todayFollowUps = followUpLeads.filter(
    (lead) => getDateKey(lead.nextFollowUpDate) === todayKey
  );

  const upcomingFollowUps = followUpLeads.filter(
    (lead) => getDateKey(lead.nextFollowUpDate) > todayKey
  );

  const overdueFollowUps = followUpLeads.filter(
    (lead) => getDateKey(lead.nextFollowUpDate) < todayKey
  );

  const displayedLeads =
    activeTab === "today"
      ? todayFollowUps
      : activeTab === "upcoming"
      ? upcomingFollowUps
      : overdueFollowUps;

  const openUpdateForm = (lead) => {
    setSelectedLead(lead);
    setRemarks("");
    setNextDate("");
    setStatus(lead.status || "qualified");
    setMessage("");
  };

  const closeUpdateForm = () => {
    setSelectedLead(null);
    setRemarks("");
    setNextDate("");
    setMessage("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!remarks.trim()) {
      setMessage("Please enter call remarks.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      await api.patch(`/leads/${selectedLead._id}/update`, {
        status,
        remarks: remarks.trim(),
        nextFollowUpDate: status === "converted" ? null : nextDate || null,
      });

      setMessage(
        status === "converted"
          ? "Lead marked as converted successfully."
          : "Follow-up updated successfully."
      );

      await fetchLeads();
      setTimeout(() => closeUpdateForm(), 700);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Unable to update follow-up."
      );
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "Not scheduled";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Invalid date";

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusLabel = (value) => {
    const labels = {
      qualified: "Qualified",
      not_qualified: "Not Qualified",
      not_connected: "Not Connected",
      converted: "Converted",
      new: "New",
    };

    return labels[value] || value || "New";
  };

  const getExecutiveName = (lead) => {
    if (!lead.assignedTo) return "Unassigned";

    if (typeof lead.assignedTo === "object") {
      return lead.assignedTo.name || "Assigned";
    }

    return "Assigned";
  };

  return (
    <div className="followups-page">
      <div className="followups-header">
        <div>
          <h1>Follow-up Management</h1>
          <p>
            {isSales
              ? "Manage your assigned lead follow-ups."
              : "Track and manage your company's lead follow-ups."}
          </p>
        </div>

        <button className="followups-refresh" onClick={fetchLeads}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <div className="followups-error">{error}</div>}

      <div className="followups-summary">
        <div className="followups-summary-card">
          <div className="followups-summary-icon today-icon">
            <CalendarDays />
          </div>
          <div>
            <span>Today's Follow-ups</span>
            <strong>{todayFollowUps.length}</strong>
          </div>
        </div>

        <div className="followups-summary-card">
          <div className="followups-summary-icon upcoming-icon">
            <Clock />
          </div>
          <div>
            <span>Upcoming Follow-ups</span>
            <strong>{upcomingFollowUps.length}</strong>
          </div>
        </div>

        <div className="followups-summary-card">
          <div className="followups-summary-icon overdue-icon">
            <AlertCircle />
          </div>
          <div>
            <span>Overdue Follow-ups</span>
            <strong>{overdueFollowUps.length}</strong>
          </div>
        </div>
      </div>

      <div className="followups-content">
        <div className="followups-toolbar">
          <div className="followups-tabs">
            <button
              className={activeTab === "today" ? "active" : ""}
              onClick={() => setActiveTab("today")}
            >
              Today ({todayFollowUps.length})
            </button>

            <button
              className={activeTab === "upcoming" ? "active" : ""}
              onClick={() => setActiveTab("upcoming")}
            >
              Upcoming ({upcomingFollowUps.length})
            </button>

            <button
              className={activeTab === "overdue" ? "active" : ""}
              onClick={() => setActiveTab("overdue")}
            >
              Overdue ({overdueFollowUps.length})
            </button>
          </div>

          <div className="followups-search">
            <Search size={17} />
            <input
              type="text"
              placeholder="Search name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="followups-empty">
            <RefreshCw className="followups-spinner" />
            <p>Loading follow-ups...</p>
          </div>
        ) : displayedLeads.length === 0 ? (
          <div className="followups-empty">
            <CheckCircle size={35} />
            <h3>No follow-ups found</h3>
            <p>There are no follow-ups in this category.</p>
          </div>
        ) : (
          <div className="followups-table-wrapper">
            <table className="followups-table">
              <thead>
                <tr>
                  <th>Lead Name</th>
                  <th>Phone</th>
                  <th>City</th>
                  <th>Status</th>
                  {!isSales && <th>Assigned Executive</th>}
                  <th>Follow-up Date</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {displayedLeads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="followup-lead-name">
                      {lead.leadData?.full_name || "Unnamed Lead"}
                    </td>
                    <td>{lead.leadData?.phone_number || "—"}</td>
                    <td>{lead.leadData?.city || "—"}</td>
                    <td>
                      <span className={`followup-status ${lead.status}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    {!isSales && <td>{getExecutiveName(lead)}</td>}
                    <td>{formatDate(lead.nextFollowUpDate)}</td>
                    <td>
                      {isSales ? (
                        <button
                          className="followup-action-btn"
                          onClick={() => openUpdateForm(lead)}
                        >
                          Update
                        </button>
                      ) : (
                        <span className="followup-view-only">View only</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedLead && (
        <div className="followup-modal-overlay">
          <div className="followup-modal">
            <div className="followup-modal-header">
              <div>
                <h2>Update Follow-up</h2>
                <p>{selectedLead.leadData?.full_name || "Lead details"}</p>
              </div>
              <button onClick={closeUpdateForm} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <label>
                Lead Status
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  required
                >
                  <option value="qualified">Qualified</option>
                  <option value="not_connected">Not Connected</option>
                  <option value="not_qualified">Not Qualified</option>
                  <option value="converted">Converted</option>
                </select>
              </label>

              <label>
                Call Remarks *
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter call discussion or reason..."
                  rows="4"
                  required
                />
              </label>

              {status !== "converted" && (
                <label>
                  Next Follow-up Date
                  <input
                    type="date"
                    value={nextDate}
                    min={todayKey}
                    onChange={(e) => setNextDate(e.target.value)}
                  />
                </label>
              )}

              {message && (
                <div className="followup-form-message">{message}</div>
              )}

              <div className="followup-modal-actions">
                <button
                  type="button"
                  className="followup-cancel-btn"
                  onClick={closeUpdateForm}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="followup-save-btn"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FollowUps;

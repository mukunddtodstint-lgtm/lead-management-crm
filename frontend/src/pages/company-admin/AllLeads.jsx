
import { useEffect, useState } from "react";
import { Search, RefreshCw, Eye, X, Clock } from "lucide-react";
import api from "../../services/api";
import "./AllLeads.css";

function AllLeads() {
  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Activity History States
  const [selectedLead, setSelectedLead] = useState(null);
  const [activityHistory, setActivityHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  // Fetch Leads
  const fetchLeads = async (
    currentPage = page,
    searchValue = search,
    statusValue = status
  ) => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/leads", {
        params: {
          search: searchValue,
          status: statusValue,
          page: currentPage,
          limit: 20,
        },
      });

      setLeads(response.data.leads || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalLeads(response.data.totalLeads || 0);

    } catch (err) {
      console.error("Fetch Leads Error:", err);

      setError(
        err.response?.data?.message || "Unable to load leads."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads(page, search, status);
  }, [page, status]);

  // Search Leads
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLeads(1, search, status);
  };

  // Refresh Leads
  const handleRefresh = () => {
    fetchLeads(page, search, status);
  };

  // Change Status Filter
  const handleStatusChange = (value) => {
    setStatus(value);
    setPage(1);
  };

  // Status Badge
  const getStatusClass = (leadStatus) => {
    const value = leadStatus || "new";
    return `lead-status-badge status-${value}`;
  };
const getStatusLabel = (value) => {
  const labels = {
    new: "New",
    qualified: "Qualified",
    not_qualified: "Not Qualified",
    not_connected: "Not Connected",
  };

  return labels[value] || value || "New";
};
  // Open Lead Activity History
  const handleViewHistory = async (lead) => {
    try {
      setSelectedLead(lead);
      setActivityHistory([]);
      setHistoryError("");
      setHistoryLoading(true);

      const response = await api.get(`/leads/${lead._id}/history`);

      setActivityHistory(
        response.data.lead?.activityHistory || []
      );

    } catch (err) {
      setHistoryError(
        err.response?.data?.message ||
        "Unable to load activity history."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Format Date
  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="all-leads-page">

      {/* Page Header */}
      <div className="all-leads-header">
        <div>
          <h2>All Leads</h2>
          <p>
            Manage and monitor all your company's leads.
          </p>
        </div>

        <div className="all-leads-total">
          <span>Total Leads</span>
          <strong>{totalLeads}</strong>
        </div>
      </div>

      {/* Search and Filters */}
      <form
        onSubmit={handleSearch}
        className="all-leads-toolbar"
      >
        <input
          type="text"
          placeholder="Search name, phone, email or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <button type="submit" className="all-leads-search-btn">
          <Search size={16} />
          Search
        </button>

        <select
          value={status}
          onChange={(e) => handleStatusChange(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="qualified">Qualified</option>
          <option value="not_qualified">Not Qualified</option>
          <option value="not_connected">Not Connected</option>
        </select>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </form>

      {error && (
        <div className="all-leads-error">{error}</div>
      )}

      {/* Leads Table */}
      <div className="all-leads-table-card">

        <div className="all-leads-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>City</th>
                <th>Lead Source</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Activity History</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="all-leads-empty">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead._id}>
                    <td className="lead-name">
                      {lead.leadData?.full_name || "-"}
                    </td>

                    <td>
                      {lead.leadData?.phone_number || "-"}
                    </td>

                    <td>
                      {lead.leadData?.email || "-"}
                    </td>

                    <td>
                      {lead.leadData?.city || "-"}
                    </td>

                    <td>
                      <span className="lead-source-badge">
                        Google Sheets
                      </span>
                    </td>

                    <td>
                      <span className={getStatusClass(lead.status)}>
                        {(lead.status || "new").replaceAll("_", " ")}
                      </span>
                    </td>

                    <td>
                      {lead.assignedTo?.name ? (
                        <span className="lead-assigned-name">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="lead-unassigned">
                          Unassigned
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="view-history-btn"
                        onClick={() => handleViewHistory(lead)}
                      >
                        <Eye size={15} />
                        View History
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="all-leads-empty">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="all-leads-pagination">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((prev) => prev - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Activity History Modal */}
      {selectedLead && (
        <div
          className="history-modal-overlay"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <div>
                <h2>Lead Activity History</h2>
                <p>
                  {selectedLead.leadData?.full_name || "Unnamed Lead"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLead(null)}
                className="history-close-btn"
              >
                <X size={21} />
              </button>
            </div>

            <div className="history-lead-info">
              <div>
                <span>Phone</span>
                <strong>
                  {selectedLead.leadData?.phone_number || "-"}
                </strong>
              </div>

              <div>
                <span>Current Status</span>
                <strong>
                  {(selectedLead.status || "new").replaceAll("_", " ")}
                </strong>
              </div>

              <div>
                <span>Assigned To</span>
                <strong>
                  {selectedLead.assignedTo?.name || "Unassigned"}
                </strong>
              </div>
            </div>

            <div className="history-content">
              <h3>
                <Clock size={18} />
                Update Timeline
              </h3>

              {historyLoading ? (
                <p>Loading activity history...</p>
              ) : historyError ? (
                <div className="all-leads-error">
                  {historyError}
                </div>
              ) : activityHistory.length > 0 ? (
                <div className="history-timeline">
                  {[...activityHistory].reverse().map((activity, index) => (
                    <div
                      className="history-item"
                      key={activity._id || index}
                    >
                      <div className="history-dot"></div>

                      <div className="history-item-card">
                        <div className="history-item-top">
                          <span
                            className={getStatusClass(activity.status)}
                          >
                            {getStatusLabel(activity.status)}
                          </span>

                          <small>
                            {formatDate(activity.updatedAt)}
                          </small>
                        </div>

                        <p>
                          <strong>Updated By: </strong>
                          {activity.updatedBy?.name || "Unknown"}
                          {activity.updatedBy?.employeeId
                            ? ` (${activity.updatedBy.employeeId})`
                            : ""}
                        </p>

                        <div className="history-remarks">
                          <strong>Remarks</strong>
                          <p>{activity.remarks || "-"}</p>
                        </div>

                        <p>
                          <strong>Next Follow-up: </strong>
                          {activity.nextFollowUpDate
                            ? new Date(
                                activity.nextFollowUpDate
                              ).toLocaleDateString("en-IN")
                            : "Not scheduled"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="sales-empty">
                  <Clock size={35} />
                  <h3>No Activity Yet</h3>
                  <p>
                    Sales Executive updates will appear here.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

export default AllLeads;

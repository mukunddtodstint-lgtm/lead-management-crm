
import { useEffect, useState } from "react";
import { Search, RefreshCw, Users } from "lucide-react";
import api from "../../services/api";
import "./LeadAssignment.css";

function LeadAssignment() {
  const [leads, setLeads] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeads = async () => {
    try {
      setLoading(true);

      const response = await api.get("/leads", {
        params: { search, page, limit: 50 },
      });

      setLeads(response.data.leads || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error("Fetch Leads Error:", error);
      setMessage("Unable to load leads.");
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutives = async () => {
    try {
      const response = await api.get("/users");

      const users =
        response.data.users ||
        response.data.employees ||
        [];

      setExecutives(
        users.filter(
          (user) =>
            user.role === "sales" &&
            user.status === "active"
        )
      );
    } catch (error) {
      console.error("Fetch Executives Error:", error);
      setMessage("Unable to load Sales Executives.");
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [page]);

  useEffect(() => {
    fetchExecutives();
  }, []);

  const toggleLead = (id) => {
    setSelectedLeads((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
    );
  };

  const toggleAll = () => {
    const unassignedLeads = leads.filter(
      (lead) => !lead.assignedTo
    );

    const allSelected =
      unassignedLeads.length > 0 &&
      unassignedLeads.every((lead) =>
        selectedLeads.includes(lead._id)
      );

    if (allSelected) {
      setSelectedLeads((previous) =>
        previous.filter(
          (id) =>
            !unassignedLeads.some(
              (lead) => lead._id === id
            )
        )
      );
    } else {
      setSelectedLeads((previous) => [
        ...new Set([
          ...previous,
          ...unassignedLeads.map((lead) => lead._id),
        ]),
      ]);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const response = await api.get("/leads", {
        params: {
          search,
          page: 1,
          limit: 50,
        },
      });

      setPage(1);
      setLeads(response.data.leads || []);
      setTotalPages(response.data.totalPages || 1);
      setSelectedLeads([]);
    } catch (error) {
      console.error("Search Leads Error:", error);
      setMessage("Unable to search leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedLeads.length || !employeeId) {
      setMessage(
        "Please select leads and a Sales Executive."
      );
      return;
    }

    try {
      setAssigning(true);
      setMessage("");

      const response = await api.post("/leads/assign", {
        leadIds: selectedLeads,
        employeeId,
      });

      setMessage(response.data.message);
      setSelectedLeads([]);
      await fetchLeads();
    } catch (error) {
      console.error("Assign Leads Error:", error);

      setMessage(
        error.response?.data?.message ||
        "Unable to assign leads."
      );
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="lead-assignment-page">

      <div className="la-page-header">
        <div>
          <h2>Lead Assignment</h2>
          <p>
            Select leads and assign them to your Sales Executives.
          </p>
        </div>
      </div>

      {message && (
        <div className="la-message">
          {message}
        </div>
      )}

      <div className="la-summary-card">
        <span>Selected Leads</span>
        <strong>{selectedLeads.length}</strong>
      </div>

      <div className="la-toolbar">

        <form
          onSubmit={handleSearch}
          className="la-search-form"
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email or city..."
          />

          <button type="submit">
            <Search size={16} />
            Search
          </button>
        </form>

        <select
          value={employeeId}
          onChange={(e) => setEmployeeId(e.target.value)}
        >
          <option value="">
            Select Sales Executive
          </option>

          {executives.map((executive) => (
            <option
              key={executive._id}
              value={executive.employeeId}
            >
              {executive.name} ({executive.employeeId})
            </option>
          ))}
        </select>

        <button
          className="la-assign-btn"
          onClick={handleAssign}
          disabled={
            assigning ||
            !selectedLeads.length ||
            !employeeId
          }
        >
          <Users size={16} />
          {assigning
            ? "Assigning..."
            : `Assign ${selectedLeads.length} Leads`}
        </button>

        <button
          onClick={() => {
            setSearch("");
            setPage(1);
            setSelectedLeads([]);
            fetchLeads();
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

      </div>

      <div className="la-table-card">
        <div className="la-table-wrapper">

          <table className="la-table">

            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    onChange={toggleAll}
                    checked={
                      leads.filter(
                        (lead) => !lead.assignedTo
                      ).length > 0 &&
                      leads
                        .filter(
                          (lead) => !lead.assignedTo
                        )
                        .every((lead) =>
                          selectedLeads.includes(lead._id)
                        )
                    }
                  />
                </th>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Assigned To</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="la-empty-state">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length > 0 ? (
                leads.map((lead) => (
                  <tr key={lead._id}>

                    <td>
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead._id)}
                        onChange={() => toggleLead(lead._id)}
                        disabled={Boolean(lead.assignedTo)}
                      />
                    </td>

                    <td>
                      {lead.leadData?.full_name || "-"}
                    </td>

                    <td>
                      {lead.leadData?.phone_number || "-"}
                    </td>

                    <td>
                      {lead.leadData?.city || "-"}
                    </td>

                    <td>
                      <span
                        className={`la-status la-status-${lead.status || "new"}`}
                      >
                        {(lead.status || "new").replaceAll("_", " ")}
                      </span>
                    </td>

                    <td>
                      {lead.assignedTo?.name ? (
                        <span className="la-assigned-name">
                          {lead.assignedTo.name}
                        </span>
                      ) : (
                        <span className="la-unassigned">
                          Unassigned
                        </span>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="la-empty-state">
                    No leads found.
                  </td>
                </tr>
              )}
            </tbody>

          </table>

        </div>

        <div className="la-pagination">

          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </button>

          <span>
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>

        </div>
      </div>

    </div>
  );
}

export default LeadAssignment;

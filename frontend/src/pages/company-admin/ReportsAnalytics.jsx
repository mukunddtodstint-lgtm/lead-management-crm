
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  Users,
  ClipboardList,
  CheckCircle,
  PhoneOff,
  XCircle,
  Download,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import api from "../../services/api";
import "./ReportsAnalytics.css";

const getDateKey = (date) => {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getStatusLabel = (status) => {
  const labels = {
    new: "New",
    qualified: "Qualified",
    not_qualified: "Not Qualified",
    not_connected: "Not Connected",
  };
  return labels[status] || status || "New";
};

function ReportsAnalytics() {
  const [leads, setLeads] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");

      // Fetch all lead pages
      let allLeads = [];
      let page = 1;
      const limit = 100;

      while (true) {
        const response = await api.get("/leads", {
          params: { page, limit },
        });

        const batch = response.data.leads || [];
        allLeads = [...allLeads, ...batch];

        const totalPages = response.data.pagination?.totalPages;

        if (totalPages) {
          if (page >= totalPages) break;
        } else if (batch.length < limit) {
          break;
        }

        page += 1;
      }

      const employeeResponse = await api.get("/users");

      setLeads(allLeads);
      setEmployees(
  employeeResponse.data.employees ||
  employeeResponse.data.users ||
  []
);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load reports. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const date = getDateKey(lead.leadData?.created_time || lead.createdAt);

      if (fromDate && date < fromDate) return false;
      if (toDate && date > toDate) return false;

      return true;
    });
  }, [leads, fromDate, toDate]);

  const activities = useMemo(() => {
    return filteredLeads.flatMap((lead) =>
      (lead.activityHistory || []).map((activity) => ({
        ...activity,
        leadId: lead._id,
        leadName: lead.leadData?.full_name || "Unnamed Lead",
      }))
    );
  }, [filteredLeads]);

  const stats = useMemo(() => {
    return {
      total: filteredLeads.length,
      assigned: filteredLeads.filter((lead) => lead.assignedTo).length,
      unassigned: filteredLeads.filter((lead) => !lead.assignedTo).length,
      qualified: filteredLeads.filter(
        (lead) => lead.status === "qualified"
      ).length,
      notQualified: filteredLeads.filter(
        (lead) => lead.status === "not_qualified"
      ).length,
      notConnected: filteredLeads.filter(
        (lead) => lead.status === "not_connected"
      ).length,
      activities: activities.length,
    };
  }, [filteredLeads, activities]);

  const executiveReports = useMemo(() => {
    return employees
      .filter((employee) => employee.role === "sales")
      .map((employee) => {
        const employeeId = String(employee._id);

        const assignedLeads = filteredLeads.filter(
          (lead) =>
            String(lead.assignedTo?._id || lead.assignedTo) === employeeId
        );

        const workedLeadIds = new Set(
          activities
            .filter(
              (activity) =>
                String(
                  activity.updatedBy?._id || activity.updatedBy
                ) === employeeId
            )
            .map((activity) => String(activity.leadId))
        );

        const employeeActivities = activities.filter(
          (activity) =>
            String(
              activity.updatedBy?._id || activity.updatedBy
            ) === employeeId
        );

        return {
          id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
          assigned: assignedLeads.length,
          worked: workedLeadIds.size,
          activities: employeeActivities.length,
          qualified: assignedLeads.filter(
            (lead) => lead.status === "qualified"
          ).length,
          notQualified: assignedLeads.filter(
            (lead) => lead.status === "not_qualified"
          ).length,
          notConnected: assignedLeads.filter(
            (lead) => lead.status === "not_connected"
          ).length,
        };
      });
  }, [employees, filteredLeads, activities]);

  const dailyReports = useMemo(() => {
    const grouped = {};

    activities.forEach((activity) => {
      const date = getDateKey(activity.updatedAt);
      if (!date) return;

      if (!grouped[date]) {
        grouped[date] = {
          date,
          activities: 0,
          qualified: 0,
          notQualified: 0,
          notConnected: 0,
        };
      }

      grouped[date].activities += 1;

      if (activity.status === "qualified") grouped[date].qualified += 1;
      if (activity.status === "not_qualified")
        grouped[date].notQualified += 1;
      if (activity.status === "not_connected")
        grouped[date].notConnected += 1;
    });

    return Object.values(grouped).sort((a, b) =>
      b.date.localeCompare(a.date)
    );
  }, [activities]);

  const exportCSV = () => {
    const headers = [
      "Executive Name",
      "Employee ID",
      "Assigned Leads",
      "Unique Leads Worked",
      "Total Activities",
      "Qualified",
      "Not Qualified",
      "Not Connected",
    ];

    const rows = executiveReports.map((item) => [
      item.name,
      item.employeeId,
      item.assigned,
      item.worked,
      item.activities,
      item.qualified,
      item.notQualified,
      item.notConnected,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crm-sales-performance-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="reports-loading">
        <RefreshCw className="reports-spinner" size={24} />
        <p>Loading reports and analytics...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div>
          <h1>Reports & Analytics</h1>
          <p>Monitor leads, sales activity and executive performance.</p>
        </div>

        <div className="reports-header-actions">
          <button className="reports-btn secondary" onClick={fetchReports}>
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="reports-btn primary" onClick={exportCSV}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {error && <div className="reports-error">{error}</div>}

      <div className="reports-filter">
        <div className="reports-filter-title">
          <CalendarDays size={19} />
          <span>Filter Reports by Date</span>
        </div>

        <div className="reports-date-fields">
          <label>
            From Date
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </label>

          <label>
            To Date
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              min={fromDate || undefined}
            />
          </label>

          <button
            className="reports-btn clear-btn"
            onClick={() => {
              setFromDate("");
              setToDate("");
            }}
          >
            Clear Filter
          </button>
        </div>
      </div>

      <div className="reports-section-heading">
        <h2>Lead Overview</h2>
        <span>{filteredLeads.length} leads in selected period</span>
      </div>

      <div className="reports-stats-grid">
        <div className="reports-stat-card">
          <div className="reports-stat-icon blue"><ClipboardList /></div>
          <div><p>Total Leads</p><h3>{stats.total}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon purple"><Users /></div>
          <div><p>Assigned Leads</p><h3>{stats.assigned}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon orange"><ClipboardList /></div>
          <div><p>Unassigned Leads</p><h3>{stats.unassigned}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon green"><CheckCircle /></div>
          <div><p>Qualified</p><h3>{stats.qualified}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon red"><XCircle /></div>
          <div><p>Not Qualified</p><h3>{stats.notQualified}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon gray"><PhoneOff /></div>
          <div><p>Not Connected</p><h3>{stats.notConnected}</h3></div>
        </div>

        <div className="reports-stat-card">
          <div className="reports-stat-icon teal"><BarChart3 /></div>
          <div><p>Total Activities</p><h3>{stats.activities}</h3></div>
        </div>
      </div>

      <div className="reports-section-heading">
        <h2>Sales Executive Performance</h2>
        <span>Executive-wise report</span>
      </div>

      <div className="reports-table-card">
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Sales Executive</th>
                <th>Employee ID</th>
                <th>Assigned</th>
                <th>Unique Worked</th>
                <th>Activities</th>
                <th>Qualified</th>
                <th>Not Qualified</th>
                <th>Not Connected</th>
              </tr>
            </thead>

            <tbody>
              {executiveReports.length > 0 ? (
                executiveReports.map((item) => (
                  <tr key={item.id}>
                    <td className="reports-employee-name">{item.name}</td>
                    <td>{item.employeeId}</td>
                    <td>{item.assigned}</td>
                    <td>{item.worked}</td>
                    <td>{item.activities}</td>
                    <td><span className="report-number green-text">{item.qualified}</span></td>
                    <td><span className="report-number red-text">{item.notQualified}</span></td>
                    <td><span className="report-number gray-text">{item.notConnected}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="reports-empty">
                    No Sales Executives found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="reports-section-heading">
        <h2>Date-wise Activity Report</h2>
        <span>Based on executive lead updates</span>
      </div>

      <div className="reports-table-card">
        <div className="reports-table-wrapper">
          <table className="reports-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Activities</th>
                <th>Qualified</th>
                <th>Not Qualified</th>
                <th>Not Connected</th>
              </tr>
            </thead>

            <tbody>
              {dailyReports.length > 0 ? (
                dailyReports.map((item) => (
                  <tr key={item.date}>
                    <td>{item.date}</td>
                    <td>{item.activities}</td>
                    <td>{item.qualified}</td>
                    <td>{item.notQualified}</td>
                    <td>{item.notConnected}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="reports-empty">
                    No activity recorded for the selected period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;


import { useEffect, useState } from "react";
import {
  Users,
  ClipboardList,
  UserCheck,
  CheckCircle,
  XCircle,
  PhoneOff,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import api from "../../services/api";
import "./DashboardOverview.css";

function DashboardOverview() {
  const [summary, setSummary] = useState({});
  const [executives, setExecutives] = useState([]);
  const [activities, setActivities] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard/stats");
      const data = response.data;

      setSummary(data.summary || {});
      setExecutives(data.executivePerformance || []);
      setActivities(data.recentActivities || []);
      setFollowUps(data.upcomingFollowUps || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load dashboard statistics."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusLabel = (status) => {
    const labels = {
      qualified: "Qualified",
      not_qualified: "Not Qualified",
      not_connected: "Not Connected",
      converted: "Converted",
    };

    return labels[status] || status || "-";
  };

  const cards = [
    {
      title: "Total Sales Executives",
      value: summary.totalSalesExecutives,
      icon: Users,
      color: "blue",
    },
    {
      title: "Total Leads",
      value: summary.totalLeads,
      icon: ClipboardList,
      color: "purple",
    },
    {
      title: "Assigned Leads",
      value: summary.assignedLeads,
      icon: UserCheck,
      color: "orange",
    },
    {
      title: "Qualified Leads",
      value: summary.qualifiedLeads,
      icon: CheckCircle,
      color: "green",
    },
    {
      title: "Converted Leads",
      value: summary.convertedLeads,
      icon: UserPlus,
      color: "teal",
    },
    {
      title: "Not Qualified",
      value: summary.notQualifiedLeads,
      icon: XCircle,
      color: "red",
    },
    {
      title: "Not Connected",
      value: summary.notConnectedLeads,
      icon: PhoneOff,
      color: "gray",
    },
    {
      title: "Unassigned Leads",
      value: summary.unassignedLeads,
      icon: ClipboardList,
      color: "yellow",
    },
  ];

  return (
    <div className="dashboard-overview">

      <div className="dashboard-welcome">
        <div>
          <h2>Welcome to your Sales Dashboard!</h2>
          <p>
            Monitor your company's overall sales performance
            and team activities.
          </p>
        </div>

        <button
          className="dashboard-refresh"
          onClick={fetchDashboard}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="dashboard-loading">
          Loading dashboard data...
        </div>
      ) : (
        <>
          {/* Statistics */}
          <div className="dashboard-stats-grid">
            {cards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  className="dashboard-stat-card"
                  key={card.title}
                >
                  <div className={`dashboard-stat-icon ${card.color}`}>
                    <Icon size={23} />
                  </div>

                  <p>{card.title}</p>
                  <h2>
                    {Number(card.value || 0).toLocaleString("en-IN")}
                  </h2>
                </div>
              );
            })}
          </div>

          {/* Executive Performance */}
          <div className="dashboard-section">
            <div className="dashboard-section-heading">
              <div>
                <h3>Sales Executive Performance</h3>
                <p>All-time performance by active executives</p>
              </div>
            </div>

            {executives.length === 0 ? (
              <div className="dashboard-empty">
                No active Sales Executives found.
              </div>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Executive</th>
                      <th>Employee ID</th>
                      <th>Assigned</th>
                      <th>Qualified</th>
                      <th>Converted</th>
                      <th>Not Qualified</th>
                      <th>Not Connected</th>
                    </tr>
                  </thead>

                  <tbody>
                    {executives.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.name}</strong>
                          <small>{item.email}</small>
                        </td>

                        <td>{item.employeeId || "-"}</td>
                        <td>{item.assignedCount || 0}</td>
                        <td>{item.qualifiedCount || 0}</td>
                        <td>
                          <span className="dashboard-converted">
                            {item.convertedCount || 0}
                          </span>
                        </td>
                        <td>{item.notQualifiedCount || 0}</td>
                        <td>{item.notConnectedCount || 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Activities and Follow-ups */}
          <div className="dashboard-bottom-grid">

            <div className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h3>Recent Lead Activities</h3>
                  <p>Latest updates from your sales team</p>
                </div>
              </div>

              {activities.length === 0 ? (
                <div className="dashboard-empty">
                  No lead activities available.
                </div>
              ) : (
                <div className="dashboard-activity-list">
                  {activities.map((activity, index) => (
                    <div
                      className="dashboard-activity-item"
                      key={`${activity.leadId}-${index}`}
                    >
                      <div>
                        <strong>
                          {activity.leadName || "Unnamed Lead"}
                        </strong>
                        <p>
                          {getStatusLabel(activity.status)}
                          {" · "}
                          {activity.employeeName || "Team member"}
                        </p>
                        {activity.remarks && (
                          <small>{activity.remarks}</small>
                        )}
                      </div>

                      <span>
                        {formatDateTime(activity.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dashboard-section">
              <div className="dashboard-section-heading">
                <div>
                  <h3>Upcoming Follow-ups</h3>
                  <p>Next scheduled lead follow-ups</p>
                </div>
              </div>

              {followUps.length === 0 ? (
                <div className="dashboard-empty">
                  No upcoming follow-ups.
                </div>
              ) : (
                <div className="dashboard-followup-list">
                  {followUps.map((lead) => (
                    <div
                      className="dashboard-followup-item"
                      key={lead._id}
                    >
                      <div>
                        <strong>
                          {lead.leadData?.full_name || "Unnamed Lead"}
                        </strong>
                        <p>
                          {lead.assignedTo?.name || "Unassigned"}
                        </p>
                        <small>
                          {getStatusLabel(lead.status)}
                        </small>
                      </div>

                      <span>
                        {formatDate(lead.nextFollowUpDate)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </>
      )}
    </div>
  );
}

export default DashboardOverview;

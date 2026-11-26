
import { useEffect, useState } from "react";
import api from "../../services/api";

import {
  Users,
  ClipboardList,
  CheckCircle,
  Target,
  TrendingUp,
  RefreshCw,
  Save,
} from "lucide-react";

import "./MonthlyPerformance.css";

function MonthlyPerformance() {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const [month, setMonth] = useState(currentMonth);
  const [summary, setSummary] = useState({});
  const [executives, setExecutives] = useState([]);
  const [targetInputs, setTargetInputs] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError("");
      setMessage("");

      const response = await api.get(
        `/sales-targets/monthly-performance?month=${month}`
      );

      const data = response.data;

      setSummary(data.summary || {});
      setExecutives(data.executives || []);

      const inputs = {};

      (data.executives || []).forEach((item) => {
        inputs[item.executive.id] = String(item.targetCount || 0);
      });

      setTargetInputs(inputs);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load monthly performance."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
  }, [month]);

  const handleTargetChange = (employeeId, value) => {
    setTargetInputs((prev) => ({
      ...prev,
      [employeeId]: value,
    }));
  };

  const handleSaveTarget = async (employeeId) => {
    const targetValue = targetInputs[employeeId];

    if (
      targetValue === "" ||
      !Number.isInteger(Number(targetValue)) ||
      Number(targetValue) < 0
    ) {
      setError("Please enter a valid whole-number target.");
      return;
    }

    try {
      setSavingId(employeeId);
      setError("");
      setMessage("");

      await api.put(
        `/sales-targets/monthly-target/${employeeId}`,
        {
          month,
          targetCount: Number(targetValue),
        }
      );

      setMessage("Monthly conversion target saved successfully.");

      await fetchPerformance();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save monthly target."
      );
    } finally {
      setSavingId("");
    }
  };

  const formatPercentage = (value) => {
    return `${Number(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="monthly-performance">

      {/* Heading */}
      <div className="monthly-performance-header">
        <div>
          <h2>Monthly Sales Performance</h2>
          <p>
            Monitor your team's conversions and manage monthly targets.
          </p>
        </div>

        <div className="monthly-filter">
          <label htmlFor="performance-month">Select Month</label>

          <input
            id="performance-month"
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />

          <button
            type="button"
            onClick={fetchPerformance}
            disabled={loading}
            title="Refresh performance"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      </div>

      {error && (
        <div className="monthly-alert error">
          {error}
        </div>
      )}

      {message && (
        <div className="monthly-alert success">
          {message}
        </div>
      )}

      {loading ? (
        <div className="monthly-loading">
          Loading monthly performance...
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="monthly-summary-grid">

            <div className="monthly-summary-card">
              <div className="monthly-card-icon blue">
                <Users size={23} />
              </div>
              <p>Total Sales Executives</p>
              <h2>{summary.totalSalesExecutives || 0}</h2>
            </div>

            <div className="monthly-summary-card">
              <div className="monthly-card-icon purple">
                <ClipboardList size={23} />
              </div>
              <p>Assigned This Month</p>
              <h2>{summary.totalAssignedLeads || 0}</h2>
            </div>

            <div className="monthly-summary-card">
              <div className="monthly-card-icon orange">
                <TrendingUp size={23} />
              </div>
              <p>Qualified Leads</p>
              <h2>{summary.totalQualifiedLeads || 0}</h2>
            </div>

            <div className="monthly-summary-card">
              <div className="monthly-card-icon green">
                <CheckCircle size={23} />
              </div>
              <p>Converted This Month</p>
              <h2>{summary.totalConvertedLeads || 0}</h2>
            </div>

            <div className="monthly-summary-card">
              <div className="monthly-card-icon red">
                <Target size={23} />
              </div>
              <p>Total Monthly Target</p>
              <h2>{summary.totalConversionTarget || 0}</h2>
            </div>

            <div className="monthly-summary-card">
              <div className="monthly-card-icon teal">
                <TrendingUp size={23} />
              </div>
              <p>Overall Achievement</p>
              <h2>
                {formatPercentage(
                  summary.overallAchievementPercentage
                )}
              </h2>
            </div>

          </div>

          {/* Executive Performance */}
          <div className="monthly-table-card">
            <div className="monthly-table-heading">
              <div>
                <h3>Executive-wise Performance</h3>
                <p>
                  Set individual monthly conversion targets and track results.
                </p>
              </div>
            </div>

            {executives.length === 0 ? (
              <div className="monthly-empty">
                No active Sales Executives found.
              </div>
            ) : (
              <div className="monthly-table-wrapper">
                <table className="monthly-table">
                  <thead>
                    <tr>
                      <th>Sales Executive</th>
                      <th>Employee ID</th>
                      <th>Assigned</th>
                      <th>Qualified</th>
                      <th>Converted</th>
                      <th>Monthly Target</th>
                      <th>Achievement</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {executives.map((item) => {
                      const executive = item.executive;
                      const achievement = Number(
                        item.achievementPercentage || 0
                      );

                      return (
                        <tr key={executive.id}>
                          <td>
                            <strong>{executive.name}</strong>
                            <small>{executive.email}</small>
                          </td>

                          <td>{executive.employeeId || "-"}</td>

                          <td>{item.assignedCount}</td>

                          <td>{item.qualifiedCount}</td>

                          <td>
                            <span className="converted-count">
                              {item.convertedCount}
                            </span>
                          </td>

                          <td>
                            <input
                              className="target-input"
                              type="number"
                              min="0"
                              step="1"
                              value={
                                targetInputs[executive.id] ?? "0"
                              }
                              onChange={(e) =>
                                handleTargetChange(
                                  executive.id,
                                  e.target.value
                                )
                              }
                            />
                          </td>

                          <td>
                            <div className="achievement-cell">
                              <strong>
                                {formatPercentage(achievement)}
                              </strong>

                              <div className="achievement-track">
                                <div
                                  className="achievement-fill"
                                  style={{
                                    width: `${Math.min(
                                      achievement,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          <td>
                            <button
                              className="target-save-btn"
                              onClick={() =>
                                handleSaveTarget(executive.id)
                              }
                              disabled={savingId === executive.id}
                            >
                              <Save size={15} />
                              {savingId === executive.id
                                ? "Saving..."
                                : "Save"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MonthlyPerformance;

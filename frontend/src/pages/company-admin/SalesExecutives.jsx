
import { useEffect, useState } from "react";
import { Users, Search, RefreshCw } from "lucide-react";
import api from "../../services/api";

export default function SalesExecutives() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");
      const data = response.data.employees || response.data.users || [];

      setEmployees(
        data.filter((employee) => employee.role === "sales")
      );
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to load employees."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const searchText = search.toLowerCase();

    return (
      employee.name?.toLowerCase().includes(searchText) ||
      employee.employeeId?.toLowerCase().includes(searchText) ||
      employee.email?.toLowerCase().includes(searchText)
    );
  });

  return (
    <div style={{ padding: "30px" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
        marginBottom: "25px"
      }}>
        <div>
          <h2 style={{ margin: "0 0 8px", color: "#20202a" }}>
            Sales Executives
          </h2>
          <p style={{ margin: 0, color: "#777784", fontSize: "13px" }}>
            View and manage your company's sales team.
          </p>
        </div>

        <button
          onClick={fetchEmployees}
          disabled={loading}
          style={{
            padding: "11px 16px",
            border: "1px solid #ddd",
            borderRadius: "7px",
            background: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div style={{
        background: "#fff",
        padding: "20px",
        borderRadius: "10px",
        border: "1px solid #eee"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          maxWidth: "400px",
          border: "1px solid #ddd",
          borderRadius: "7px",
          padding: "0 12px",
          marginBottom: "20px"
        }}>
          <Search size={17} color="#888" />
          <input
            type="text"
            placeholder="Search employee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              padding: "12px 0",
              width: "100%"
            }}
          />
        </div>

        {error && (
          <p style={{ color: "#b42332" }}>{error}</p>
        )}

        {loading ? (
          <p>Loading employees...</p>
        ) : filteredEmployees.length === 0 ? (
          <div style={{ textAlign: "center", padding: "35px" }}>
            <Users size={35} color="#999" />
            <p>No Sales Executives found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left"
            }}>
              <thead>
                <tr style={{ background: "#f8f8fa" }}>
                  <th style={cellStyle}>Employee Name</th>
                  <th style={cellStyle}>Employee ID</th>
                  <th style={cellStyle}>Email</th>
                  <th style={cellStyle}>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee._id}>
                    <td style={cellStyle}>{employee.name}</td>
                    <td style={cellStyle}>{employee.employeeId}</td>
                    <td style={cellStyle}>{employee.email || "—"}</td>
                    <td style={cellStyle}>
                      <span style={{
                        color: employee.status === "active" ? "#16803d" : "#b42332",
                        fontWeight: 600
                      }}>
                        {employee.status}
                      </span>
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

const cellStyle = {
  padding: "14px",
  borderBottom: "1px solid #eee",
  fontSize: "13px",
  color: "#333"
};

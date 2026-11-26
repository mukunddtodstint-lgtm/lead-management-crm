
import { useEffect, useState } from "react";
import api from "../../services/api";
import "./GoogleSheets.css";

import {
  Database,
  ShieldCheck,
  RefreshCw,
  Plus,
  FileSpreadsheet,
  Eye,
  AlertCircle,
  CheckCircle2,
  Download
} from "lucide-react";

function GoogleSheets() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [importLoading, setImportLoading] = useState("");
  const [importResult, setImportResult] = useState(null);

  const [sheets, setSheets] = useState([]);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState("");

  const [spreadsheetUrl, setSpreadsheetUrl] = useState("");
  const [sheetName, setSheetName] = useState("Sheet1");

  // Show Messages
  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);
  };

  // Connect Google Account
  const connectGoogle = async () => {
    try {
      setLoading(true);
      setMessage("");

      const response = await api.get(
        "/google-sheets/oauth/start"
      );

      const authorizationUrl =
        response.data.authorizationUrl;

      if (!authorizationUrl) {
        throw new Error(
          "Google authorization URL not received."
        );
      }

      window.location.href = authorizationUrl;

    } catch (error) {
      showMessage(
        error.response?.data?.message ||
        "Unable to connect Google account.",
        "error"
      );

      setLoading(false);
    }
  };

  // Fetch Saved Google Sheets
  const fetchSheets = async () => {
    try {
      setFetching(true);

      const response = await api.get(
        "/google-sheets/sheets"
      );

      setSheets(response.data.sheets || []);

    } catch (error) {
      console.error("Fetch sheets error:", error);

      showMessage(
        error.response?.data?.message ||
        "Unable to fetch Google Sheets.",
        "error"
      );

    } finally {
      setFetching(false);
    }
  };

  // Add Google Sheet
  const addSheet = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");
      setPreviewData(null);
      setImportResult(null);

      const response = await api.post(
        "/google-sheets/sheets",
        {
          spreadsheetUrl: spreadsheetUrl.trim(),
          sheetName: sheetName.trim()
        }
      );

      showMessage(
        response.data.message ||
        "Google Sheet added successfully.",
        "success"
      );

      setSpreadsheetUrl("");
      setSheetName("Sheet1");

      await fetchSheets();

    } catch (error) {
      showMessage(
        error.response?.data?.message ||
        "Unable to add Google Sheet.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  // Preview Google Sheet
  const previewSheet = async (id) => {
    try {
      setPreviewLoading(id);
      setMessage("");
      setPreviewData(null);

      const response = await api.get(
        `/google-sheets/sheets/${id}/preview`
      );

      setPreviewData({
        sheetId: id,
        ...response.data
      });

    } catch (error) {
      showMessage(
        error.response?.data?.message ||
        "Unable to preview Google Sheet.",
        "error"
      );

    } finally {
      setPreviewLoading("");
    }
  };

  // Import Leads from Google Sheet
  const importLeads = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to import leads from this Google Sheet? Duplicate leads will be skipped."
    );

    if (!confirmed) return;

    try {
      setImportLoading(id);
      setImportResult(null);
      setMessage("");

      const response = await api.post(
        `/google-sheets/sheets/${id}/import`
      );

      setImportResult({
        sheetId: id,
        ...response.data
      });

      showMessage(
        response.data.message ||
        "Lead import completed successfully.",
        "success"
      );

    } catch (error) {
      console.error("IMPORT LEADS ERROR:", error);

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to import leads.";

      showMessage(errorMessage, "error");

    } finally {
      setImportLoading("");
    }
  };

  // Load Sheets When Page Opens
  useEffect(() => {
    fetchSheets();
  }, []);

  return (
    <div className="google-sheets-page">

      {/* Page Header */}
      <div className="google-sheets-header">
        <h2>Google Sheets Integration</h2>

        <p>
          Connect your Google account and manage your
          company's lead sources from one place.
        </p>
      </div>

      {/* Global Message */}
      {message && (
        <div
          className={`google-sheets-message ${
            messageType === "error"
              ? "error"
              : "success"
          }`}
        >
          {messageType === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}

          <span>{message}</span>
        </div>
      )}

      {/* Google Account Connection */}
      <div className="google-sheets-card">

        <div className="google-sheets-card-top">

          <div className="google-sheets-icon">
            <Database size={30} />
          </div>

          <div>
            <h3>Connect Google Account</h3>
            <p>Google Sheets Lead Integration</p>
          </div>

        </div>

        <p className="google-sheets-description">
          Connect the Google account that has access
          to your company's lead spreadsheets.
        </p>

        <div className="google-sheets-info">
          <ShieldCheck size={22} />

          <p>
            CRM uses read-only access. Your existing
            Meta Ads and Google Sheets integration
            will remain untouched.
          </p>
        </div>

        <button
          onClick={connectGoogle}
          disabled={loading}
          className="google-sheets-connect-btn"
        >
          <Database size={18} />

          {loading
            ? "Connecting..."
            : "Connect Google Account"}
        </button>

      </div>

      {/* Add Google Spreadsheet */}
      <div className="google-sheets-card">

        <div className="google-sheets-card-top">

          <div className="google-sheets-icon">
            <Plus size={30} />
          </div>

          <div>
            <h3>Add Google Spreadsheet</h3>
            <p>Add multiple lead sources</p>
          </div>

        </div>

        <form onSubmit={addSheet}>

          <label htmlFor="spreadsheetUrl">
            Google Sheet URL
          </label>

          <input
            id="spreadsheetUrl"
            type="url"
            placeholder="Paste your Google Sheet URL"
            value={spreadsheetUrl}
            onChange={(e) =>
              setSpreadsheetUrl(e.target.value)
            }
            required
          />

          <label htmlFor="sheetName">
            Sheet Tab Name
          </label>

          <input
            id="sheetName"
            type="text"
            placeholder="Example: Sheet1"
            value={sheetName}
            onChange={(e) =>
              setSheetName(e.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="google-sheets-connect-btn"
          >
            <Plus size={18} />

            {loading
              ? "Adding Spreadsheet..."
              : "Add Google Sheet"}
          </button>

        </form>

      </div>

      {/* Connected Spreadsheets */}
      <div className="google-sheets-card">

        <div className="google-sheets-card-top">

          <div className="google-sheets-icon">
            <FileSpreadsheet size={30} />
          </div>

          <div>
            <h3>Connected Spreadsheets</h3>
            <p>Your company's saved lead sources</p>
          </div>

        </div>

        <button
          onClick={fetchSheets}
          disabled={fetching}
          className="google-sheets-refresh-btn"
        >
          <RefreshCw
            size={17}
            className={fetching ? "spinning" : ""}
          />

          {fetching
            ? "Refreshing..."
            : "Refresh List"}
        </button>

        {sheets.length === 0 ? (

          <div className="google-sheets-empty">
            <FileSpreadsheet size={35} />

            <p>No Google Sheets added yet.</p>

            <small>
              Add your first spreadsheet to get started.
            </small>
          </div>

        ) : (

          <div className="google-sheets-list">

            {sheets.map((sheet) => (

              <div
                key={sheet._id}
                className="google-sheet-item"
              >

                <div className="google-sheet-details">

                  <div className="google-sheet-file-icon">
                    <FileSpreadsheet size={22} />
                  </div>

                  <div className="google-sheet-file-info">

                    <h4>{sheet.sheetName}</h4>

                    <p>{sheet.spreadsheetUrl}</p>

                    <small>
                      Status: {sheet.status}
                    </small>

                  </div>

                </div>

                <div className="google-sheet-actions">

                  {/* Preview Button */}
                  <button
                    onClick={() =>
                      previewSheet(sheet._id)
                    }
                    disabled={
                      previewLoading === sheet._id ||
                      importLoading === sheet._id
                    }
                    className="google-sheets-preview-btn"
                  >
                    <Eye size={17} />

                    {previewLoading === sheet._id
                      ? "Loading..."
                      : "Preview Data"}
                  </button>

                  {/* Import Button */}
                  <button
                    onClick={() =>
                      importLeads(sheet._id)
                    }
                    disabled={
                      importLoading === sheet._id ||
                      previewLoading === sheet._id
                    }
                    className="google-sheets-import-btn"
                  >
                    <Download size={17} />

                    {importLoading === sheet._id
                      ? "Importing..."
                      : "Import Leads"}
                  </button>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

      {/* Import Report */}
      {importResult && (

        <div className="google-sheets-card">

          <div className="google-sheets-card-top">

            <div className="google-sheets-icon">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h3>Lead Import Report</h3>
              <p>
                Results from your Google Sheet import
              </p>
            </div>

          </div>

          <div className="google-sheets-preview-summary">

            <div>
              <span>Imported</span>
              <strong>{importResult.imported}</strong>
            </div>

            <div>
              <span>Duplicates</span>
              <strong>{importResult.duplicates}</strong>
            </div>

            <div>
              <span>Skipped</span>
              <strong>{importResult.skipped}</strong>
            </div>

          </div>

          <p>
            Total Rows: {importResult.totalRows}
          </p>

        </div>

      )}

      {/* Spreadsheet Preview */}
      {previewData && (

        <div className="google-sheets-card">

          <div className="google-sheets-card-top">

            <div className="google-sheets-icon">
              <Eye size={28} />
            </div>

            <div>
              <h3>Spreadsheet Data Preview</h3>

              <p>
                Actual data fetched from Google Sheets
              </p>
            </div>

          </div>

          <div className="google-sheets-preview-summary">

            <div>
              <span>Total Leads</span>
              <strong>{previewData.totalRows}</strong>
            </div>

            <div>
              <span>Total Columns</span>
              <strong>{previewData.headers.length}</strong>
            </div>

            <div>
              <span>Preview Rows</span>
              <strong>{previewData.sampleRows.length}</strong>
            </div>

          </div>

          {previewData.headers.length > 0 ? (

            <div className="google-sheet-table-wrapper">

              <table className="google-sheet-table">

                <thead>
                  <tr>
                    {previewData.headers.map(
                      (header, index) => (
                        <th key={index}>
                          {header || `Column ${index + 1}`}
                        </th>
                      )
                    )}
                  </tr>
                </thead>

                <tbody>

                  {previewData.sampleRows.map(
                    (row, rowIndex) => (

                      <tr key={rowIndex}>

                        {previewData.headers.map(
                          (_, colIndex) => (

                            <td key={colIndex}>
                              {row[colIndex] ?? "-"}
                            </td>

                          )
                        )}

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          ) : (

            <div className="google-sheets-empty">
              <p>No data available in this spreadsheet.</p>
            </div>

          )}

        </div>

      )}

    </div>
  );
}

export default GoogleSheets;

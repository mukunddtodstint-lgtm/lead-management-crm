
import { useEffect, useState } from "react";
import { Save, Settings as SettingsIcon } from "lucide-react";
import api from "../../services/api";

const leadFields = [
  { key: "created_time", label: "Created Time" },
  {
    key: "what_are_you_looking_for?",
    label: "What Are You Looking For?",
  },
  {
    key: "what_is_your_preferred_investment_budget?",
    label: "Preferred Investment Budget",
  },
  { key: "full_name", label: "Full Name" },
  { key: "phone_number", label: "Phone Number" },
  { key: "email", label: "Email" },
  { key: "city", label: "City" },
];

export default function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get("/companies/lead-field-settings");
      setSettings(response.data.settings || {});
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to load settings."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage("");

      const response = await api.put(
        "/companies/lead-field-settings",
        { settings }
      );

      setSettings(response.data.settings || settings);
      setMessage("Settings saved successfully!");
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to save settings."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <div className="settings-page">
      <div className="settings-header">
        <SettingsIcon size={24} />
        <div>
          <h2>Lead Field Settings</h2>
          <p>Choose which lead details your Sales Executives can see.</p>
        </div>
      </div>

      <div className="settings-card">
        <h3>Configurable Lead Fields</h3>

        {leadFields.map((field) => (
          <label className="setting-field" key={field.key}>
            <span>{field.label}</span>
            <input
              type="checkbox"
              checked={settings[field.key] ?? true}
              onChange={() => handleToggle(field.key)}
            />
          </label>
        ))}

        <button
          className="settings-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Settings"}
        </button>

        {message && <p className="settings-message">{message}</p>}
      </div>
    </div>
  );
}

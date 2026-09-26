"use client";

import { useEffect, useState } from "react";

const styles = `
  .settings-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-width: 800px;
  }

  .header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .title-group h1 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .title-group p {
    font-size: 13px;
    color: #475569;
    margin-top: 4px;
  }

  .settings-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 24px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .settings-section-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 8px;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .setting-label {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .setting-help {
    font-size: 12px;
    color: #64748b;
  }

  .form-select,
  .form-input {
    max-width: 320px;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #ffffff;
    color: #0f172a;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .form-select:focus,
  .form-input:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
    cursor: pointer;
  }

  .checkbox-input {
    width: 16px;
    height: 16px;
    accent-color: #0284c7;
    cursor: pointer;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #334155;
    transition: background-color 0.15s ease;
  }

  .btn:hover {
    background-color: #f8fafc;
  }

  .btn-primary {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
  }

  .btn-primary:hover {
    background-color: #0369a1;
  }

  .toast {
    background-color: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 10px 16px;
    font-size: 13px;
    color: #15803d;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .security-notice {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 14px 18px;
    font-size: 12px;
    color: #475569;
    line-height: 1.5;
  }
`;

export default function SettingsPage() {
  const [pollInterval, setPollInterval] = useState(10);
  const [defaultPageSize, setDefaultPageSize] = useState(20);
  const [timeZoneDisplay, setTimeZoneDisplay] = useState("local");
  const [enableSound, setEnableSound] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load local display preferences
    try {
      const stored = localStorage.getItem("netraverse_settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.pollInterval) setPollInterval(parsed.pollInterval);
        if (parsed.defaultPageSize) setDefaultPageSize(parsed.defaultPageSize);
        if (parsed.timeZoneDisplay) setTimeZoneDisplay(parsed.timeZoneDisplay);
        if (parsed.enableSound !== undefined) setEnableSound(parsed.enableSound);
      }
    } catch {
      // LocalStorage unavailable
    }
  }, []);

  function handleSave(e) {
    e.preventDefault();
    try {
      const payload = {
        pollInterval,
        defaultPageSize,
        timeZoneDisplay,
        enableSound,
      };
      localStorage.setItem("netraverse_settings", JSON.stringify(payload));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert("Failed to save preferences.");
    }
  }

  return (
    <div className="settings-container">
      <style>{styles}</style>

      <section className="header-row">
        <div className="title-group">
          <h1>Dashboard Display Settings</h1>
          <p>Configure local telemetry refresh cadence and visual table preferences.</p>
        </div>
      </section>

      {saved && (
        <div className="toast" role="status">
          <span>Display preferences updated successfully for this workstation.</span>
          <button type="button" className="btn" style={{ padding: "2px 8px", fontSize: "11px" }} onClick={() => setSaved(false)}>
            Dismiss
          </button>
        </div>
      )}

      <form className="settings-card" onSubmit={handleSave}>
        <h2 className="settings-section-title">Telemetry & Polling Cadence</h2>

        <div className="setting-item">
          <label className="setting-label" htmlFor="poll-interval">
            Operational Telemetry Refresh
          </label>
          <p className="setting-help">
            Frequency at which the dashboard checks /api/health and /api/metrics for active capture updates.
          </p>
          <select
            id="poll-interval"
            className="form-select"
            value={pollInterval}
            onChange={(e) => setPollInterval(Number(e.target.value))}
          >
            <option value={5}>Every 5 seconds (High Frequency)</option>
            <option value={10}>Every 10 seconds (Standard)</option>
            <option value={15}>Every 15 seconds</option>
            <option value={30}>Every 30 seconds</option>
            <option value={60}>Every 60 seconds (Low Overhead)</option>
          </select>
        </div>

        <h2 className="settings-section-title">Table & Timestamp Formatting</h2>

        <div className="setting-item">
          <label className="setting-label" htmlFor="page-size">
            Alert Table Page Size
          </label>
          <p className="setting-help">Default number of detection rows displayed per pagination page.</p>
          <select
            id="page-size"
            className="form-select"
            value={defaultPageSize}
            onChange={(e) => setDefaultPageSize(Number(e.target.value))}
          >
            <option value={10}>10 alerts per page</option>
            <option value={20}>20 alerts per page</option>
            <option value={50}>50 alerts per page</option>
            <option value={100}>100 alerts per page (Maximum)</option>
          </select>
        </div>

        <div className="setting-item">
          <label className="setting-label" htmlFor="timezone-pref">
            Timestamp Format
          </label>
          <p className="setting-help">Render timestamps using your local workstation time or UTC.</p>
          <select
            id="timezone-pref"
            className="form-select"
            value={timeZoneDisplay}
            onChange={(e) => setTimeZoneDisplay(e.target.value)}
          >
            <option value="local">Local Browser Time</option>
            <option value="utc">Universal Coordinated Time (UTC / Zulu)</option>
          </select>
        </div>

        <h2 className="settings-section-title">Operator Alerts</h2>

        <div className="setting-item">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="checkbox-input"
              checked={enableSound}
              onChange={(e) => setEnableSound(e.target.checked)}
            />
            Play subtle audio alert on new CRITICAL threat detection
          </label>
          <p className="setting-help" style={{ marginLeft: "26px" }}>
            Triggers an audio beep when an unacknowledged critical alert enters the operational view.
          </p>
        </div>

        <div>
          <button type="submit" className="btn btn-primary">
            Save Display Settings
          </button>
        </div>
      </form>

      <div className="security-notice">
        <strong>Hardware Diode Security Boundary: </strong>
        In accordance with SIH PS 26145 requirements, all packet capture controls, interface bindings, and ML model weights are managed exclusively by the isolated C++ monitoring service. No mitigation, packet injection, or capture reconfiguration commands can be issued from this web interface.
      </div>
    </div>
  );
}
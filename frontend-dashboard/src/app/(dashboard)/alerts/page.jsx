"use client";

import { useEffect, useState, useCallback } from "react";

const styles = `
  .alerts-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
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

  /* Filters card */
  .filter-panel {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: 2fr 1.2fr 1fr 1fr auto;
    gap: 12px;
    align-items: end;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  @media (max-width: 960px) {
    .filter-panel {
      grid-template-columns: 1fr 1fr;
    }
  }

  @media (max-width: 600px) {
    .filter-panel {
      grid-template-columns: 1fr;
    }
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .form-group label {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
  }

  .form-input,
  .form-select {
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background-color: #ffffff;
    color: #0f172a;
    font-size: 13px;
    outline: none;
    transition: border-color 0.15s ease;
  }

  .form-input:focus,
  .form-select:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    border: 1px solid #cbd5e1;
    background-color: #ffffff;
    color: #334155;
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .btn:hover {
    background-color: #f8fafc;
    border-color: #94a3b8;
  }

  .btn:focus-visible {
    outline: 2px solid #0284c7;
    outline-offset: 2px;
  }

  .btn-sm {
    padding: 4px 8px;
    font-size: 12px;
  }

  .btn-primary {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
  }

  .btn-primary:hover {
    background-color: #0369a1;
    border-color: #0369a1;
  }

  .table-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }

  .table-responsive {
    width: 100%;
    overflow-x: auto;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
    text-align: left;
  }

  .data-table th {
    background-color: #f8fafc;
    color: #475569;
    font-weight: 600;
    padding: 10px 16px;
    border-bottom: 1px solid #e2e8f0;
    white-space: nowrap;
  }

  .data-table td {
    padding: 12px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  .data-table tr.selected td {
    background-color: #f0f9ff;
  }

  .data-table tr:hover td {
    background-color: #f8fafc;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .badge-critical {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .badge-high {
    background-color: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
  }

  .badge-medium {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
  }

  .badge-low {
    background-color: #eff6ff;
    color: #1d4ed8;
    border: 1px solid #bfdbfe;
  }

  .badge-active {
    background-color: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .badge-offline {
    background-color: #f8fafc;
    color: #64748b;
    border: 1px solid #cbd5e1;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .pagination-bar {
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #f8fafc;
    border-top: 1px solid #e2e8f0;
    font-size: 13px;
    color: #64748b;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .state-box {
    padding: 60px 20px;
    text-align: center;
    color: #64748b;
  }

  .state-title {
    font-size: 15px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 6px;
  }

  /* Detail drawer / modal */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(15, 23, 42, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    padding: 20px;
  }

  .modal-card {
    background-color: #ffffff;
    border-radius: 8px;
    border: 1px solid #cbd5e1;
    width: 100%;
    max-width: 760px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
  }

  .modal-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }

  .modal-body {
    padding: 20px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .detail-item {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 10px 14px;
  }

  .detail-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    font-size: 13px;
    color: #0f172a;
    margin-top: 4px;
    font-weight: 500;
  }

  .evidence-box {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 14px;
  }

  .evidence-header {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .evidence-code {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 10px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
    color: #1e293b;
    max-height: 240px;
    overflow: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }

  .modal-footer {
    padding: 14px 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background-color: #f8fafc;
  }

  .alert-banner {
    background-color: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    color: #b91c1c;
  }
`;

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [threatClass, setThreatClass] = useState("ALL");
  const [severity, setSeverity] = useState("ALL");
  const [acknowledged, setAcknowledged] = useState("ALL");
  const [search, setSearch] = useState("");

  // Active modal/drawer
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [ackLoading, setAckLoading] = useState(false);

  const fetchAlerts = useCallback(
    async (targetPage = page) => {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("page", String(targetPage));
        params.set("limit", "20");

        if (threatClass !== "ALL") params.set("threat_class", threatClass);
        if (severity !== "ALL") params.set("severity", severity);
        if (acknowledged !== "ALL") params.set("acknowledged", acknowledged);
        if (search.trim()) params.set("search", search.trim());

        const res = await fetch(`/api/alerts?${params.toString()}`, { cache: "no-store" });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData?.error?.message || "Failed to load alerts.");
        }

        const data = await res.json();
        setAlerts(data.alerts || []);
        setTotal(data.total || 0);
        setPage(data.page || 1);
        setTotalPages(data.total_pages || 1);
      } catch (err) {
        setError(err.message || "An unexpected error occurred.");
      } finally {
        setLoading(false);
      }
    },
    [page, threatClass, severity, acknowledged, search]
  );

  useEffect(() => {
    fetchAlerts(1);
  }, [threatClass, severity, acknowledged]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    fetchAlerts(1);
  }

  async function handleToggleAcknowledgement(alertId, currentAck) {
    try {
      setAckLoading(true);
      const newAck = currentAck === 1 ? 0 : 1;
      const res = await fetch(`/api/alerts/${encodeURIComponent(alertId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acknowledged: newAck }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error?.message || "Failed to update alert state.");
      }

      const { alert: updatedAlert } = await res.json();

      // Update local state
      setAlerts((prev) =>
        prev.map((item) => (item.id === alertId ? updatedAlert : item))
      );
      if (selectedAlert && selectedAlert.id === alertId) {
        setSelectedAlert(updatedAlert);
      }
    } catch (err) {
      alert(err.message || "Could not update acknowledgement.");
    } finally {
      setAckLoading(false);
    }
  }

  return (
    <div className="alerts-container">
      <style>{styles}</style>

      <section className="header-row">
        <div className="title-group">
          <h1>Threat Detections</h1>
          <p>
            Filter, inspect, and acknowledge security alerts generated by specialist ML detectors.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn"
            onClick={() => fetchAlerts(page)}
            disabled={loading}
            aria-label="Refresh current alert page"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {/* Filter Panel */}
      <form className="filter-panel" onSubmit={handleSearchSubmit}>
        <div className="form-group">
          <label htmlFor="search-input">Search Entities</label>
          <input
            id="search-input"
            type="text"
            className="form-input"
            placeholder="Alert ID, Flow ID, Source IP, Dest IP…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="class-select">Threat Class</label>
          <select
            id="class-select"
            className="form-select"
            value={threatClass}
            onChange={(e) => setThreatClass(e.target.value)}
          >
            <option value="ALL">All Threat Classes</option>
            <option value="VOLUMETRIC_PROTOCOL_DDOS">Volumetric / Protocol DDoS</option>
            <option value="BOTNET_C2_BEACONING">Botnet C2 Beaconing</option>
            <option value="DGA_DNS_TUNNELLING">DGA / DNS Tunnelling</option>
            <option value="ENCRYPTED_SESSION_MALWARE_INDICATOR">Encrypted Session Malware Indicator</option>
            <option value="RECONNAISSANCE_PORT_SCAN">Reconnaissance / Port Scan</option>
            <option value="DATA_EXFILTRATION">Data Exfiltration</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="sev-select">Severity</label>
          <select
            id="sev-select"
            className="form-select"
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="ack-select">Status</label>
          <select
            id="ack-select"
            className="form-select"
            value={acknowledged}
            onChange={(e) => setAcknowledged(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="0">Unreviewed</option>
            <option value="1">Acknowledged</option>
          </select>
        </div>

        <button type="submit" className="btn btn-primary" style={{ height: "37px" }}>
          Filter
        </button>
      </form>

      {error && <div className="alert-banner" role="alert">{error}</div>}

      {/* Alerts Table */}
      <section className="table-card">
        {loading && alerts.length === 0 ? (
          <div className="state-box">
            <p className="state-title">Loading detections…</p>
            <p style={{ fontSize: "13px" }}>Querying SQLite store.</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="state-box">
            <p className="state-title">No matching alerts found</p>
            <p style={{ fontSize: "13px" }}>
              Try adjusting your search criteria or class filters.
            </p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Threat Class</th>
                    <th>Severity</th>
                    <th>Confidence</th>
                    <th>Source → Destination</th>
                    <th>Protocol</th>
                    <th>Review</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((alert) => {
                    let sevClass = "badge-low";
                    if (alert.severity === "CRITICAL") sevClass = "badge-critical";
                    else if (alert.severity === "HIGH") sevClass = "badge-high";
                    else if (alert.severity === "MEDIUM") sevClass = "badge-medium";

                    return (
                      <tr key={alert.id}>
                        <td className="mono" style={{ whiteSpace: "nowrap" }}>
                          {alert.timestamp ? new Date(alert.timestamp).toLocaleString() : "—"}
                        </td>
                        <td>
                          <strong style={{ fontSize: "12px", color: "#0f172a" }}>
                            {alert.threat_class}
                          </strong>
                        </td>
                        <td>
                          <span className={`badge ${sevClass}`}>{alert.severity}</span>
                        </td>
                        <td>{Math.round(alert.confidence * 100)}%</td>
                        <td className="mono" style={{ fontSize: "12px" }}>
                          {alert.source_ip || "—"}:{alert.source_port || "—"} →{" "}
                          {alert.destination_ip || "—"}:{alert.destination_port || "—"}
                        </td>
                        <td>
                          <span className="badge badge-offline">{alert.protocol || "IP"}</span>
                        </td>
                        <td>
                          {alert.acknowledged === 1 ? (
                            <span className="badge badge-active">Acknowledged</span>
                          ) : (
                            <span className="badge badge-offline">Unreviewed</span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button
                              type="button"
                              className="btn btn-sm"
                              onClick={() => setSelectedAlert(alert)}
                            >
                              Details
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${alert.acknowledged === 1 ? "" : "btn-primary"}`}
                              onClick={() => handleToggleAcknowledgement(alert.id, alert.acknowledged)}
                            >
                              {alert.acknowledged === 1 ? "Unack" : "Acknowledge"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pagination-bar">
              <span>
                Showing <strong>{alerts.length}</strong> of <strong>{total}</strong> alerts
              </span>
              <div className="pagination-controls">
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page <= 1 || loading}
                  onClick={() => fetchAlerts(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {totalPages}
                </span>
                <button
                  type="button"
                  className="btn btn-sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => fetchAlerts(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Details Modal */}
      {selectedAlert && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setSelectedAlert(null)}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title" id="modal-title">
                Alert Details: {selectedAlert.id}
              </h2>
              <button
                type="button"
                className="btn btn-sm"
                onClick={() => setSelectedAlert(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Threat Classification</div>
                  <div className="detail-value">{selectedAlert.threat_class}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Severity & Confidence</div>
                  <div className="detail-value">
                    {selectedAlert.severity} ({Math.round(selectedAlert.confidence * 100)}%)
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Observed Timestamp</div>
                  <div className="detail-value mono">
                    {selectedAlert.timestamp ? new Date(selectedAlert.timestamp).toISOString() : "—"}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Model Engine Version</div>
                  <div className="detail-value">{selectedAlert.model_version || "Not reported"}</div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Source Endpoint</div>
                  <div className="detail-value mono">
                    {selectedAlert.source_ip || "—"}:{selectedAlert.source_port || "—"}
                  </div>
                </div>

                <div className="detail-item">
                  <div className="detail-label">Destination Endpoint</div>
                  <div className="detail-value mono">
                    {selectedAlert.destination_ip || "—"}:{selectedAlert.destination_port || "—"}
                  </div>
                </div>

                <div className="detail-item" style={{ gridColumn: "span 2" }}>
                  <div className="detail-label">Flow Tracking Identifier</div>
                  <div className="detail-value mono">{selectedAlert.flow_id}</div>
                </div>
              </div>

              <div className="evidence-box">
                <div className="evidence-header">
                  <span>Observed Traffic Evidence (Passive Feature Metadata Only)</span>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Read-Only Non-Intrusive Capture</span>
                </div>
                <pre className="evidence-code">
                  {JSON.stringify(selectedAlert.evidence, null, 2)}
                </pre>
              </div>
            </div>

            <div className="modal-footer">
              <div>
                Status:{" "}
                {selectedAlert.acknowledged === 1 ? (
                  <span className="badge badge-active">Acknowledged</span>
                ) : (
                  <span className="badge badge-offline">Unreviewed</span>
                )}
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className={`btn ${selectedAlert.acknowledged === 1 ? "" : "btn-primary"}`}
                  disabled={ackLoading}
                  onClick={() =>
                    handleToggleAcknowledgement(selectedAlert.id, selectedAlert.acknowledged)
                  }
                >
                  {ackLoading
                    ? "Updating…"
                    : selectedAlert.acknowledged === 1
                    ? "Mark as Unreviewed"
                    : "Acknowledge Alert"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
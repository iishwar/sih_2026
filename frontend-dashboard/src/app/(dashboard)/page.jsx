"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";

const styles = `
  .page-container {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  .page-title {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.3px;
  }

  .page-subtitle {
    font-size: 13px;
    color: #475569;
    margin-top: 4px;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
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

  .btn-primary {
    background-color: #0284c7;
    color: #ffffff;
    border-color: #0284c7;
  }

  .btn-primary:hover {
    background-color: #0369a1;
    border-color: #0369a1;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 18px 20px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .card-label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .card-value {
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 10px;
    letter-spacing: -0.5px;
  }

  .card-meta {
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .two-col-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 900px) {
    .two-col-grid {
      grid-template-columns: 1fr;
    }
  }

  .section-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }

  .section-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .section-card-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
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

  .data-table tr:last-child td {
    border-bottom: none;
  }

  .data-table tr:hover td {
    background-color: #f8fafc;
  }

  /* Severity badges */
  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    letter-spacing: 0.3px;
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

  /* Status indicator pills */
  .badge-active {
    background-color: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .badge-stale {
    background-color: #fffbeb;
    color: #b45309;
    border: 1px solid #fde68a;
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

  .severity-bar-list {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .severity-bar-item {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
  }

  .severity-bar-label {
    width: 90px;
    font-weight: 500;
    color: #334155;
  }

  .severity-bar-track {
    flex: 1;
    height: 8px;
    background-color: #f1f5f9;
    border-radius: 4px;
    overflow: hidden;
  }

  .severity-bar-fill {
    height: 100%;
    border-radius: 4px;
  }

  .fill-critical { background-color: #dc2626; }
  .fill-high { background-color: #ea580c; }
  .fill-medium { background-color: #d97706; }
  .fill-low { background-color: #2563eb; }

  .severity-bar-count {
    width: 40px;
    text-align: right;
    font-weight: 600;
    color: #0f172a;
  }

  .threat-list {
    padding: 12px 20px;
    display: flex;
    flex-direction: column;
    divide-y: 1px solid #f1f5f9;
  }

  .threat-row {
    padding: 10px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #f1f5f9;
  }

  .threat-row:last-child {
    border-bottom: none;
  }

  .threat-name {
    font-size: 13px;
    font-weight: 500;
    color: #1e293b;
  }

  .threat-count-badge {
    font-size: 12px;
    font-weight: 600;
    color: #334155;
    background-color: #f1f5f9;
    padding: 2px 8px;
    border-radius: 4px;
  }

  .state-box {
    padding: 40px 20px;
    text-align: center;
    color: #64748b;
  }

  .state-title {
    font-size: 14px;
    font-weight: 600;
    color: #334155;
    margin-bottom: 4px;
  }

  .alert-banner {
    background-color: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    color: #9a3412;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
`;

export default function OverviewPage() {
  const [summary, setSummary] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [sumRes, alertRes] = await Promise.all([
        fetch("/api/summary?hours=24", { cache: "no-store" }),
        fetch("/api/alerts?limit=5", { cache: "no-store" }),
      ]);

      if (!sumRes.ok || !alertRes.ok) {
        throw new Error("Unable to load operational monitoring metrics.");
      }

      const sumData = await sumRes.json();
      const alertData = await alertRes.json();

      setSummary(sumData);
      setRecentAlerts(alertData.alerts ?? []);
      setLastRefreshed(new Date());
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const latestMetric = summary?.latest_metric;
  const freshness = summary?.metric_freshness;
  const isStale = freshness?.is_stale ?? true;

  // Compute status pill
  let serviceStatusText = "No Recent Data";
  let serviceBadgeClass = "badge-offline";
  if (latestMetric) {
    if (!isStale) {
      serviceStatusText = "Active Ingestion";
      serviceBadgeClass = "badge-active";
    } else {
      serviceStatusText = "Stale (No recent packets)";
      serviceBadgeClass = "badge-stale";
    }
  }

  const sevCounts = summary?.severity_counts || { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const totalAlerts = summary?.total_alerts || 0;
  const maxSev = Math.max(sevCounts.CRITICAL, sevCounts.HIGH, sevCounts.MEDIUM, sevCounts.LOW, 1);

  return (
    <div className="page-container">
      <style>{styles}</style>

      <section className="page-header">
        <div>
          <h1 className="page-title">Operational Overview</h1>
          <p className="page-subtitle">
            Passive unidirectional network telemetry and multi-model threat detection (PS 26145).
          </p>
        </div>
        <div className="header-actions">
          {lastRefreshed && (
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              Updated {lastRefreshed.toLocaleTimeString()}
            </span>
          )}
          <button
            type="button"
            className="btn"
            onClick={loadData}
            disabled={loading}
            aria-label="Refresh operational overview data"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {error && (
        <div className="alert-banner" role="alert">
          <span>{error}</span>
          <button type="button" className="btn" onClick={loadData}>
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <section className="kpi-grid" aria-label="System status indicators">
        <article className="card">
          <div className="card-label">
            <span>Ingest Health</span>
            <span className={`badge ${serviceBadgeClass}`}>{serviceStatusText}</span>
          </div>
          <div className="card-value">
            {latestMetric ? `${latestMetric.packets_per_second.toLocaleString()} pps` : "—"}
          </div>
          <div className="card-meta">
            {freshness?.age_seconds !== null && freshness?.age_seconds !== undefined
              ? `Last heartbeat ${freshness.age_seconds}s ago`
              : "No metrics logged by C++ engine"}
          </div>
        </article>

        <article className="card">
          <div className="card-label">
            <span>Detections (24h)</span>
          </div>
          <div className="card-value">{totalAlerts.toLocaleString()}</div>
          <div className="card-meta">
            {sevCounts.CRITICAL + sevCounts.HIGH > 0 ? (
              <span style={{ color: "#b91c1c", fontWeight: 600 }}>
                {sevCounts.CRITICAL} Critical, {sevCounts.HIGH} High
              </span>
            ) : (
              "No high/critical threats flagged"
            )}
          </div>
        </article>

        <article className="card">
          <div className="card-label">
            <span>Active IP Flows</span>
          </div>
          <div className="card-value">
            {latestMetric ? latestMetric.active_flows.toLocaleString() : "—"}
          </div>
          <div className="card-meta">
            {latestMetric ? `${latestMetric.flows_per_second.toFixed(1)} flows/sec tracking` : "Flow tracker inactive"}
          </div>
        </article>

        <article className="card">
          <div className="card-label">
            <span>Capture Drop Rate</span>
          </div>
          <div className="card-value">
            {latestMetric ? `${(latestMetric.capture_drop_rate * 100).toFixed(2)}%` : "—"}
          </div>
          <div className="card-meta">
            {latestMetric ? `${latestMetric.capture_drops.toLocaleString()} buffer drops` : "Zero loss tap metric"}
          </div>
        </article>
      </section>

      {/* Mid Section: Severity Breakdown & Threat Classes */}
      <div className="two-col-grid">
        <section className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Threat Severity Distribution (24h)</h2>
            <span style={{ fontSize: "12px", color: "#64748b" }}>{totalAlerts} Total</span>
          </div>
          <div className="severity-bar-list">
            <div className="severity-bar-item">
              <span className="severity-bar-label">Critical</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill fill-critical"
                  style={{ width: `${(sevCounts.CRITICAL / maxSev) * 100}%` }}
                />
              </div>
              <span className="severity-bar-count">{sevCounts.CRITICAL}</span>
            </div>

            <div className="severity-bar-item">
              <span className="severity-bar-label">High</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill fill-high"
                  style={{ width: `${(sevCounts.HIGH / maxSev) * 100}%` }}
                />
              </div>
              <span className="severity-bar-count">{sevCounts.HIGH}</span>
            </div>

            <div className="severity-bar-item">
              <span className="severity-bar-label">Medium</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill fill-medium"
                  style={{ width: `${(sevCounts.MEDIUM / maxSev) * 100}%` }}
                />
              </div>
              <span className="severity-bar-count">{sevCounts.MEDIUM}</span>
            </div>

            <div className="severity-bar-item">
              <span className="severity-bar-label">Low</span>
              <div className="severity-bar-track">
                <div
                  className="severity-bar-fill fill-low"
                  style={{ width: `${(sevCounts.LOW / maxSev) * 100}%` }}
                />
              </div>
              <span className="severity-bar-count">{sevCounts.LOW}</span>
            </div>
          </div>
        </section>

        <section className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Specialist Detection Models (6 Classes)</h2>
            <Link href="/models" className="btn" style={{ fontSize: "12px", padding: "4px 8px" }}>
              View Models
            </Link>
          </div>
          <div className="threat-list">
            {summary?.models?.map((model) => {
              const count = summary.threat_counts?.[model.threat_class] || 0;
              const isLoaded = model.status === "loaded" || model.status === "active";
              return (
                <div className="threat-row" key={model.threat_class}>
                  <div>
                    <div className="threat-name">{model.threat_class}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      Status:{" "}
                      <span style={{ fontWeight: 600, color: isLoaded ? "#15803d" : "#64748b" }}>
                        {model.status}
                      </span>
                      {model.version && ` · v${model.version}`}
                    </div>
                  </div>
                  <span className="threat-count-badge">{count} alerts</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Recent Alerts Section */}
      <section className="section-card">
        <div className="section-card-header">
          <h2 className="section-card-title">Recent Detections</h2>
          <Link href="/alerts" className="btn-primary btn" style={{ fontSize: "12px", padding: "5px 10px" }}>
            All Alerts
          </Link>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="state-box">
            <p className="state-title">No detections recorded</p>
            <p style={{ fontSize: "13px" }}>
              Monitored traffic exhibits no matching threat signatures or the monitoring engine is idle.
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Threat Class</th>
                  <th>Severity</th>
                  <th>Confidence</th>
                  <th>Source → Destination</th>
                  <th>Flow ID</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAlerts.map((alert) => {
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
                        <strong style={{ fontSize: "12px" }}>{alert.threat_class}</strong>
                      </td>
                      <td>
                        <span className={`badge ${sevClass}`}>{alert.severity}</span>
                      </td>
                      <td>{Math.round(alert.confidence * 100)}%</td>
                      <td className="mono" style={{ fontSize: "12px" }}>
                        {alert.source_ip || "—"}:{alert.source_port || "—"} →{" "}
                        {alert.destination_ip || "—"}:{alert.destination_port || "—"}
                      </td>
                      <td className="mono" style={{ fontSize: "11px", color: "#64748b" }}>
                        {alert.flow_id ? alert.flow_id.substring(0, 16) : "—"}
                      </td>
                      <td>
                        {alert.acknowledged === 1 ? (
                          <span className="badge badge-active">Acknowledged</span>
                        ) : (
                          <span className="badge badge-offline">Unreviewed</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* System Events */}
      {summary?.recent_events && summary.recent_events.length > 0 && (
        <section className="section-card">
          <div className="section-card-header">
            <h2 className="section-card-title">Recent System Events</h2>
          </div>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Type</th>
                  <th>Severity</th>
                  <th>Message</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_events.map((ev) => (
                  <tr key={ev.id}>
                    <td className="mono">{new Date(ev.timestamp).toLocaleString()}</td>
                    <td>{ev.event_type}</td>
                    <td>
                      <span className="badge badge-offline">{ev.severity}</span>
                    </td>
                    <td>{ev.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
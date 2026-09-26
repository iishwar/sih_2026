"use client";

import { useEffect, useState, useCallback } from "react";

const styles = `
  .traffic-container {
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

  .controls-row {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn-group {
    display: inline-flex;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background-color: #ffffff;
  }

  .btn-group-btn {
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    border: none;
    background: transparent;
    color: #475569;
    cursor: pointer;
    border-right: 1px solid #cbd5e1;
    transition: background-color 0.15s ease, color 0.15s ease;
  }

  .btn-group-btn:last-child {
    border-right: none;
  }

  .btn-group-btn.active {
    background-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
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
    transition: background-color 0.15s ease;
  }

  .btn:hover {
    background-color: #f8fafc;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .kpi-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 16px 18px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .kpi-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .kpi-val {
    font-size: 24px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 8px;
  }

  .kpi-meta {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }

  .chart-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 900px) {
    .chart-grid {
      grid-template-columns: 1fr;
    }
  }

  .chart-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 18px 20px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .chart-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
  }

  .chart-legend {
    font-size: 11px;
    font-weight: 600;
    color: #0284c7;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .chart-container {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: flex-end;
    gap: 4px;
    border-bottom: 1px solid #cbd5e1;
    border-left: 1px solid #cbd5e1;
    padding-top: 10px;
    padding-bottom: 2px;
    position: relative;
  }

  .chart-empty {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #94a3b8;
    font-size: 13px;
  }

  .chart-bar-col {
    flex: 1;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }

  .chart-bar {
    width: 100%;
    max-width: 14px;
    background-color: #0284c7;
    border-radius: 2px 2px 0 0;
    transition: height 0.3s ease;
  }

  .chart-bar-cpu {
    background-color: #059669;
  }

  .chart-bar-flows {
    background-color: #0284c7;
  }

  .chart-bar-drops {
    background-color: #dc2626;
  }

  .chart-footer {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
    margin-top: 8px;
  }

  .table-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    overflow: hidden;
  }

  .table-header {
    padding: 14px 20px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    padding: 10px 16px;
    border-bottom: 1px solid #f1f5f9;
    color: #1e293b;
    vertical-align: middle;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
  }

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

  .alert-banner {
    background-color: #fff7ed;
    border: 1px solid #fed7aa;
    border-radius: 6px;
    padding: 12px 16px;
    font-size: 13px;
    color: #9a3412;
  }
`;

export default function TrafficPage() {
  const [metricsData, setMetricsData] = useState(null);
  const [range, setRange] = useState("1h");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`/api/metrics?range=${range}&limit=60`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to fetch traffic telemetry.");
      }

      const data = await res.json();
      setMetricsData(data);
    } catch (err) {
      setError(err.message || "Failed to load telemetry.");
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 10000);
    return () => clearInterval(interval);
  }, [loadMetrics]);

  const latest = metricsData?.latest;
  const history = metricsData?.history || [];
  const freshness = metricsData?.freshness;
  const isStale = freshness?.is_stale ?? true;

  // Maximum calculations for charts
  const maxPps = Math.max(...history.map((m) => m.packets_per_second), 10);
  const maxFlows = Math.max(...history.map((m) => m.active_flows), 10);
  const maxCpu = Math.max(...history.map((m) => m.cpu_percent), 100);

  // Format memory
  const memoryMB = latest?.memory_bytes
    ? (latest.memory_bytes / (1024 * 1024)).toFixed(1)
    : "—";

  // Format uptime
  let uptimeFormatted = "—";
  if (latest?.uptime_seconds !== undefined && latest?.uptime_seconds !== null) {
    const s = latest.uptime_seconds;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    uptimeFormatted = `${h}h ${m}m ${sec}s`;
  }

  return (
    <div className="traffic-container">
      <style>{styles}</style>

      <section className="header-row">
        <div className="title-group">
          <h1>Traffic & Operational Telemetry</h1>
          <p>
            Real-time capture buffer throughput, flow tracking capacity, and C++ process resource metrics.
          </p>
        </div>

        <div className="controls-row">
          <div className="btn-group" role="group" aria-label="Time range selector">
            {["15m", "1h", "6h", "24h"].map((r) => (
              <button
                key={r}
                type="button"
                className={`btn-group-btn ${range === r ? "active" : ""}`}
                onClick={() => setRange(r)}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn"
            onClick={loadMetrics}
            disabled={loading}
            aria-label="Refresh traffic metrics"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      {error && <div className="alert-banner" role="alert">{error}</div>}

      {isStale && (
        <div className="alert-banner" role="status">
          <strong>Telemetry Status: </strong>
          {freshness?.age_seconds !== null
            ? `Metrics were last updated ${freshness?.age_seconds}s ago (exceeds ${freshness?.threshold_seconds}s threshold). Process may be paused or offline.`
            : "No telemetry records found. The C++ capture process has not submitted metrics."}
        </div>
      )}

      {/* KPI Grid */}
      <section className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-label">Throughput</div>
          <div className="kpi-val">
            {latest ? `${latest.packets_per_second.toLocaleString()} pps` : "—"}
          </div>
          <div className="kpi-meta">
            {latest ? `${(latest.bytes_per_second / (1024 * 1024)).toFixed(2)} MB/s` : "No traffic"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Active Flows</div>
          <div className="kpi-val">
            {latest ? latest.active_flows.toLocaleString() : "—"}
          </div>
          <div className="kpi-meta">
            {latest ? `${latest.flows_per_second.toFixed(1)} flows/sec` : "Flow tracking idle"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Buffer Drops</div>
          <div className="kpi-val" style={{ color: latest?.capture_drops > 0 ? "#dc2626" : "#0f172a" }}>
            {latest ? latest.capture_drops.toLocaleString() : "—"}
          </div>
          <div className="kpi-meta">
            {latest ? `Drop rate: ${(latest.capture_drop_rate * 100).toFixed(3)}%` : "Zero packet loss"}
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Process CPU</div>
          <div className="kpi-val">
            {latest ? `${latest.cpu_percent.toFixed(1)}%` : "—"}
          </div>
          <div className="kpi-meta">Multi-threaded capture engine</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Memory Usage</div>
          <div className="kpi-val">
            {latest ? `${memoryMB} MB` : "—"}
          </div>
          <div className="kpi-meta">RSS footprint</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">Engine Uptime</div>
          <div className="kpi-val" style={{ fontSize: "18px", marginTop: "14px" }}>
            {uptimeFormatted}
          </div>
          <div className="kpi-meta">
            Status:{" "}
            <span
              className={`badge ${
                latest?.ingest_status === "healthy" || latest?.ingest_status === "active"
                  ? "badge-active"
                  : "badge-offline"
              }`}
            >
              {latest?.ingest_status || "unknown"}
            </span>
          </div>
        </div>
      </section>

      {/* Visual Time-series Charts */}
      <section className="chart-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Packets Processed (PPS)</h2>
            <span className="chart-legend">Peak: {Math.round(maxPps)} pps</span>
          </div>
          <div className="chart-container">
            {history.length === 0 ? (
              <div className="chart-empty">No telemetry recorded for this range.</div>
            ) : (
              history.map((pt, idx) => {
                const heightPct = Math.max(4, (pt.packets_per_second / maxPps) * 100);
                return (
                  <div
                    key={idx}
                    className="chart-bar-col"
                    title={`${new Date(pt.recorded_at).toLocaleTimeString()}: ${pt.packets_per_second} pps`}
                  >
                    <div className="chart-bar" style={{ height: `${heightPct}%` }} />
                  </div>
                );
              })
            )}
          </div>
          <div className="chart-footer">
            <span>{history[0]?.recorded_at ? new Date(history[0].recorded_at).toLocaleTimeString() : "—"}</span>
            <span>{history.length} samples</span>
            <span>{history[history.length - 1]?.recorded_at ? new Date(history[history.length - 1].recorded_at).toLocaleTimeString() : "—"}</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Active IP Flows</h2>
            <span className="chart-legend">Peak: {Math.round(maxFlows)} flows</span>
          </div>
          <div className="chart-container">
            {history.length === 0 ? (
              <div className="chart-empty">No telemetry recorded for this range.</div>
            ) : (
              history.map((pt, idx) => {
                const heightPct = Math.max(4, (pt.active_flows / maxFlows) * 100);
                return (
                  <div
                    key={idx}
                    className="chart-bar-col"
                    title={`${new Date(pt.recorded_at).toLocaleTimeString()}: ${pt.active_flows} flows`}
                  >
                    <div className="chart-bar chart-bar-flows" style={{ height: `${heightPct}%` }} />
                  </div>
                );
              })
            )}
          </div>
          <div className="chart-footer">
            <span>{history[0]?.recorded_at ? new Date(history[0].recorded_at).toLocaleTimeString() : "—"}</span>
            <span>{history.length} samples</span>
            <span>{history[history.length - 1]?.recorded_at ? new Date(history[history.length - 1].recorded_at).toLocaleTimeString() : "—"}</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">CPU Utilization (%)</h2>
            <span className="chart-legend" style={{ color: "#059669", backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }}>
              Peak: {Math.round(maxCpu)}%
            </span>
          </div>
          <div className="chart-container">
            {history.length === 0 ? (
              <div className="chart-empty">No telemetry recorded for this range.</div>
            ) : (
              history.map((pt, idx) => {
                const heightPct = Math.max(4, (pt.cpu_percent / 100) * 100);
                return (
                  <div
                    key={idx}
                    className="chart-bar-col"
                    title={`${new Date(pt.recorded_at).toLocaleTimeString()}: ${pt.cpu_percent}% CPU`}
                  >
                    <div className="chart-bar chart-bar-cpu" style={{ height: `${heightPct}%` }} />
                  </div>
                );
              })
            )}
          </div>
          <div className="chart-footer">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h2 className="chart-title">Buffer Capture Drops</h2>
            <span className="chart-legend" style={{ color: "#dc2626", backgroundColor: "#fef2f2", borderColor: "#fecaca" }}>
              Drops
            </span>
          </div>
          <div className="chart-container">
            {history.length === 0 ? (
              <div className="chart-empty">No telemetry recorded for this range.</div>
            ) : (
              history.map((pt, idx) => {
                const heightPct = pt.capture_drops > 0 ? 80 : 4;
                return (
                  <div
                    key={idx}
                    className="chart-bar-col"
                    title={`${new Date(pt.recorded_at).toLocaleTimeString()}: ${pt.capture_drops} drops`}
                  >
                    <div className="chart-bar chart-bar-drops" style={{ height: `${heightPct}%` }} />
                  </div>
                );
              })
            )}
          </div>
          <div className="chart-footer">
            <span>Buffer drops indicates kernel socket queue saturation</span>
          </div>
        </div>
      </section>

      {/* Recent Telemetry Table */}
      <section className="table-card">
        <div className="table-header">
          <span>Recent Telemetry Logs</span>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Latest 10 records</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Recorded At</th>
                <th>Packets / Sec</th>
                <th>Throughput</th>
                <th>Active Flows</th>
                <th>Capture Drops</th>
                <th>CPU %</th>
                <th>RAM</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                    No telemetry records available.
                  </td>
                </tr>
              ) : (
                history.slice(-10).reverse().map((row, idx) => (
                  <tr key={idx}>
                    <td className="mono">{new Date(row.recorded_at).toLocaleTimeString()}</td>
                    <td>{row.packets_per_second.toLocaleString()}</td>
                    <td className="mono">{(row.bytes_per_second / (1024 * 1024)).toFixed(2)} MB/s</td>
                    <td>{row.active_flows.toLocaleString()}</td>
                    <td style={{ color: row.capture_drops > 0 ? "#dc2626" : "inherit" }}>
                      {row.capture_drops}
                    </td>
                    <td>{row.cpu_percent.toFixed(1)}%</td>
                    <td className="mono">{(row.memory_bytes / (1024 * 1024)).toFixed(1)} MB</td>
                    <td>
                      <span className="badge badge-active">{row.ingest_status}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
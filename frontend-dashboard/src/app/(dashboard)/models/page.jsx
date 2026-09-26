"use client";

import { useEffect, useState } from "react";

const styles = `
  .models-container {
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

  .models-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 18px;
  }

  .model-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: 16px;
  }

  .model-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 10px;
  }

  .model-title {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    line-height: 1.3;
  }

  .model-desc {
    font-size: 12px;
    color: #64748b;
    margin-top: 6px;
    line-height: 1.4;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 12px;
    font-size: 12px;
  }

  .meta-item-label {
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.4px;
  }

  .meta-item-value {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    margin-top: 2px;
  }

  .mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 12px;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 4px;
    letter-spacing: 0.3px;
    white-space: nowrap;
  }

  .badge-loaded {
    background-color: #f0fdf4;
    color: #15803d;
    border: 1px solid #bbf7d0;
  }

  .badge-unknown {
    background-color: #f8fafc;
    color: #64748b;
    border: 1px solid #cbd5e1;
  }

  .badge-error {
    background-color: #fef2f2;
    color: #b91c1c;
    border: 1px solid #fecaca;
  }

  .info-callout {
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 8px;
    padding: 14px 18px;
    font-size: 13px;
    color: #0369a1;
    line-height: 1.5;
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

const CLASS_METADATA = {
  VOLUMETRIC_PROTOCOL_DDOS: {
    name: "Volumetric Protocol DDoS Specialist",
    description: "Detects packet floods, SYN/UDP saturation, amplification vectors, and rate anomalies without inspecting payload content.",
    features: "Packet arrival rates, TCP flag asymmetry, byte/packet ratios.",
  },
  BOTNET_C2_BEACONING: {
    name: "Botnet C2 Beaconing Specialist",
    description: "Identifies recurrent command-and-control beacon intervals, periodic keepalives, and jitter patterns in outbound sessions.",
    features: "Inter-arrival delta distributions, flow duration regularity, connection periodicity.",
  },
  DGA_DNS_TUNNELLING: {
    name: "DGA & DNS Tunnelling Specialist",
    description: "Monitors DNS query metadata, high-entropy subdomain requests, abnormal record TXT volume, and algorithmic domain generation.",
    features: "Domain Shannon entropy, character frequency, query length, lookup frequency.",
  },
  ENCRYPTED_SESSION_MALWARE_INDICATOR: {
    name: "Encrypted Session Malware Specialist",
    description: "Classifies malicious TLS/QUIC sessions purely via handshake parameters, cipher suite choices, and packet length sequences.",
    features: "TLS SNI patterns, ClientHello cipher lists, initial packet burst sizes (no decryption).",
  },
  RECONNAISSANCE_PORT_SCAN: {
    name: "Reconnaissance & Port Scan Specialist",
    description: "Identifies vertical port sweeps, horizontal host discovery, SYN stealth probes, and network mapping attempts.",
    features: "Destination port diversity, unanswered connection ratio, scan dispersion.",
  },
  DATA_EXFILTRATION: {
    name: "Data Exfiltration Specialist",
    description: "Flags unauthorized outbound volume spikes, abnormal session durations, and asymmetric egress byte transfer profiles.",
    features: "Cumulative outbound byte volume, session duration, directional flow ratios.",
  },
};

export default function ModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadModels() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/models", { cache: "no-store" });
      if (!res.ok) {
        throw new Error("Unable to fetch model status from backend.");
      }

      const data = await res.json();
      setModels(data.models || []);
    } catch (err) {
      setError(err.message || "Failed to load models.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <div className="models-container">
      <style>{styles}</style>

      <section className="header-row">
        <div className="title-group">
          <h1>ML Threat Detection Models</h1>
          <p>
            Status, versions, and classification thresholds for the six specialist binary inference models.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn"
            onClick={loadModels}
            disabled={loading}
            aria-label="Refresh model telemetry"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </section>

      <div className="info-callout">
        <strong>Passive Architectural Mandate: </strong>
        These six specialist binary classifiers evaluate statistical traffic metadata, header sequences, and flow timing. Monitored traffic is strictly read-only; no packet payloads are decrypted and no active mitigations are transmitted.
      </div>

      {error && <div className="alert-banner" role="alert">{error}</div>}

      <section className="models-grid">
        {models.map((model) => {
          const meta = CLASS_METADATA[model.threat_class] || {
            name: model.threat_class,
            description: "Binary threat classifier.",
            features: "Observed flow metadata.",
          };

          const isLoaded = model.status === "loaded" || model.status === "active";
          const badgeClass = isLoaded
            ? "badge-loaded"
            : model.status === "error"
            ? "badge-error"
            : "badge-unknown";

          return (
            <article className="model-card" key={model.threat_class}>
              <div>
                <div className="model-card-top">
                  <div>
                    <h2 className="model-title">{meta.name}</h2>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      CLASS: <span className="mono">{model.threat_class}</span>
                    </div>
                  </div>
                  <span className={`badge ${badgeClass}`}>
                    {model.status.toUpperCase()}
                  </span>
                </div>

                <p className="model-desc">{meta.description}</p>
              </div>

              <div className="meta-grid">
                <div>
                  <div className="meta-item-label">Version</div>
                  <div className="meta-item-value">
                    {model.version ? `v${model.version}` : "Not reported"}
                  </div>
                </div>

                <div>
                  <div className="meta-item-label">Decision Threshold</div>
                  <div className="meta-item-value">
                    {model.threshold !== null ? model.threshold.toFixed(2) : "Not reported"}
                  </div>
                </div>

                <div>
                  <div className="meta-item-label">Loaded At</div>
                  <div className="meta-item-value mono" style={{ fontSize: "11px" }}>
                    {model.loaded_at ? new Date(model.loaded_at).toLocaleTimeString() : "—"}
                  </div>
                </div>

                <div>
                  <div className="meta-item-label">Telemetry Synced</div>
                  <div className="meta-item-value mono" style={{ fontSize: "11px" }}>
                    {model.updated_at ? new Date(model.updated_at).toLocaleTimeString() : "—"}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "11px", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "10px" }}>
                <strong>Observed Features: </strong>
                {meta.features}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
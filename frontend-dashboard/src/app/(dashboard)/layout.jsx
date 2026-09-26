"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const styles = `
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background-color: #f8fafc;
  }

  .top-header {
    background-color: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    position: sticky;
    top: 0;
    z-index: 50;
  }

  .header-inner {
    max-width: 1360px;
    margin: 0 auto;
    padding: 0 24px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
  }

  .brand-group {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo-badge {
    width: 32px;
    height: 32px;
    background-color: #0f172a;
    color: #ffffff;
    font-weight: 700;
    font-size: 14px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.5px;
  }

  .brand-title {
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.2px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand-sub {
    font-size: 11px;
    font-weight: 600;
    color: #475569;
    background-color: #f1f5f9;
    border: 1px solid #e2e8f0;
    padding: 2px 7px;
    border-radius: 4px;
    letter-spacing: 0.4px;
  }

  .nav-menu {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .nav-link {
    font-size: 13px;
    font-weight: 500;
    color: #475569;
    padding: 7px 13px;
    border-radius: 6px;
    transition: color 0.15s ease, background-color 0.15s ease;
  }

  .nav-link:hover {
    color: #0f172a;
    background-color: #f1f5f9;
  }

  .nav-link.active {
    color: #0f172a;
    background-color: #f1f5f9;
    font-weight: 600;
    box-shadow: inset 0 -2px 0 #0284c7;
  }

  .status-cluster {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .status-pill {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 9999px;
    border: 1px solid #e2e8f0;
    background-color: #f8fafc;
    color: #475569;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #94a3b8;
  }

  .status-dot.active {
    background-color: #16a34a;
  }

  .status-dot.stale {
    background-color: #d97706;
  }

  .status-dot.offline {
    background-color: #dc2626;
  }

  .pill-read-only {
    font-size: 11px;
    font-weight: 600;
    color: #0369a1;
    background-color: #f0f9ff;
    border: 1px solid #bae6fd;
    padding: 3px 8px;
    border-radius: 4px;
    letter-spacing: 0.3px;
  }

  .main-content {
    flex: 1;
    max-width: 1360px;
    width: 100%;
    margin: 0 auto;
    padding: 24px;
  }

  .app-footer {
    border-top: 1px solid #e2e8f0;
    background-color: #ffffff;
    padding: 16px 24px;
    font-size: 12px;
    color: #64748b;
  }

  .footer-inner {
    max-width: 1360px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }

  @media (max-width: 860px) {
    .header-inner {
      height: auto;
      padding: 12px 16px;
      flex-direction: column;
      align-items: stretch;
      gap: 12px;
    }
    .brand-group {
      justify-content: space-between;
    }
    .nav-menu {
      overflow-x: auto;
      padding-bottom: 4px;
    }
    .status-cluster {
      justify-content: flex-end;
    }
    .main-content {
      padding: 16px;
    }
  }
`;

export default function DashboardLayout({ children }) {
  const pathname = usePathname();
  const [health, setHealth] = useState({
    service_status: "loading",
    freshness_seconds: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function checkHealth() {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setHealth(data);
        } else {
          if (isMounted) setHealth({ service_status: "offline", freshness_seconds: null });
        }
      } catch {
        if (isMounted) setHealth({ service_status: "offline", freshness_seconds: null });
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const navItems = [
    { label: "Overview", href: "/" },
    { label: "Alerts", href: "/alerts" },
    { label: "Traffic", href: "/traffic" },
    { label: "Models", href: "/models" },
    { label: "Settings", href: "/settings" },
  ];

  let statusLabel = "Checking service...";
  let dotClass = "";
  if (health.service_status === "active") {
    statusLabel = health.freshness_seconds !== null
      ? `Ingest Active (${health.freshness_seconds}s ago)`
      : "Ingest Active";
    dotClass = "active";
  } else if (health.service_status === "stale") {
    statusLabel = health.freshness_seconds !== null
      ? `Data Stale (${health.freshness_seconds}s ago)`
      : "Data Stale";
    dotClass = "stale";
  } else if (health.service_status === "no_data") {
    statusLabel = "No Ingest Data";
    dotClass = "";
  } else if (health.service_status === "offline") {
    statusLabel = "Service Offline";
    dotClass = "offline";
  }

  return (
    <div className="app-shell">
      <style>{styles}</style>

      <header className="top-header">
        <div className="header-inner">
          <div className="brand-group">
            <div className="brand-logo-badge" aria-hidden="true">NV</div>
            <span className="brand-title">
              NetraVerse
              <span className="brand-sub">SIH PS 26145</span>
            </span>
          </div>

          <nav className="nav-menu" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-link ${isActive ? "active" : ""}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="status-cluster">
            <span className="pill-read-only">UNIDIRECTIONAL DIODE · READ-ONLY</span>
            <div className="status-pill" title="Ingestion state based on latest metrics freshness threshold (60s)">
              <span className={`status-dot ${dotClass}`} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main-content" id="main-content">
        {children}
      </main>

      <footer className="app-footer">
        <div className="footer-inner">
          <span>NetraVerse Passive Network Monitoring — Hardware/Software Data Diode Ingestion</span>
          <span>Zero packet emission · Non-intrusive metadata extraction · Payload encryption preserved</span>
        </div>
      </footer>
    </div>
  );
}
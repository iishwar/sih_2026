import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

if (typeof window !== 'undefined') {
  throw new Error('Database module cannot be loaded in client components.');
}

/**
 * Six required threat classes for NetraVerse SIH PS 26145
 * Passive cyber-threat monitoring in unidirectional IP traffic.
 */
export const REQUIRED_THREAT_CLASSES = [
  'VOLUMETRIC_PROTOCOL_DDOS',
  'BOTNET_C2_BEACONING',
  'DGA_DNS_TUNNELLING',
  'ENCRYPTED_SESSION_MALWARE_INDICATOR',
  'RECONNAISSANCE_PORT_SCAN',
  'DATA_EXFILTRATION',
];

export const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

/**
 * Documented freshness threshold: 60 seconds by default.
 * If metrics are older than this threshold or absent, the service is not considered active.
 */
export const FRESHNESS_THRESHOLD_SECONDS = Number(process.env.METRICS_FRESHNESS_SECONDS || 60);
export const FRESHNESS_THRESHOLD_MS = FRESHNESS_THRESHOLD_SECONDS * 1000;

/**
 * Resolves the SQLite database path.
 * Reads SQLITE_DB_PATH from environment or uses safe local development default.
 */
export function getDatabasePath() {
  if (process.env.SQLITE_DB_PATH) {
    return path.isAbsolute(process.env.SQLITE_DB_PATH)
      ? process.env.SQLITE_DB_PATH
      : path.resolve(process.cwd(), process.env.SQLITE_DB_PATH);
  }
  // Local development default (points to ../sql_lite/netraverse_dev.db, not production)
  return path.resolve(process.cwd(), '..', 'sql_lite', 'netraverse_dev.db');
}

/**
 * Returns a DatabaseSync instance.
 * Reuses active connection on globalThis to avoid descriptor leaks in Next.js development.
 */
export function getDatabase(customPath) {
  const targetPath = customPath || getDatabasePath();

  if (targetPath === ':memory:') {
    const memDb = new DatabaseSync(':memory:');
    memDb.exec('PRAGMA foreign_keys = ON;');
    return memDb;
  }

  const globalKey = `__netraverse_db_${targetPath}`;
  if (globalThis[globalKey]) {
    return globalThis[globalKey];
  }

  // Ensure directory exists
  const parentDir = path.dirname(targetPath);
  if (!fs.existsSync(parentDir)) {
    fs.mkdirSync(parentDir, { recursive: true });
  }

  try {
    const db = new DatabaseSync(targetPath);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA busy_timeout = 5000;');
    db.exec('PRAGMA foreign_keys = ON;');
    globalThis[globalKey] = db;
    return db;
  } catch (err) {
    console.error('[NetraVerse DB] Failed to open SQLite connection:', err.message);
    throw new Error('Database connection failed.');
  }
}

/**
 * Initializes the assumed SQLite schema.
 * Only executed when explicitly invoked by application setup or automated tests.
 */
export function initializeSchema(db) {
  const targetDb = db || getDatabase();
  targetDb.exec(`
    CREATE TABLE IF NOT EXISTS alerts (
        id                  TEXT PRIMARY KEY,
        timestamp           TEXT NOT NULL,
        flow_id             TEXT NOT NULL,
        threat_class        TEXT NOT NULL,
        confidence          REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
        severity            TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
        evidence_json       TEXT NOT NULL,
        model_version       TEXT,
        source_ip           TEXT,
        destination_ip      TEXT,
        source_port         INTEGER,
        destination_port    INTEGER,
        protocol            TEXT,
        acknowledged        INTEGER NOT NULL DEFAULT 0 CHECK (acknowledged IN (0, 1))
    );

    CREATE TABLE IF NOT EXISTS service_metrics (
        id                      INTEGER PRIMARY KEY AUTOINCREMENT,
        recorded_at             TEXT NOT NULL,
        packets_per_second      REAL NOT NULL DEFAULT 0,
        flows_per_second        REAL NOT NULL DEFAULT 0,
        capture_drops           INTEGER NOT NULL DEFAULT 0,
        capture_drop_rate       REAL NOT NULL DEFAULT 0,
        bytes_per_second        REAL NOT NULL DEFAULT 0,
        active_flows            INTEGER NOT NULL DEFAULT 0,
        memory_bytes            INTEGER NOT NULL DEFAULT 0,
        cpu_percent             REAL NOT NULL DEFAULT 0,
        uptime_seconds          INTEGER NOT NULL DEFAULT 0,
        ingest_status           TEXT NOT NULL DEFAULT 'unknown'
    );

    CREATE TABLE IF NOT EXISTS model_status (
        id              TEXT PRIMARY KEY,
        threat_class    TEXT NOT NULL UNIQUE,
        status          TEXT NOT NULL,
        version         TEXT,
        threshold       REAL,
        loaded_at       TEXT,
        updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_events (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp       TEXT NOT NULL,
        event_type      TEXT NOT NULL,
        severity        TEXT NOT NULL,
        message         TEXT NOT NULL,
        details_json    TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_alerts_timestamp ON alerts (timestamp DESC, id DESC);
    CREATE INDEX IF NOT EXISTS idx_alerts_threat_class ON alerts (threat_class);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts (acknowledged);
    CREATE INDEX IF NOT EXISTS idx_service_metrics_recorded_at ON service_metrics (recorded_at DESC);
    CREATE INDEX IF NOT EXISTS idx_system_events_timestamp ON system_events (timestamp DESC);
  `);
}

/**
 * Safely parses evidence_json. Returns an empty object or formatted record on malformed JSON.
 * Preserves the passive observation requirement (no decrypted payloads).
 */
export function parseEvidence(evidenceJson) {
  if (!evidenceJson) return {};
  if (typeof evidenceJson === 'object') return evidenceJson;
  try {
    return JSON.parse(evidenceJson);
  } catch (err) {
    console.warn('[NetraVerse DB] Malformed evidence_json encountered:', err.message);
    return {
      raw_evidence: String(evidenceJson),
      parse_warning: 'Evidence contains unparseable metadata structure.',
    };
  }
}

/**
 * Queries paginated alerts with filters, stable ordering, and search.
 */
export function getAlerts({
  page = 1,
  limit = 20,
  threat_class,
  severity,
  acknowledged,
  from,
  to,
  search,
  customDb,
} = {}) {
  const db = customDb || getDatabase();

  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (validatedPage - 1) * validatedLimit;

  const conditions = [];
  const params = [];

  if (threat_class && threat_class !== 'ALL') {
    conditions.push('threat_class = ?');
    params.push(threat_class);
  }

  if (severity && severity !== 'ALL') {
    if (!VALID_SEVERITIES.includes(severity.toUpperCase())) {
      const err = new Error('Invalid severity filter.');
      err.code = 'INVALID_SEVERITY';
      throw err;
    }
    conditions.push('severity = ?');
    params.push(severity.toUpperCase());
  }

  if (acknowledged !== undefined && acknowledged !== '' && acknowledged !== null && acknowledged !== 'ALL') {
    let ackVal;
    if (acknowledged === true || acknowledged === 'true' || acknowledged === 1 || acknowledged === '1') {
      ackVal = 1;
    } else if (acknowledged === false || acknowledged === 'false' || acknowledged === 0 || acknowledged === '0') {
      ackVal = 0;
    } else {
      const err = new Error('Invalid acknowledged filter value.');
      err.code = 'INVALID_ACKNOWLEDGED';
      throw err;
    }
    conditions.push('acknowledged = ?');
    params.push(ackVal);
  }

  if (from) {
    const fromDate = new Date(from);
    if (isNaN(fromDate.getTime())) {
      const err = new Error('Invalid from timestamp filter.');
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }
    conditions.push('timestamp >= ?');
    params.push(fromDate.toISOString());
  }

  if (to) {
    const toDate = new Date(to);
    if (isNaN(toDate.getTime())) {
      const err = new Error('Invalid to timestamp filter.');
      err.code = 'INVALID_DATE_RANGE';
      throw err;
    }
    conditions.push('timestamp <= ?');
    params.push(toDate.toISOString());
  }

  if (search && typeof search === 'string' && search.trim().length > 0) {
    const cleanSearch = search.trim().replace(/[%_]/g, '\\$&');
    conditions.push('(id LIKE ? ESCAPE \'\\\' OR flow_id LIKE ? ESCAPE \'\\\' OR source_ip LIKE ? ESCAPE \'\\\' OR destination_ip LIKE ? ESCAPE \'\\\')');
    const term = `%${cleanSearch}%`;
    params.push(term, term, term, term);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countSql = `SELECT COUNT(*) AS total FROM alerts ${whereClause}`;
    const countStmt = db.prepare(countSql);
    const countResult = countStmt.get(...params);
    const total = countResult ? countResult.total : 0;

    const selectSql = `
      SELECT id, timestamp, flow_id, threat_class, confidence, severity,
             evidence_json, model_version, source_ip, destination_ip,
             source_port, destination_port, protocol, acknowledged
      FROM alerts
      ${whereClause}
      ORDER BY timestamp DESC, id DESC
      LIMIT ? OFFSET ?
    `;

    const selectStmt = db.prepare(selectSql);
    const rows = selectStmt.all(...params, validatedLimit, offset);

    const alerts = rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      flow_id: row.flow_id,
      threat_class: row.threat_class,
      confidence: Number(row.confidence),
      severity: row.severity,
      evidence: parseEvidence(row.evidence_json),
      model_version: row.model_version,
      source_ip: row.source_ip,
      destination_ip: row.destination_ip,
      source_port: row.source_port,
      destination_port: row.destination_port,
      protocol: row.protocol,
      acknowledged: Number(row.acknowledged),
    }));

    return {
      alerts,
      total,
      page: validatedPage,
      limit: validatedLimit,
      total_pages: Math.ceil(total / validatedLimit) || 1,
    };
  } catch (err) {
    if (err.message && err.message.includes('no such table')) {
      return {
        alerts: [],
        total: 0,
        page: validatedPage,
        limit: validatedLimit,
        total_pages: 1,
      };
    }
    console.error('[NetraVerse DB] getAlerts query error:', err.message);
    throw new Error('Failed to retrieve alerts.');
  }
}

/**
 * Retrieves a single alert by ID.
 */
export function getAlertById(id, customDb) {
  if (!id || typeof id !== 'string') return null;
  const db = customDb || getDatabase();

  try {
    const stmt = db.prepare(`
      SELECT id, timestamp, flow_id, threat_class, confidence, severity,
             evidence_json, model_version, source_ip, destination_ip,
             source_port, destination_port, protocol, acknowledged
      FROM alerts
      WHERE id = ?
    `);
    const row = stmt.get(id);
    if (!row) return null;

    return {
      id: row.id,
      timestamp: row.timestamp,
      flow_id: row.flow_id,
      threat_class: row.threat_class,
      confidence: Number(row.confidence),
      severity: row.severity,
      evidence: parseEvidence(row.evidence_json),
      model_version: row.model_version,
      source_ip: row.source_ip,
      destination_ip: row.destination_ip,
      source_port: row.source_port,
      destination_port: row.destination_port,
      protocol: row.protocol,
      acknowledged: Number(row.acknowledged),
    };
  } catch (err) {
    if (err.message && err.message.includes('no such table')) {
      return null;
    }
    console.error('[NetraVerse DB] getAlertById query error:', err.message);
    throw new Error('Failed to retrieve alert.');
  }
}

/**
 * Updates an alert's acknowledgement status using a parameterized query.
 */
export function updateAlertAcknowledgement(id, acknowledged, customDb) {
  if (!id || typeof id !== 'string') return null;
  const db = customDb || getDatabase();

  let ackVal;
  if (acknowledged === true || acknowledged === 1 || acknowledged === '1' || acknowledged === 'true') {
    ackVal = 1;
  } else if (acknowledged === false || acknowledged === 0 || acknowledged === '0' || acknowledged === 'false') {
    ackVal = 0;
  } else {
    const err = new Error('Field acknowledged must be a boolean or 0/1.');
    err.code = 'INVALID_BODY';
    throw err;
  }

  try {
    const stmt = db.prepare('UPDATE alerts SET acknowledged = ? WHERE id = ?');
    stmt.run(ackVal, id);
    return getAlertById(id, db);
  } catch (err) {
    console.error('[NetraVerse DB] updateAlertAcknowledgement error:', err.message);
    throw new Error('Failed to update alert acknowledgement.');
  }
}

/**
 * Returns latest service metrics and time-series data.
 */
export function getMetrics({ range = '1h', limit = 60, customDb } = {}) {
  const db = customDb || getDatabase();
  const validatedLimit = Math.min(300, Math.max(1, parseInt(limit, 10) || 60));

  let windowMs = 3600 * 1000;
  if (range === '15m') windowMs = 15 * 60 * 1000;
  else if (range === '6h') windowMs = 6 * 3600 * 1000;
  else if (range === '24h') windowMs = 24 * 3600 * 1000;

  const sinceTime = new Date(Date.now() - windowMs).toISOString();

  try {
    const latestStmt = db.prepare(`
      SELECT recorded_at, packets_per_second, flows_per_second, capture_drops,
             capture_drop_rate, bytes_per_second, active_flows, memory_bytes,
             cpu_percent, uptime_seconds, ingest_status
      FROM service_metrics
      ORDER BY recorded_at DESC, id DESC
      LIMIT 1
    `);
    const latestRow = latestStmt.get();

    const historyStmt = db.prepare(`
      SELECT recorded_at, packets_per_second, flows_per_second, capture_drops,
             capture_drop_rate, bytes_per_second, active_flows, memory_bytes,
             cpu_percent, uptime_seconds, ingest_status
      FROM service_metrics
      WHERE recorded_at >= ?
      ORDER BY recorded_at ASC
      LIMIT ?
    `);
    const historyRows = historyStmt.all(sinceTime, validatedLimit);

    let isStale = true;
    let ageSeconds = null;

    if (latestRow && latestRow.recorded_at) {
      const recordedTime = new Date(latestRow.recorded_at).getTime();
      if (!isNaN(recordedTime)) {
        ageSeconds = Math.max(0, (Date.now() - recordedTime) / 1000);
        isStale = ageSeconds > FRESHNESS_THRESHOLD_SECONDS;
      }
    }

    return {
      latest: latestRow || null,
      history: historyRows || [],
      freshness: {
        is_stale: isStale,
        age_seconds: ageSeconds !== null ? Math.round(ageSeconds * 10) / 10 : null,
        threshold_seconds: FRESHNESS_THRESHOLD_SECONDS,
      },
    };
  } catch (err) {
    if (err.message && err.message.includes('no such table')) {
      return {
        latest: null,
        history: [],
        freshness: {
          is_stale: true,
          age_seconds: null,
          threshold_seconds: FRESHNESS_THRESHOLD_SECONDS,
        },
      };
    }
    console.error('[NetraVerse DB] getMetrics error:', err.message);
    throw new Error('Failed to retrieve metrics.');
  }
}

/**
 * Returns model status for all six required classes.
 * Missing/unreported classes return status "unknown".
 * Never fabricates versions or thresholds.
 */
export function getModels(customDb) {
  const db = customDb || getDatabase();

  let rows = [];
  try {
    const stmt = db.prepare(`
      SELECT id, threat_class, status, version, threshold, loaded_at, updated_at
      FROM model_status
    `);
    rows = stmt.all();
  } catch (err) {
    if (!err.message || !err.message.includes('no such table')) {
      console.error('[NetraVerse DB] getModels query error:', err.message);
    }
  }

  const statusMap = new Map();
  for (const row of rows) {
    if (row.threat_class) {
      statusMap.set(row.threat_class.toUpperCase(), row);
    }
  }

  return REQUIRED_THREAT_CLASSES.map((cls) => {
    const existing = statusMap.get(cls);
    if (existing) {
      return {
        id: existing.id || cls.toLowerCase(),
        threat_class: cls,
        status: existing.status || 'unknown',
        version: existing.version || null,
        threshold: existing.threshold !== null && existing.threshold !== undefined ? Number(existing.threshold) : null,
        loaded_at: existing.loaded_at || null,
        updated_at: existing.updated_at || null,
      };
    }
    return {
      id: cls.toLowerCase(),
      threat_class: cls,
      status: 'unknown',
      version: null,
      threshold: null,
      loaded_at: null,
      updated_at: null,
    };
  });
}

/**
 * Returns system events with pagination and severity filter.
 */
export function getEvents({ page = 1, limit = 20, severity, customDb } = {}) {
  const db = customDb || getDatabase();
  const validatedPage = Math.max(1, parseInt(page, 10) || 1);
  const validatedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (validatedPage - 1) * validatedLimit;

  const conditions = [];
  const params = [];

  if (severity && severity !== 'ALL') {
    conditions.push('severity = ?');
    params.push(severity.toUpperCase());
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const countStmt = db.prepare(`SELECT COUNT(*) AS total FROM system_events ${whereClause}`);
    const countResult = countStmt.get(...params);
    const total = countResult ? countResult.total : 0;

    const selectStmt = db.prepare(`
      SELECT id, timestamp, event_type, severity, message, details_json
      FROM system_events
      ${whereClause}
      ORDER BY timestamp DESC, id DESC
      LIMIT ? OFFSET ?
    `);
    const rows = selectStmt.all(...params, validatedLimit, offset);

    const events = rows.map((row) => ({
      id: row.id,
      timestamp: row.timestamp,
      event_type: row.event_type,
      severity: row.severity,
      message: row.message,
      details: parseEvidence(row.details_json),
    }));

    return {
      events,
      total,
      page: validatedPage,
      limit: validatedLimit,
      total_pages: Math.ceil(total / validatedLimit) || 1,
    };
  } catch (err) {
    if (err.message && err.message.includes('no such table')) {
      return {
        events: [],
        total: 0,
        page: validatedPage,
        limit: validatedLimit,
        total_pages: 1,
      };
    }
    console.error('[NetraVerse DB] getEvents query error:', err.message);
    throw new Error('Failed to retrieve system events.');
  }
}

/**
 * Queries dashboard operational summaries via aggregated SQL.
 */
export function getDashboardSummary({ rangeHours = 24, customDb } = {}) {
  const db = customDb || getDatabase();
  const cutoffTime = new Date(Date.now() - rangeHours * 3600 * 1000).toISOString();

  let totalAlerts = 0;
  const severityCounts = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  const threatCounts = {};
  for (const cls of REQUIRED_THREAT_CLASSES) {
    threatCounts[cls] = 0;
  }
  let trend = [];

  try {
    const totalStmt = db.prepare('SELECT COUNT(*) AS count FROM alerts WHERE timestamp >= ?');
    const totalRes = totalStmt.get(cutoffTime);
    totalAlerts = totalRes ? totalRes.count : 0;

    const sevStmt = db.prepare('SELECT severity, COUNT(*) AS count FROM alerts WHERE timestamp >= ? GROUP BY severity');
    const sevRows = sevStmt.all(cutoffTime);
    for (const row of sevRows) {
      if (row.severity && severityCounts[row.severity] !== undefined) {
        severityCounts[row.severity] = row.count;
      }
    }

    const threatStmt = db.prepare('SELECT threat_class, COUNT(*) AS count FROM alerts WHERE timestamp >= ? GROUP BY threat_class');
    const threatRows = threatStmt.all(cutoffTime);
    for (const row of threatRows) {
      if (row.threat_class) {
        threatCounts[row.threat_class] = row.count;
      }
    }

    // Time buckets (grouped by hour)
    const trendStmt = db.prepare(`
      SELECT strftime('%Y-%m-%d %H:00:00', timestamp) AS bucket,
             severity,
             COUNT(*) AS count
      FROM alerts
      WHERE timestamp >= ?
      GROUP BY bucket, severity
      ORDER BY bucket ASC
    `);
    trend = trendStmt.all(cutoffTime);
  } catch (err) {
    if (!err.message || !err.message.includes('no such table')) {
      console.error('[NetraVerse DB] getDashboardSummary alerts aggregation error:', err.message);
    }
  }

  const metricsData = getMetrics({ range: '1h', limit: 30, customDb: db });
  const models = getModels(db);
  const eventsData = getEvents({ limit: 5, customDb: db });

  return {
    time_range_hours: rangeHours,
    total_alerts: totalAlerts,
    severity_counts: severityCounts,
    threat_counts: threatCounts,
    trend,
    latest_metric: metricsData.latest,
    metric_freshness: metricsData.freshness,
    models,
    recent_events: eventsData.events,
  };
}

/**
 * Returns service and ingestion health.
 * Validates freshness against FRESHNESS_THRESHOLD_SECONDS.
 * Does NOT claim the C++ service is connected unless recent data proves it.
 */
export function getServiceHealth(customDb) {
  const db = customDb || getDatabase();
  let dbConnected = false;
  let tablesInitialized = false;

  try {
    const testStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='service_metrics'");
    const row = testStmt.get();
    dbConnected = true;
    tablesInitialized = !!row;
  } catch (err) {
    console.error('[NetraVerse DB] Health check connection error:', err.message);
    return {
      status: 'error',
      service: 'netraverse',
      service_status: 'offline',
      db_status: 'disconnected',
      last_metric_at: null,
      freshness_seconds: null,
      freshness_threshold_seconds: FRESHNESS_THRESHOLD_SECONDS,
      checked_at: new Date().toISOString(),
    };
  }

  const metrics = getMetrics({ range: '15m', limit: 1, customDb: db });
  const latest = metrics.latest;

  let serviceStatus = 'no_data';
  let freshnessSeconds = null;

  if (latest && latest.recorded_at) {
    const recordedTime = new Date(latest.recorded_at).getTime();
    if (!isNaN(recordedTime)) {
      freshnessSeconds = Math.max(0, (Date.now() - recordedTime) / 1000);
      if (freshnessSeconds <= FRESHNESS_THRESHOLD_SECONDS) {
        serviceStatus = latest.ingest_status === 'healthy' || latest.ingest_status === 'active'
          ? 'active'
          : latest.ingest_status || 'active';
      } else {
        serviceStatus = 'stale';
      }
    }
  }

  return {
    status: 'ok',
    service: 'netraverse',
    service_status: serviceStatus,
    db_status: dbConnected ? 'connected' : 'error',
    tables_initialized: tablesInitialized,
    last_metric_at: latest ? latest.recorded_at : null,
    freshness_seconds: freshnessSeconds !== null ? Math.round(freshnessSeconds * 10) / 10 : null,
    freshness_threshold_seconds: FRESHNESS_THRESHOLD_SECONDS,
    checked_at: new Date().toISOString(),
  };
}

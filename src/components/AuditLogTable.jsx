// src/components/AuditLogTable.jsx
import { useEffect, useMemo, useState, useCallback } from "react";
import api from "../api";
import { notify } from "../utils/notify";

function parseBackendDate(ts) {
  if (!ts) return null;

  const d = new Date(ts);
  if (!Number.isNaN(d.getTime())) return d;

  const d2 = new Date(String(ts).replace(" ", "T"));
  if (!Number.isNaN(d2.getTime())) return d2;

  return null;
}

export default function AuditLogTable() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [actionFilter, setActionFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const role = localStorage.getItem("role") || "";
  const username = localStorage.getItem("username") || "";
  const hotelCode = localStorage.getItem("hotelCode") || "";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      // NOTE: interceptor already injects headers, but leaving this is fine.
      const res = await api.get("/audit-logs", {
        headers: {
          "X-User-Role": role,
          "X-Username": username,
          "X-Hotel-Code": hotelCode,
        },
      });
      setLogs(res.data || []);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
      notify.error("Failed to load audit logs. Check backend + network tab.");

      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [role, username, hotelCode]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  


  const filteredLogs = useMemo(() => {
    return (logs || []).filter((log) => {
      if (actionFilter !== "ALL" && (log.action || "") !== actionFilter) return false;

      const text = searchText.trim().toLowerCase();
      if (text) {
        const haystack = `${log.action || ""} ${log.performedBy || ""} ${log.target || ""}`.toLowerCase();
        if (!haystack.includes(text)) return false;
      }

      const ts = parseBackendDate(log.timestamp);

      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (!ts || ts < from) return false;
      }

      if (toDate) {
        const until = new Date(toDate);
        until.setHours(23, 59, 59, 999);
        if (!ts || ts > until) return false;
      }

      return true;
    });
  }, [logs, actionFilter, searchText, fromDate, toDate]);

  const handleDownloadCSV = () => {
    if (!filteredLogs.length) {
      alert("No logs to export for current filters.");
      return;
    }

    const header = ["Time", "Action", "Performed By", "Target"];

    const csvEscape = (value) => {
      if (value == null) return "";
      const str = String(value);
      if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
      return str;
    };

    const rows = filteredLogs.map((log) => {
      const d = parseBackendDate(log.timestamp);
      return [d ? d.toLocaleString() : "", log.action || "", log.performedBy || "", log.target || ""];
    });

    const csv =
      header.map(csvEscape).join(",") +
      "\n" +
      rows.map((r) => r.map(csvEscape).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header d-flex align-items-center justify-content-between gap-2 flex-wrap">
        <div className="d-flex flex-column">
          <span className="fw-semibold">User Audit Logs</span>
          <span className="text-muted small">
            Hotel: {hotelCode || "ALL"} • Viewing as: {username || "UNKNOWN"} ({role || "NO_ROLE"})
          </span>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-sm btn-outline-secondary" onClick={fetchLogs}>
            Refresh
          </button>
          <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleDownloadCSV}>
            Download CSV
          </button>
        </div>
      </div>

      <div className="p-3">
        {/* Filters Toolbar */}
        <div className="dashboard-toolbar mb-3">
          <div className="dashboard-toolbar-left">
            <div className="dashboard-field">
              <label className="dashboard-label">Action</label>
              <select
                className="form-select form-select-sm dashboard-input"
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
              >
                <option value="ALL">All</option>
                <option value="CHECK_IN">Check In</option>
                <option value="CHECK_OUT">Check Out</option>
                <option value="DELETE_GUEST">Delete Guest</option>
                <option value="UNAUTHORIZED_ACCESS">Unauthorized Access</option>
                <option value="CHANGE_PASSWORD">Change Password</option>
              </select>
            </div>

            <div className="dashboard-field dashboard-field-grow">
              <label className="dashboard-label">Search</label>
              <input
                type="text"
                className="form-control form-control-sm dashboard-input"
                placeholder="Search user / guest / path..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div className="dashboard-field">
              <label className="dashboard-label">From</label>
              <input
                type="date"
                className="form-control form-control-sm dashboard-input"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="dashboard-field">
              <label className="dashboard-label">To</label>
              <input
                type="date"
                className="form-control form-control-sm dashboard-input"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <div className="dashboard-toolbar-right">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary dashboard-chip"
              onClick={() => {
                setActionFilter("ALL");
                setSearchText("");
                setFromDate("");
                setToDate("");
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          {loading ? (
            <div className="py-4 text-center text-muted">Loading logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-4 text-center text-muted">No audit logs match the current filters.</div>
          ) : (
            <table className="table table-striped mb-0">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: 200 }}>Time</th>
                  <th style={{ width: 220 }}>Action</th>
                  <th style={{ width: 220 }}>Performed By</th>
                  <th>Target</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, index) => {
                  const d = parseBackendDate(log.timestamp);
                  return (
                    <tr key={log.id ?? `${log.action || "log"}-${log.timestamp || ""}-${index}`}>
                      <td>{d ? d.toLocaleString() : "-"}</td>
                      <td className="fw-semibold">{log.action || "-"}</td>
                      <td>{log.performedBy || "-"}</td>
                      <td style={{ wordBreak: "break-word" }}>{log.target || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

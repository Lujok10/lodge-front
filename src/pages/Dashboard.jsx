// src/pages/Dashboard.jsx
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";

import ManagerDashboardCharts from "../components/ManagerDashboardCharts";
import ManagerKpiCards from "../components/ManagerKpiCards";
import GuestForm from "../components/GuestForm";
import GuestList from "../components/GuestList";
import AuditLogTable from "../components/AuditLogTable";

import api from "../api";
import { notify } from "../utils/notify";

export default function Dashboard() {
  const navigate = useNavigate();

  const [guests, setGuests] = useState([]);
  const [editingGuest, setEditingGuest] = useState(null);
  const [search, setSearch] = useState("");

  const [receipt, setReceipt] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);

  const [guestsLoading, setGuestsLoading] = useState(false);
  const [kpiFilter, setKpiFilter] = useState("ALL");

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [activeTab, setActiveTab] = useState("guests");

  const role = localStorage.getItem("role") || "";
  const username = localStorage.getItem("username") || "";
  const hotelCode = localStorage.getItem("hotelCode") || "";

  const [compact, setCompact] = useState(localStorage.getItem("guestTableCompact") === "true");

  const receiptCloseBtnRef = useRef(null);

  // ✅ scroll target for KPI → table
  const guestListRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("guestTableCompact", compact ? "true" : "false");
  }, [compact]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));

  const canSeeGuests = role === "MANAGER" || role === "RECEPTION";

  const dashboardTitle = useMemo(() => {
    if (role === "MANAGER") return "Manager Dashboard";
    if (role === "SUPER_ADMIN") return "Super Admin View";
    return "Reception Dashboard";
  }, [role]);

  const welcomeMessage = useMemo(() => {
    if (role === "MANAGER") {
      return `Hello ${username}, as a Manager you can manage all guest records and view user audit logs.`;
    }
    if (role === "SUPER_ADMIN") {
      return `Hello ${username}, you are logged in as SUPER_ADMIN. Use the Super Admin dashboard to manage hotels and create manager accounts.`;
    }
    return `Hello ${username}, as a Receptionist you can check in/out guests and update guest details.`;
  }, [role, username]);

  const fetchGuests = useCallback(async () => {
    if (!canSeeGuests) return;

    setGuestsLoading(true);
    try {
      const res = await api.get("/guests", {
        headers: { "X-User-Role": role, "X-Hotel-Code": hotelCode },
      });
      setGuests(res.data || []);
    } catch (err) {
      console.error("Failed to fetch guests:", err);
      notify.error("Failed to fetch guests.");
    } finally {
      setGuestsLoading(false);
    }
  }, [canSeeGuests, role, hotelCode]);

  const closeReceipt = useCallback(() => {
    setShowReceipt(false);
    setReceipt(null);
    setReceiptLoading(false);
  }, []);

  useEffect(() => {
    if (!showReceipt) return;

    document.body.classList.add("modal-open");
    const onKeyDown = (e) => e.key === "Escape" && closeReceipt();
    window.addEventListener("keydown", onKeyDown);

    setTimeout(() => receiptCloseBtnRef.current?.focus(), 0);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [showReceipt, closeReceipt]);

  const fetchReceipt = useCallback(
    async (guestId) => {
      if (!guestId) return;

      try {
        setShowReceipt(true);
        setReceiptLoading(true);
        setReceipt(null);

        const res = await api.get(`/checkout/${guestId}/receipt`, {
          headers: { "X-User-Role": role, "X-Hotel-Code": hotelCode },
        });

        setReceipt(res.data);
      } catch (err) {
        console.error("Failed to fetch receipt:", err);
        const msg = err?.response?.data || "Failed to fetch receipt. Check backend logs.";
        notify.error(typeof msg === "string" ? msg : "Failed to fetch receipt.");
        closeReceipt();
      } finally {
        setReceiptLoading(false);
      }
    },
    [role, hotelCode, closeReceipt]
  );

  const handleCheckoutSuccess = useCallback(
    async (guestId) => {
      await fetchReceipt(guestId);
      await fetchGuests();
    },
    [fetchReceipt, fetchGuests]
  );

  useEffect(() => {
    if (canSeeGuests) fetchGuests();
  }, [canSeeGuests, fetchGuests]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  // ✅ KPI selection: update filter + smooth-scroll to table
  const handleKpiSelect = useCallback((next) => {
    setKpiFilter(next);
    const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    window.requestAnimationFrame(() => {
      guestListRef.current?.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
  }, []);

  const handlePrint = () => window.print();

  const handleDownloadPDF = () => {
    if (!receipt) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Lodge Checkout Receipt", 10, 20);

    doc.setFontSize(12);
    let y = 35;

    const addLine = (label, value) => {
      doc.text(`${label}: ${value ?? ""}`, 10, y);
      y += 8;
    };

    addLine("Customer", receipt.fullName);
    addLine("Payment Type", receipt.paymentType);
    addLine("Days Stayed", String(receipt.daysStayed ?? ""));
    addLine("Base Amount", `GH₵ ${receipt.baseAmount ?? ""}`);
    addLine("Late Checkout Fee", `GH₵ ${receipt.lateCheckoutFee ?? ""}`);
    addLine("Total Payment", `GH₵ ${receipt.totalPayment ?? ""}`);

    y += 5;
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 10, y);

    const safeName = (receipt.fullName || "customer").replace(/\s+/g, "_");
    doc.save(`receipt_${safeName}.pdf`);
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
        <div className="container-fluid">
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <img src="/logo.gif" alt="Logo" style={{ width: 30, height: 30, marginRight: 10 }} />
            <span className="fw-semibold">{dashboardTitle}</span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#mainNavbar"
            aria-controls="mainNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className="collapse navbar-collapse" id="mainNavbar">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <button type="button" className="btn btn-sm btn-outline-light" onClick={toggleTheme}>
                  {theme === "light" ? "🌙 Dark" : "☀ Light"}
                </button>
              </li>

              <li className="nav-item dropdown">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-light dropdown-toggle"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  {username || "User"} <span className="opacity-75">({role || "UNKNOWN"})</span>
                </button>

                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <span className="dropdown-item-text small text-muted">Hotel: {hotelCode || "N/A"}</span>
                  </li>
                  <li><Link className="dropdown-item" to="/">Dashboard</Link></li>

                  {role === "SUPER_ADMIN" && (
                    <li><Link className="dropdown-item" to="/super-admin">Super Admin</Link></li>
                  )}

                  <li>
                    <Link className="dropdown-item" to="/first-login-change-password">
                      Change Password
                    </Link>
                  </li>

                  {(role === "MANAGER" || role === "SUPER_ADMIN") && (
                    <li><Link className="dropdown-item" to="/register">Register User</Link></li>
                  )}

                  <li><hr className="dropdown-divider" /></li>
                  <li>
                    <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </li>

            </ul>
          </div>
        </div>
      </nav>

      <div className="dashboard-shell">
        <div className="container mt-4">
        <div className="alert alert-info">{welcomeMessage}</div>

        {role === "MANAGER" && (
          <ul className="nav nav-tabs mb-3">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "guests" ? "active" : ""}`} type="button" onClick={() => setActiveTab("guests")}>
                Guests
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === "audit" ? "active" : ""}`} type="button" onClick={() => setActiveTab("audit")}>
                User Audit Logs
              </button>
            </li>
          </ul>
        )}

        {role === "SUPER_ADMIN" && (
          <div className="alert alert-warning">
            This view is read-only for SUPER_ADMIN. Use the{" "}
            <Link to="/super-admin">Super Admin dashboard</Link> to manage hotels and create manager accounts.
          </div>
        )}

        {canSeeGuests && (role !== "MANAGER" || activeTab === "guests") && (
          <>
            {role === "MANAGER" && (
              <>
                <ManagerKpiCards
                  guests={guests}
                  loading={guestsLoading}
                  selected={kpiFilter}
                  onSelect={handleKpiSelect}
                />
                <ManagerDashboardCharts guests={guests} />
              </>
            )}

            <div className="dashboard-card mb-3">
              <div className="dashboard-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex flex-column">
                  <span className="fw-semibold">Guests</span>
                  <small className="text-muted">Search, manage, and checkout guests</small>
                </div>

                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className={"btn btn-sm " + (compact ? "btn-primary" : "btn-outline-primary")}
                    onClick={() => setCompact((v) => !v)}
                    title="Toggle compact table rows"
                  >
                    {compact ? "Compact: ON" : "Compact: OFF"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={fetchGuests}
                    title="Refresh guests"
                    disabled={guestsLoading}
                  >
                    {guestsLoading ? "Refreshing..." : "Refresh"}
                  </button>
                </div>
              </div>

              <div className="dashboard-card-body">
                <input
                  type="text"
                  className="form-control dashboard-input"
                  placeholder="Search guests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <GuestForm refresh={fetchGuests} editingGuest={editingGuest} setEditingGuest={setEditingGuest} />
              </div>

              <div className="col-md-8">
                <div ref={guestListRef} style={{ scrollMarginTop: 90 }} />

                <GuestList
                  guests={guests}
                  role={role}
                  onEdit={(guest) => setEditingGuest(guest)}
                  onRefresh={fetchGuests}
                  search={search}
                  onReceipt={handleCheckoutSuccess}
                  compact={compact}
                  loading={guestsLoading}
                  kpiFilter={kpiFilter}
                />
              </div>
            </div>
          </>
        )}

        {role === "MANAGER" && activeTab === "audit" && (
          <div className="mt-3">
            <AuditLogTable />
          </div>
        )}
        </div>
      </div>

      {showReceipt && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          role="dialog"
          aria-modal="true"
          onClick={closeReceipt}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content receipt-modal">
              <div className="modal-header">
                <div className="d-flex align-items-center justify-content-between w-100 pe-5">
                  <div>
                    <h5 className="modal-title mb-0">Checkout Receipt</h5>
                    <small className="text-muted">Lodge Management System</small>
                  </div>

                  {receipt && !receiptLoading && (
                    <span className="badge rounded-pill receipt-badge-paid">PAID</span>
                  )}
                </div>

                <button
                  ref={receiptCloseBtnRef}
                  type="button"
                  className="btn-close"
                  onClick={closeReceipt}
                  aria-label="Close"
                />
              </div>

              <div className="modal-body">
                {(() => {
                  const money = (n) => {
                    const v = Number(n ?? 0);
                    return Number.isFinite(v) ? v.toFixed(2) : "0.00";
                  };

                  const generatedAt =
                    receipt?.generatedAt
                      ? new Date(receipt.generatedAt).toLocaleString()
                      : new Date().toLocaleString();

                  if (receiptLoading) {
                    return (
                      <div className="receipt-skeleton" aria-busy="true">
                        <div className="sk-line sk-title" />
                        <div className="sk-line sk-row" />
                        <div className="sk-line sk-row" />
                        <div className="sk-line sk-row" />
                        <div className="sk-line sk-total" />
                        <div className="sk-shine" />
                      </div>
                    );
                  }

                  if (!receipt) return <div className="text-muted">No receipt data.</div>;

                  return (
                    <div className="receipt-card">
                      <div className="receipt-top">
                        <div className="receipt-customer">
                          <div className="receipt-label">Customer</div>
                          <div className="receipt-value">{receipt.fullName || "-"}</div>
                        </div>

                        <div className="receipt-meta">
                          <div className="receipt-meta-item">
                            <div className="receipt-label">Payment</div>
                            <div className="receipt-value">{receipt.paymentType || "-"}</div>
                          </div>
                          <div className="receipt-meta-item">
                            <div className="receipt-label">Days Stayed</div>
                            <div className="receipt-value">{receipt.daysStayed ?? "-"}</div>
                          </div>
                        </div>
                      </div>

                      <div className="receipt-divider" />

                      <div className="receipt-lines">
                        <div className="receipt-line">
                          <span className="receipt-line__label">Base Amount</span>
                          <span className="receipt-line__value">GH₵ {money(receipt.baseAmount)}</span>
                        </div>

                        <div className="receipt-line">
                          <span className="receipt-line__label">Late Checkout Fee</span>
                          <span className="receipt-line__value">GH₵ {money(receipt.lateCheckoutFee)}</span>
                        </div>
                      </div>

                      <div className="receipt-divider" />

                      <div className="receipt-total">
                        <div>
                          <div className="receipt-label">Total</div>
                          <div className="receipt-total__value">
                            GH₵ {money(receipt.totalPayment)}
                          </div>
                        </div>

                        <span className="badge rounded-pill receipt-badge-paid">PAID</span>
                      </div>

                      <div className="receipt-footer-note text-muted">
                        Generated on: {generatedAt}
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="modal-footer">
                <button
                  onClick={handleDownloadPDF}
                  className="btn btn-outline-primary"
                  disabled={!receipt || receiptLoading}
                >
                  Download PDF
                </button>

                <button
                  onClick={handlePrint}
                  className="btn btn-primary"
                  disabled={!receipt || receiptLoading}
                >
                  Print Receipt
                </button>

                <button type="button" className="btn btn-secondary" onClick={closeReceipt}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="bg-dark text-white text-center py-3 mt-4">
        Lodge Management System © 2025
      </footer>
    </>
  );
}

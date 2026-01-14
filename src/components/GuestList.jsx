// src/components/GuestList.jsx
import React, { useMemo, useState, useEffect } from "react";
import CheckoutForm from "./CheckoutForm";
import api from "../api";
import { notify } from "../utils/notify";

export default function GuestList({
  guests = [],
  role = "",
  onEdit,
  onRefresh,
  search,
  onReceipt,
  compact = false,
  loading = false,
  kpiFilter = "ALL",
}) {
  const [deletingId, setDeletingId] = useState(null);

  // ✅ keep your existing filter pulse
  const [filterPulse, setFilterPulse] = useState(false);
  useEffect(() => {
    setFilterPulse(true);
    const t = setTimeout(() => setFilterPulse(false), 260);
    return () => clearTimeout(t);
  }, [kpiFilter, search]);

  const hotelCode = (localStorage.getItem("hotelCode") || "").trim().toUpperCase();
  const username = (localStorage.getItem("username") || "").trim();

  const roleUpper = String(role || "").toUpperCase();
  const isManager = roleUpper === "MANAGER";
  const isReception = roleUpper === "RECEPTION";
  const isSuperAdmin = roleUpper === "SUPER_ADMIN";

  // ✅ NEW: store fetched hotel daily rate (SUPER_ADMIN only)
  const [hotelDailyRate, setHotelDailyRate] = useState(null);

  // ✅ helpers
  const money = (n) => (n == null || n === "" ? 0 : Number(n) || 0);

  const toDate = (ts) => {
    if (!ts) return null;

    // if backend sends "2026-01-13 18:00:00", convert to ISO-like "2026-01-13T18:00:00"
    const safe = String(ts).includes("T") ? String(ts) : String(ts).replace(" ", "T");
    const d = new Date(safe);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const isToday = (ts) => {
    const d = toDate(ts);
    if (!d) return false;
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // ✅ Option B: fetch hotels only if SUPER_ADMIN, then match by hotelCode
  useEffect(() => {
    let cancelled = false;

    const loadHotelRate = async () => {
      if (!isSuperAdmin || !hotelCode) {
        setHotelDailyRate(null);
        return;
      }

      try {
        const res = await api.get("/admin/hotels", {
          headers: {
            "X-User-Role": "SUPER_ADMIN",
            ...(username ? { "X-Username": username } : {}),
            ...(hotelCode ? { "X-Hotel-Code": hotelCode } : {}),
          },
        });

        const hotels = Array.isArray(res.data) ? res.data : [];
        const match = hotels.find(
          (h) => String(h.code || "").trim().toUpperCase() === hotelCode
        );

        const rate =
          match && match.dailyRate != null && !Number.isNaN(Number(match.dailyRate))
            ? Number(match.dailyRate)
            : null;

        if (!cancelled) setHotelDailyRate(rate);
      } catch (e) {
        console.warn("Failed to load hotels for rate:", e?.response?.status, e?.message);
        if (!cancelled) setHotelDailyRate(null);
      }
    };

    loadHotelRate();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, hotelCode, username]);

  const handleDelete = async (id) => {
    if (!id || deletingId) return;

    const ok = window.confirm("Are you sure you want to delete this guest?");
    if (!ok) return;

    setDeletingId(id);
    const toastId = notify.loading("Deleting guest...");

    try {
      await api.delete(`/guests/${id}`, {
        headers: {
          "X-User-Role": roleUpper || "MANAGER",
          "X-Hotel-Code": hotelCode,
          ...(username ? { "X-Username": username } : {}),
        },
      });

      notify.updateSuccess(toastId, "Guest deleted");
      await onRefresh?.();
    } catch (err) {
      console.error("Delete failed:", err);

      // your backend uses: { message: "..." }
      const msg =
        err?.response?.data?.message ||
        err?.response?.data ||
        "Failed to delete guest. Check permissions / server logs.";

      notify.updateError(toastId, typeof msg === "string" ? msg : "Failed to delete guest");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredGuests = useMemo(() => {
    const q = (search || "").toLowerCase().trim();
    let base = guests || [];

    if (kpiFilter === "ACTIVE") {
      base = base.filter((g) => !g.checkOutTime);
    } else if (kpiFilter === "CHECKOUTS_TODAY" || kpiFilter === "REVENUE_TODAY") {
      base = base.filter((g) => isToday(g.checkOutTime));
    } else if (kpiFilter === "LATE_FEES_TODAY") {
      base = base.filter((g) => isToday(g.checkOutTime) && money(g.lateCheckoutFee) > 0);
    }

    if (!q) return base;

    return base.filter((g) =>
      `${g.firstName || ""} ${g.lastName || ""} ${g.email || ""} ${g.phone || ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [guests, search, kpiFilter]);

  const maskId = (idNumber) => {
    if (!idNumber || String(idNumber).length < 4) return "-";
    const last4 = String(idNumber).slice(-4);
    return `****${last4}`;
  };

  const fmtDate = (ts) => {
    const d = toDate(ts);
    return d ? d.toLocaleString() : "N/A";
  };

  return (
    <div className={"dashboard-card " + (filterPulse ? "guestlist--anim" : "")}>
      <div className="dashboard-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex flex-column">
          <span className="fw-semibold">Guest List</span>
          <small className="text-muted">
            Showing <strong>{filteredGuests.length}</strong> of <strong>{guests.length}</strong>
            {kpiFilter !== "ALL" && (
              <>
                {" "}
                • Filter: <strong>{kpiFilter}</strong>
              </>
            )}
          </small>
        </div>

        <div className="d-flex gap-2 flex-wrap align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => onRefresh?.()}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>

          <span className="dashboard-pill">
            Role: <strong>{roleUpper || "UNKNOWN"}</strong>
          </span>

          {!!hotelCode && (
            <span className="dashboard-pill" title="Current hotel code">
              Hotel: <strong>{hotelCode}</strong>
            </span>
          )}

          {compact && (
            <span className="dashboard-pill" title="Compact mode is ON">
              Compact
            </span>
          )}
        </div>
      </div>

      <div className="px-3 pt-2 d-md-none text-muted small">
        Swipe left/right to see more columns →
      </div>

      <div className="dashboard-card-body p-0">
        <div className="table-responsive guest-table-wrap">
          <table
            className={
              "table align-middle mb-0 guest-table table-striped " +
              (compact ? "guest-table--compact" : "")
            }
          >
            <thead>
              <tr>
                <th className="sticky-first">First</th>
                <th>Last</th>
                <th>Email</th>
                <th>Phone</th>
                <th>ID (Last 4)</th>
                <th>ID Status</th>
                <th>Stay Days</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Payment Type</th>
                <th>Amount</th>
                <th>Late Fee</th>
                <th className="sticky-actions sticky-actions--head" style={{ minWidth: 240 }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <TableSkeletonRows rows={6} cols={13} />
              ) : filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-4 text-muted">
                    No guests found.
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest.id} className="lift-row">
                    <td className="fw-semibold sticky-first">{guest.firstName || "-"}</td>
                    <td className="fw-semibold">{guest.lastName || "-"}</td>
                    <td style={{ maxWidth: 220, wordBreak: "break-word" }}>{guest.email || "-"}</td>
                    <td>{guest.phone || "-"}</td>
                    <td className="text-monospace">{maskId(guest.idNumber)}</td>

                    <td>
                      {guest.idVerified ? (
                        <span className="badge rounded-pill bg-success">Verified</span>
                      ) : guest.idNumber ? (
                        <span className="badge rounded-pill bg-warning text-dark">Not Verified</span>
                      ) : (
                        <span className="badge rounded-pill bg-secondary">No ID</span>
                      )}
                    </td>

                    <td>{guest.stayDays ?? "-"}</td>

                    <td>{guest.checkInTime ? fmtDate(guest.checkInTime) : "N/A"}</td>
                    <td>{guest.checkOutTime ? fmtDate(guest.checkOutTime) : "Pending"}</td>

                    <td>{guest.paymentType || "-"}</td>
                    <td>{guest.paymentAmount != null ? Number(guest.paymentAmount).toFixed(2) : "-"}</td>
                    <td>
                      {guest.lateCheckoutFee != null ? Number(guest.lateCheckoutFee).toFixed(2) : "-"}
                    </td>

                    <td className="sticky-actions sticky-actions--cell">
                      <div
                        className={
                          "d-flex gap-2 flex-wrap justify-content-end " +
                          (compact ? "table-actions-compact" : "")
                        }
                      >
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-warning"
                          onClick={() => onEdit?.(guest)}
                        >
                          Edit
                        </button>

                        {!guest.checkOutTime && (isManager || isReception) && (
                          <CheckoutForm
                            guest={{
                              ...guest,
                              // ✅ ensure checkout has hotel code even if DTO doesn't include guest.hotel
                              hotel: guest.hotel || { code: hotelCode },
                            }}
                            refresh={onRefresh}
                            role={roleUpper}
                            onCheckoutSuccess={onReceipt}
                            hotelDailyRate={hotelDailyRate}
                          />
                        )}

                        {guest.checkOutTime && onReceipt && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            onClick={() => onReceipt?.(guest.id)}
                          >
                            Receipt
                          </button>
                        )}

                        {isManager && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(guest.id)}
                            disabled={deletingId === guest.id}
                          >
                            {deletingId === guest.id ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filterPulse && <div className="guestlist-filterveil" aria-hidden="true" />}
        </div>
      </div>
    </div>
  );
}

function TableSkeletonRows({ rows = 6, cols = 13 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="guest-row-skel">
          {Array.from({ length: cols }).map((__, c) => (
            <td key={c}>
              <div className="table-skel__line" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

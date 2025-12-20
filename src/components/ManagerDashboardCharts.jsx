// src/components/ManagerDashboardCharts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";

const toDate = (ts) => {
  if (!ts) return null;
  const d = new Date(ts);
  if (!Number.isNaN(d.getTime())) return d;
  const d2 = new Date(String(ts).replace(" ", "T"));
  if (!Number.isNaN(d2.getTime())) return d2;
  return null;
};

const dayKey = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const money = (n) => {
  const v = Number(n ?? 0);
  return Number.isFinite(v) ? v : 0;
};

export default function ManagerDashboardCharts({ guests = [] }) {
  const theme = localStorage.getItem("theme") || "light";
  const isDark = theme === "dark";
  const hotelCode = localStorage.getItem("hotelCode") || "";

  const containerRef = useRef(null);
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const t = setTimeout(() => setChartKey((k) => k + 1), 0);
    const ro = new ResizeObserver(() => setChartKey((k) => k + 1));
    ro.observe(el);

    return () => {
      clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  const computed = useMemo(() => {
    const all = guests || [];

    const active = all.filter((g) => !!g?.checkInTime && !g?.checkOutTime);
    const checkedOut = all.filter((g) => !!g?.checkOutTime);

    const revenueTotal = checkedOut.reduce(
      (sum, g) => sum + money(g.paymentAmount) + money(g.lateCheckoutFee),
      0
    );

    const byDay = new Map();
    for (const g of checkedOut) {
      const d = toDate(g.checkOutTime);
      if (!d) continue;
      const k = dayKey(d);
      const amt = money(g.paymentAmount) + money(g.lateCheckoutFee);
      byDay.set(k, (byDay.get(k) || 0) + amt);
    }

    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const k = dayKey(d);
      days.push({
        day: k.slice(5),
        revenue: Number((byDay.get(k) || 0).toFixed(2)),
      });
    }

    const revenue14d = days.reduce((s, x) => s + money(x.revenue), 0);

    const payCounts = new Map();
    for (const g of checkedOut) {
      const t = String(g.paymentType || "UNKNOWN").toUpperCase();
      payCounts.set(t, (payCounts.get(t) || 0) + 1);
    }
    const paymentData = Array.from(payCounts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const occupancyRate = all.length ? (active.length / all.length) * 100 : 0;

    return {
      totalGuests: all.length,
      activeGuests: active.length,
      checkedOutGuests: checkedOut.length,
      revenueTotal: Number(revenueTotal.toFixed(2)),
      revenue14d: Number(revenue14d.toFixed(2)),
      occupancyRate: Number(occupancyRate.toFixed(1)),
      revenueSeries: days,
      paymentData,
      paymentTotal: paymentData.reduce((s, p) => s + p.value, 0),
    };
  }, [guests]);

  const axisStroke = isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)";
  const gridStroke = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const tooltipBg = isDark ? "#111827" : "#ffffff";
  const tooltipBorder = isDark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)";
  const tooltipText = isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.85)";

  const donutColors = [
    "#0d6efd",
    "#198754",
    "#ffc107",
    "#dc3545",
    "#6f42c1",
    "#20c997",
    "#0dcaf0",
    "#adb5bd",
  ];

  const hasRevenue14d = computed.revenueSeries.some((d) => money(d.revenue) > 0);
  const hasPayments = computed.paymentData.length > 0;

  return (
    <div className="insights-wrap mb-3" ref={containerRef}>
      <div className="insights-toolbar">
        <div className="insights-toolbar__left">
          <div className="insights-title">Manager Insights</div>
          <div className="insights-sub">Revenue + operations overview</div>
        </div>

        <div className="insights-toolbar__right">
          <span className="chip">
            Hotel: <strong>{hotelCode || "N/A"}</strong>
          </span>
          <span className="chip">
            Revenue: <strong>GH₵ {computed.revenueTotal.toFixed(2)}</strong>
          </span>
          <span className="chip">
            Occupancy: <strong>{computed.occupancyRate.toFixed(1)}%</strong>
          </span>
          <button type="button" className="btn btn-sm btn-outline-secondary" disabled>
            Last 14 days
          </button>
        </div>
      </div>

      <div className="dashboard-card-body">
        <div className="row g-3 mb-3">
          <div className="col-md-4">
            <div className="stat-chip">
              <span className="stat-chip__label">Total Guests</span>
              <strong className="stat-chip__value">{computed.totalGuests}</strong>
            </div>
          </div>

          <div className="col-md-4">
            <div className="stat-chip">
              <span className="stat-chip__label">Active Guests</span>
              <strong className="stat-chip__value">{computed.activeGuests}</strong>
            </div>
          </div>

          <div className="col-md-4">
            <div className="stat-chip">
              <span className="stat-chip__label">Checked Out</span>
              <strong className="stat-chip__value">{computed.checkedOutGuests}</strong>
            </div>
          </div>
        </div>

        <div className="row g-3">
          <div className="col-lg-7">
            <div className="panel">
              <div className="panel__head">Revenue (last 14 days)</div>
              <div className="panel__body" style={{ height: 300 }}>
                {!hasRevenue14d ? (
                  <div className="empty-callout" role="status" aria-live="polite">
                    <div className="empty-callout__icon" aria-hidden="true">📉</div>
                    <div>
                      <div className="empty-callout__title">No revenue in the last 14 days</div>
                      <div className="empty-callout__sub">
                        Once guests check out, revenue will appear here automatically.
                      </div>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer key={chartKey} width="100%" height="100%">
                    <LineChart data={computed.revenueSeries}>
                      <CartesianGrid stroke={gridStroke} strokeDasharray="4 4" />
                      <XAxis dataKey="day" stroke={axisStroke} />
                      <YAxis stroke={axisStroke} />
                      <Tooltip
                        contentStyle={{
                          background: tooltipBg,
                          border: `1px solid ${tooltipBorder}`,
                          color: tooltipText,
                          borderRadius: 12,
                        }}
                        formatter={(v) => [`GH₵ ${Number(v).toFixed(2)}`, "Revenue"]}
                      />
                      <Line type="monotone" dataKey="revenue" stroke="#0d6efd" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="panel">
              <div className="panel__head d-flex justify-content-between align-items-center">
                <span>Payment Types</span>
                <small className="text-muted">(checked-out guests)</small>
              </div>

              <div className="panel__body" style={{ minHeight: 300 }}>
                {!hasPayments ? (
                  <div className="empty-callout" role="status" aria-live="polite">
                    <div className="empty-callout__icon" aria-hidden="true">🧾</div>
                    <div>
                      <div className="empty-callout__title">No payments yet</div>
                      <div className="empty-callout__sub">
                        Complete a checkout to populate the payment breakdown.
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ width: "100%", height: 210 }}>
                      <ResponsiveContainer key={chartKey + 1} width="100%" height="100%">
                        <PieChart>
                          <Tooltip
                            contentStyle={{
                              background: tooltipBg,
                              border: `1px solid ${tooltipBorder}`,
                              color: tooltipText,
                              borderRadius: 12,
                            }}
                          />

                          <Pie
                            data={computed.paymentData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={95}
                            paddingAngle={2}
                            stroke="transparent"
                          >
                            {computed.paymentData.map((_, idx) => (
                              <Cell key={idx} fill={donutColors[idx % donutColors.length]} />
                            ))}
                          </Pie>

                          <text
                            x="50%"
                            y="47%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={isDark ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.88)"}
                            style={{ fontSize: 20, fontWeight: 900 }}
                          >
                            {computed.paymentTotal}
                          </text>
                          <text
                            x="50%"
                            y="59%"
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill={isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)"}
                            style={{ fontSize: 12, fontWeight: 700 }}
                          >
                            total checkouts
                          </text>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="donut-legend">
                      {computed.paymentData.slice(0, 8).map((p, idx) => (
                        <div key={p.name} className="donut-legend__item">
                          <span
                            className="donut-legend__dot"
                            style={{ background: donutColors[idx % donutColors.length] }}
                            aria-hidden="true"
                          />
                          <span className="donut-legend__name">{p.name}</span>
                          <span className="donut-legend__val">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

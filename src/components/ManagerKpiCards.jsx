import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * Filters supported:
 *  ALL | ACTIVE | CHECKOUTS_TODAY | REVENUE_TODAY | LATE_FEES_TODAY
 */
export default function ManagerKpiCards({
  guests = [],
  loading = false,
  selected = "ALL",
  onSelect,
}) {
  const [pulse, setPulse] = useState(false);
  const lastSelectedRef = useRef(selected);

  useEffect(() => {
    if (lastSelectedRef.current !== selected) {
      setPulse(true);
      lastSelectedRef.current = selected;
      const t = setTimeout(() => setPulse(false), 220);
      return () => clearTimeout(t);
    }
  }, [selected]);

  const metrics = useMemo(() => {
    const all = guests || [];

    const toDate = (ts) => {
      if (!ts) return null;
      const d = new Date(String(ts).replace(" ", "T"));
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

    const money = (n) => (n == null || n === "" ? 0 : Number(n) || 0);

    const activeGuests = all.filter((g) => !g.checkOutTime);
    const checkoutsToday = all.filter((g) => isToday(g.checkOutTime));

    // ✅ Revenue today includes late fees
    const revenueToday = checkoutsToday.reduce(
      (sum, g) => sum + money(g.paymentAmount) + money(g.lateCheckoutFee),
      0
    );

    const lateFeesToday = checkoutsToday.reduce(
      (sum, g) => sum + money(g.lateCheckoutFee),
      0
    );

    const occupancyRate = all.length ? (activeGuests.length / all.length) * 100 : 0;

    return {
      activeGuests: activeGuests.length,
      checkoutsToday: checkoutsToday.length,
      revenueToday: Number(revenueToday.toFixed(2)),
      lateFeesToday: Number(lateFeesToday.toFixed(2)),
      occupancyRate: Number(occupancyRate.toFixed(1)),
    };
  }, [guests]);

  // ✅ Premium count-ups (fast/subtle)
  const activeGuestsN = useCountUp(metrics.activeGuests, {
    duration: 360,
    decimals: 0,
    disabled: loading,
  });
  const checkoutsTodayN = useCountUp(metrics.checkoutsToday, {
    duration: 360,
    decimals: 0,
    disabled: loading,
  });
  const revenueTodayN = useCountUp(metrics.revenueToday, {
    duration: 420,
    decimals: 2,
    disabled: loading,
  });
  const lateFeesTodayN = useCountUp(metrics.lateFeesToday, {
    duration: 420,
    decimals: 2,
    disabled: loading,
  });
  const occupancyRateN = useCountUp(metrics.occupancyRate, {
    duration: 420,
    decimals: 1,
    disabled: loading,
  });

  const toggle = (key) => onSelect?.(selected === key ? "ALL" : key);

  const Card = ({ title, value, icon, active, onClick, subtitle, hint }) => (
    <button
      type="button"
      className={
        "kpi-card" +
        (active ? " kpi-card--active" : "") +
        (!loading ? " kpi-card--interactive" : "")
      }
      onClick={loading ? undefined : onClick}
      aria-pressed={active ? "true" : "false"}
      title={hint || ""}
    >
      <div className="kpi-card__top">
        <div className="kpi-card__title">
          <span className="kpi-card__icon" aria-hidden="true">
            {icon}
          </span>
          {title}
        </div>
        <div className="kpi-card__value">{value}</div>
      </div>

      {subtitle && <div className="kpi-card__subtitle">{subtitle}</div>}
    </button>
  );

  return (
    <div className="dashboard-card mb-3">
      <div className="dashboard-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex flex-column">
          <span className="fw-semibold">Today’s KPIs</span>
          <small className="text-muted">Click a card to filter the guest table</small>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          <span className="dashboard-pill">
            Filter: <strong>{selected}</strong>
          </span>
        </div>
      </div>

      <div className="dashboard-card-body">
        <div className={"row g-3 kpi-row " + (pulse ? "kpi-row--pulse" : "")}>
          {/* 1) Active Guests */}
          <div className="col-12 col-sm-6 col-lg-3">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <Card
                title="Active Guests"
                icon="👥"
                value={activeGuestsN}
                active={selected === "ACTIVE"}
                onClick={() => toggle("ACTIVE")}
                hint="Show guests not checked out"
              />
            )}
          </div>

          {/* 2) Revenue Today (filters to today checkouts) */}
          <div className="col-12 col-sm-6 col-lg-3">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <Card
                title="Revenue Today"
                icon="💰"
                value={`GH₵ ${revenueTodayN}`}
                active={selected === "REVENUE_TODAY"}
                onClick={() => toggle("REVENUE_TODAY")}
                subtitle={`Late fees: GH₵ ${lateFeesTodayN}`}
                hint="Filters to guests checked out today (revenue includes late fees)"
              />
            )}
          </div>

          {/* 3) Occupancy Rate (informational; clicking resets filter to ALL) */}
          <div className="col-12 col-sm-6 col-lg-3">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <Card
                title="Occupancy Rate"
                icon="🏨"
                value={`${occupancyRateN}%`}
                active={selected === "ALL"} // show as “neutral” active state when no filter
                onClick={() => onSelect?.("ALL")}
                hint="Active guests / total guests"
              />
            )}
          </div>

          {/* 4) Checked Out Today (filters to today checkouts) */}
          <div className="col-12 col-sm-6 col-lg-3">
            {loading ? (
              <KpiSkeleton />
            ) : (
              <Card
                title="Checked Out Today"
                icon="📈"
                value={checkoutsTodayN}
                active={selected === "CHECKOUTS_TODAY"}
                onClick={() => toggle("CHECKOUTS_TODAY")}
                hint="Show guests checked out today"
              />
            )}
          </div>

          {/* Optional: If you still want a Late Fees Today KPI instead of Checkouts Today,
              swap this last card's content to LATE_FEES_TODAY.
              But per your spec: 4 cards → this set matches exactly. */}
        </div>
      </div>
    </div>
  );
}

function KpiSkeleton() {
  return (
    <div className="kpi-card kpi-card--skeleton" aria-busy="true">
      <div className="kpi-skel__line kpi-skel__line--title" />
      <div className="kpi-skel__line kpi-skel__line--value" />
      <div className="kpi-skel__line kpi-skel__line--sub" />
      <div className="kpi-skel__shine" />
    </div>
  );
}

/**
 * useCountUp
 * - lightweight + no deps
 * - respects prefers-reduced-motion
 */
function useCountUp(target, { duration = 400, decimals = 0, disabled = false } = {}) {
  const [value, setValue] = useState(() => Number(target || 0));
  const rafRef = useRef(null);
  const prevRef = useRef(Number(target || 0));

  useEffect(() => {
    if (disabled) {
      prevRef.current = Number(target || 0);
      setValue(Number(target || 0));
      return;
    }

    const prefersReduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

    const next = Number(target || 0);

    if (prefersReduced) {
      prevRef.current = next;
      setValue(next);
      return;
    }

    const from = prevRef.current;
    const to = next;

    if (from === to) {
      setValue(to);
      return;
    }

    const start = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const tick = (now) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      const current = from + (to - from) * eased;

      setValue(current);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
        setValue(to);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration, disabled]);

  return Number(value).toFixed(decimals);
}

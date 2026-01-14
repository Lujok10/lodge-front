// src/components/CheckoutForm.jsx
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../utils/apiError";

/**
 * NO hardcoded pricing in frontend.
 * Backend is source of truth for totals and late fees.
 *
 * Optional estimate: pass `hotelDailyRate` from parent (Option B).
 */
export default function CheckoutForm({
  guest,
  refresh,
  role,
  onCheckoutSuccess,
  hotelDailyRate, // optional prop: number | string
}) {
  const [paymentType, setPaymentType] = useState("CASH");
  const [idLast4, setIdLast4] = useState("");
  const [adminOverride, setAdminOverride] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const openBtnRef = useRef(null);
  const inputRef = useRef(null);

  const isSuperAdmin = String(role || "").toUpperCase() === "SUPER_ADMIN";

  const summary = useMemo(() => {
    if (!guest?.checkInTime) return null;

    const checkIn = dayjs(guest.checkInTime);
    const now = dayjs();

    let daysStayed = now.diff(checkIn, "day");
    if (daysStayed <= 0) daysStayed = 1;

    const hasFinal = guest?.paymentAmount != null;

    const finalTotal = hasFinal ? Number(guest.paymentAmount) : null;
    const finalLateFee = hasFinal ? Number(guest.lateCheckoutFee || 0) : null;

    const rate = hotelDailyRate != null ? Number(hotelDailyRate) : null;
    const canEstimate = rate != null && !Number.isNaN(rate);

    const estimatedBase = !hasFinal && canEstimate ? rate * daysStayed : null;

    return {
      daysStayed,
      dailyRate: canEstimate ? rate : null,
      estimatedBase,
      finalLateFee,
      finalTotal,
      final: hasFinal,
    };
  }, [guest?.checkInTime, guest?.paymentAmount, guest?.lateCheckoutFee, hotelDailyRate]);

  const closeCheckoutModal = () => {
    if (loading) return;
    setShowModal(false);
  };

  // modal behavior: lock scroll + ESC close + focus input
  useEffect(() => {
    if (!showModal) return;

    document.body.classList.add("modal-open");

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeCheckoutModal();
    };
    window.addEventListener("keydown", onKeyDown);

    const t = setTimeout(() => {
      if (!(isSuperAdmin && adminOverride)) inputRef.current?.focus();
    }, 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
      setTimeout(() => openBtnRef.current?.focus(), 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, adminOverride, isSuperAdmin]);

  const handleCheckout = async () => {
    if (!summary) {
      toast.error("Cannot checkout: missing check-in time.");
      return;
    }

    const override = isSuperAdmin && adminOverride;

    if (!override) {
      if (!guest?.idNumber || String(guest.idNumber).trim().length < 4) {
        toast.error(
          "This guest has no valid ID recorded. Please update the guest with an ID before checkout."
        );
        return;
      }

      const last4 = (idLast4 || "").trim();
      if (last4.length !== 4) {
        toast.error("Please enter the last 4 digits of the guest's ID.");
        return;
      }
    }

    if (override) {
      const ok = window.confirm(
        "Admin Override: This will checkout the guest WITHOUT ID verification. This action will be audited. Continue?"
      );
      if (!ok) return;
    }

    setLoading(true);
    const toastId = toast.loading(
      override ? "Checking out (override)..." : "Checking out guest..."
    );

    try {
      const payload = override
        ? { paymentType }
        : { paymentType, idNumber: (idLast4 || "").trim() };

      await api.post(`/guests/checkout/${guest.id}`, payload, {
        headers: {
          "X-User-Role": role || "MANAGER",
          "X-Hotel-Code": guest?.hotel?.code, // ensure DTO includes hotel.code
          ...(override ? { "X-Admin-Override": "true" } : {}),
        },
      });

      toast.success("Checkout completed", { id: toastId });

      setShowModal(false);
      setIdLast4("");
      setAdminOverride(false);

      if (onCheckoutSuccess) {
        await onCheckoutSuccess(guest.id);
      }

      await refresh?.();
    } catch (err) {
      console.error("Checkout failed:", err);

      const status = err?.response?.status;
      const msg = getApiErrorMessage(err, "Checkout failed. Please try again.");

      if (status === 422) {
        toast.error(msg || "The last 4 digits do not match the ID on file.", { id: toastId });
      } else if (status === 400) {
        toast.error(msg || "Checkout failed. Please provide the last 4 digits of the ID.", {
          id: toastId,
        });
      } else if (status === 403) {
        toast.error(msg || "You do not have permission to checkout this guest.", { id: toastId });
      } else if (status === 404) {
        toast.error(msg || "Guest not found.", { id: toastId });
      } else {
        toast.error(msg, { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        ref={openBtnRef}
        type="button"
        className="btn btn-sm btn-success"
        onClick={() => setShowModal(true)}
      >
        Checkout
      </button>

      {showModal &&
        createPortal(
          <>
            <div
              className="modal fade show"
              style={{ display: "block" }}
              tabIndex="-1"
              aria-modal="true"
              role="dialog"
            >
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Checkout {guest?.firstName || ""}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={closeCheckoutModal}
                      disabled={loading}
                      aria-label="Close"
                    />
                  </div>

                  <div className="modal-body">
                    <label className="form-label">Payment Type</label>
                    <select
                      className="form-select mb-3"
                      value={paymentType}
                      onChange={(e) => setPaymentType(e.target.value)}
                      disabled={loading}
                    >
                      <option value="CASH">Cash</option>
                      <option value="DEBIT">Debit</option>
                      <option value="CREDIT">Credit</option>
                      <option value="OTHER">Other</option>
                    </select>

                    {isSuperAdmin && (
                      <div className="form-check mb-3">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id={`override-${guest?.id}`}
                          checked={adminOverride}
                          onChange={(e) => setAdminOverride(e.target.checked)}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor={`override-${guest?.id}`}>
                          Admin Override (checkout without ID verification)
                        </label>
                        <div className="form-text">This action will be audited.</div>
                      </div>
                    )}

                    <label className="form-label">Last 4 digits of ID</label>
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control mb-3"
                      value={idLast4}
                      onChange={(e) => setIdLast4(e.target.value.replace(/\D/g, ""))}
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="e.g. 1234"
                      disabled={loading || (isSuperAdmin && adminOverride)}
                    />

                    {summary && (
                      <div className="alert alert-info mb-0">
                        <p className="mb-1">
                          <strong>Days Stayed:</strong> {summary.daysStayed}
                        </p>

                        {summary.final ? (
                          <>
                            <p className="mb-1">
                              <strong>Late Checkout Fee:</strong>{" "}
                              GH₵{Number(summary.finalLateFee || 0).toFixed(2)}
                            </p>
                            <hr className="my-2" />
                            <p className="fw-bold mb-0">
                              Total Payment: GH₵{Number(summary.finalTotal || 0).toFixed(2)}
                            </p>
                          </>
                        ) : summary.estimatedBase != null ? (
                          <>
                            <p className="mb-1">
                              <strong>Estimated Base:</strong>{" "}
                              GH₵{Number(summary.estimatedBase).toFixed(2)}
                            </p>
                            <p className="mb-0 text-muted">
                              Final total is calculated by the backend at checkout.
                            </p>
                          </>
                        ) : (
                          <p className="mb-0 text-muted">
                            Final total is calculated by the backend at checkout.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={closeCheckoutModal}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCheckout}
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Confirm Checkout"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="modal-backdrop fade show"
              onClick={() => {
                if (!loading) setShowModal(false);
              }}
            />
          </>,
          document.body
        )}
    </>
  );
}

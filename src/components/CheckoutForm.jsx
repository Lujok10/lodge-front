// src/components/CheckoutForm.jsx
import { createPortal } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import api from "../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";

const DAILY_RATE = 100;
const LATE_CHECKOUT_FEE = 50;

export default function CheckoutForm({ guest, refresh, role, onCheckoutSuccess }) {
  const [paymentType, setPaymentType] = useState("CASH");
  const [idLast4, setIdLast4] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const openBtnRef = useRef(null);
  const inputRef = useRef(null);

  const summary = useMemo(() => {
    if (!guest?.checkInTime) return null;

    const checkIn = dayjs(guest.checkInTime);
    const checkout = dayjs();

    let daysStayed = checkout.diff(checkIn, "day");
    if (daysStayed <= 0) daysStayed = 1;

    const base = DAILY_RATE * daysStayed;

    let lateFee = 0;
    const standardCheckoutTime = checkout.hour(11).minute(0).second(0);
    if (checkout.isAfter(standardCheckoutTime)) lateFee = LATE_CHECKOUT_FEE;

    const total = base + lateFee;
    return { daysStayed, base, lateFee, total };
  }, [guest?.checkInTime]);

  const closeCheckoutModal = () => {
    if (loading) return;
    setShowModal(false);
  };

  // Stabilize modal: lock body scroll + ESC close + focus input
  useEffect(() => {
    if (!showModal) return;

    document.body.classList.add("modal-open");

    const onKeyDown = (e) => {
      if (e.key === "Escape") closeCheckoutModal();
    };
    window.addEventListener("keydown", onKeyDown);

    // Focus input on open
    const t = setTimeout(() => inputRef.current?.focus(), 0);

    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");

      // Return focus to the checkout button after closing
      setTimeout(() => openBtnRef.current?.focus(), 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const handleCheckout = async () => {
    if (!summary) {
      toast.error("Cannot calculate stay summary. Check guest check-in time.");
      return;
    }

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

    setLoading(true);
    const toastId = toast.loading("Checking out guest...");

    try {
      await api.post(
        `/guests/checkout/${guest.id}`,
        { paymentType, idNumber: last4 },
        { headers: { "X-User-Role": role || "MANAGER" } }
      );

      toast.success("Checkout completed", { id: toastId });

      /**
       * Stable modal flow:
       * - Close checkout modal
       * - Then open receipt modal (Dashboard fetchReceipt should open immediately + show loading)
       */
      setShowModal(false);
      setIdLast4("");

      if (onCheckoutSuccess) {
        await onCheckoutSuccess(guest.id);
      }

      await refresh?.();
    } catch (err) {
      console.error("Checkout failed:", err);

      if (err?.response?.status === 403) {
        toast.error("The last 4 digits of the ID do not match the one on file.", {
          id: toastId,
        });
      } else if (err?.response?.status === 400) {
        toast.error("Checkout failed. Make sure an ID was recorded at check-in.", {
          id: toastId,
        });
      } else {
        toast.error("Failed to checkout guest. Please try again.", { id: toastId });
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
                    <h5 className="modal-title">
                      Checkout {guest?.firstName || ""}
                    </h5>
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

                    <label className="form-label">Last 4 digits of ID</label>
                    <input
                      ref={inputRef}
                      type="text"
                      className="form-control mb-3"
                      value={idLast4}
                      onChange={(e) => setIdLast4(e.target.value)}
                      maxLength={4}
                      inputMode="numeric"
                      placeholder="e.g. 1234"
                      disabled={loading}
                    />

                    {summary && (
                      <div className="alert alert-info mb-0">
                        <p className="mb-1">
                          <strong>Days Stayed:</strong> {summary.daysStayed}
                        </p>
                        <p className="mb-1">
                          <strong>Base Amount:</strong> K{summary.base}
                        </p>
                        <p className="mb-2">
                          <strong>Late Checkout Fee:</strong> K{summary.lateFee}
                        </p>
                        <hr className="my-2" />
                        <p className="fw-bold mb-0">
                          Total Payment: K{summary.total}
                        </p>
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

            {/* Backdrop (do not close while loading) */}
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

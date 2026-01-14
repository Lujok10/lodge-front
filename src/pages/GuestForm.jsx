// src/components/GuestForm.jsx
import { useMemo, useState } from "react";
import api from "../api";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { getApiErrorMessage } from "../utils/apiError";

/**
 * Check-in form:
 * - includes stayDays (frontend)
 * - backend still computes and stores checkoutTime (source of truth)
 */
export default function GuestForm({ refresh, role, hotelCode }) {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    idType: "NATIONAL_ID",
    idNumber: "",
    stayDays: 1,
    paymentType: "CASH",
    paymentAmount: "",
    // checkInTime optional: if blank backend will set now
    checkInTime: "",
  });

  const cutoffTime = "11:00"; // UI preview only (backend decides final)

  const checkoutPreview = useMemo(() => {
    const days = Number(form.stayDays);
    if (!Number.isFinite(days) || days <= 0) return null;

    const checkIn = form.checkInTime ? dayjs(form.checkInTime) : dayjs();
    const date = checkIn.startOf("day").add(days, "day");
    const [hh, mm] = cutoffTime.split(":").map((x) => Number(x));
    return date.hour(hh).minute(mm).second(0);
  }, [form.stayDays, form.checkInTime]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "stayDays") {
      const n = Number(value);
      setForm((p) => ({ ...p, stayDays: Number.isFinite(n) ? n : 1 }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  const reset = () => {
    setForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      idType: "NATIONAL_ID",
      idNumber: "",
      stayDays: 1,
      paymentType: "CASH",
      paymentAmount: "",
      checkInTime: "",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!hotelCode || !String(hotelCode).trim()) {
      toast.error("Missing hotel code. Please select a hotel first.");
      return;
    }

    const stayDays = Number(form.stayDays);
    if (!Number.isFinite(stayDays) || stayDays <= 0) {
      toast.error("Stay days must be at least 1.");
      return;
    }

    if (!form.idNumber || String(form.idNumber).trim().length < 4) {
      toast.error("ID number is required at check-in.");
      return;
    }

    const paymentAmount = Number(form.paymentAmount);
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      toast.error("Payment amount must be greater than 0.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Checking in guest...");

    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        idType: form.idType,
        idNumber: form.idNumber,
        stayDays: stayDays,
        paymentType: form.paymentType,
        paymentAmount: paymentAmount,
        // optional: if blank backend will set now
        ...(form.checkInTime ? { checkInTime: form.checkInTime } : {}),
      };

      await api.post("/guests/checkin", payload, {
        headers: {
          "X-User-Role": role || "MANAGER",
          "X-Hotel-Code": String(hotelCode).trim().toUpperCase(),
        },
      });

      toast.success("Guest checked in", { id: toastId });
      reset();
      await refresh?.();
    } catch (err) {
      console.error("Check-in failed:", err);
      toast.error(getApiErrorMessage(err, "Check-in failed."), { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <h3 className="mb-4 text-primary">Guest Check-In</h3>

      <div className="row g-3">
        <div className="col-md-6">
          <input
            type="text"
            name="firstName"
            value={form.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="form-control"
            required
            disabled={loading}
          />
        </div>

        <div className="col-md-6">
          <input
            type="text"
            name="lastName"
            value={form.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="form-control"
            required
            disabled={loading}
          />
        </div>

        <div className="col-12">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="form-control"
            disabled={loading}
          />
        </div>

        <div className="col-12">
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            className="form-control"
            disabled={loading}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">ID Type</label>
          <select
            name="idType"
            value={form.idType}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
            <option value="DRIVERS_LICENSE">Driver&apos;s License</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">ID Number</label>
          <input
            type="text"
            name="idNumber"
            value={form.idNumber}
            onChange={handleChange}
            placeholder="ID Number"
            className="form-control"
            required
            disabled={loading}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Stay Days</label>
          <input
            type="number"
            name="stayDays"
            min={1}
            value={form.stayDays}
            onChange={handleChange}
            className="form-control"
            required
            disabled={loading}
          />
          <div className="form-text">
            Checkout is scheduled for 11:00 AM on (check-in date + stay days).
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Check-in Time (optional)</label>
          <input
            type="datetime-local"
            name="checkInTime"
            value={form.checkInTime}
            onChange={handleChange}
            className="form-control"
            disabled={loading}
          />
          <div className="form-text">
            Leave blank to use current time.
          </div>
        </div>

        <div className="col-md-6">
          <label className="form-label">Payment Type</label>
          <select
            name="paymentType"
            value={form.paymentType}
            onChange={handleChange}
            className="form-select"
            disabled={loading}
          >
            <option value="CASH">Cash</option>
            <option value="DEBIT">Debit</option>
            <option value="CREDIT">Credit</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        <div className="col-md-6">
          <label className="form-label">Payment Amount</label>
          <input
            type="number"
            name="paymentAmount"
            placeholder="Payment Amount"
            value={form.paymentAmount}
            onChange={handleChange}
            className="form-control"
            step="0.01"
            required
            disabled={loading}
          />
          <div className="form-text">
            This becomes the agreed amount locked at check-in.
          </div>
        </div>

        {checkoutPreview && (
          <div className="col-12">
            <div className="alert alert-info mb-0">
              <strong>Checkout Preview:</strong>{" "}
              {checkoutPreview.format("MMM D, YYYY")} at {checkoutPreview.format("h:mm A")}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking In..." : "Check In"}
        </button>
      </div>
    </form>
  );
}

// src/components/GuestForm.jsx
import { useMemo, useState } from "react";
import api from "../api";
import dayjs from "dayjs";

// ✅ International phone input (country picker + dialing codes)
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

export default function GuestForm({ refresh }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "", // E.164 format like +233xxxxxxxxx
    idType: "NATIONAL_ID",
    idNumber: "",
    checkInTime: "",
    stayDays: 1,
    paymentType: "CASH",
    paymentAmount: "",
  });

  const paymentOptions = ["CASH", "DEBIT", "CREDIT", "OTHER"];
  const idOptions = ["NATIONAL_ID", "PASSPORT", "DRIVER_LICENSE"];

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "stayDays") {
      const n = parseInt(value, 10);
      setForm((p) => ({ ...p, stayDays: Number.isNaN(n) ? 1 : Math.max(1, n) }));
      return;
    }

    setForm((p) => ({ ...p, [name]: value }));
  };

  // ✅ Frontend preview: scheduled checkout = (check-in date + stayDays) @ 11:00 AM
  const scheduledCheckoutPreview = useMemo(() => {
    const stayDays = form.stayDays && form.stayDays > 0 ? form.stayDays : 1;

    const checkIn = form.checkInTime ? dayjs(form.checkInTime) : dayjs();
    if (!checkIn.isValid()) return null;

    return checkIn
      .startOf("day")
      .add(stayDays, "day")
      .hour(11)
      .minute(0)
      .second(0);
  }, [form.checkInTime, form.stayDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || null,
      phone: form.phone || null, // ✅ E.164 value from PhoneInput
      idType: form.idType,
      idNumber: form.idNumber,
      checkInTime: form.checkInTime || null,
      stayDays: form.stayDays && form.stayDays > 0 ? form.stayDays : 1,
      paymentType: form.paymentType,
      paymentAmount: form.paymentAmount === "" ? null : Number(form.paymentAmount),
    };

    try {
      await api.post("/guests/checkin", payload, {
        headers: {
          "X-User-Role": (localStorage.getItem("role") || "MANAGER").toUpperCase(),
          "X-Username": localStorage.getItem("username") || "",
          "X-Hotel-Code": (localStorage.getItem("hotelCode") || "").trim().toUpperCase(),
        },
      });

      await refresh?.();

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        idType: "NATIONAL_ID",
        idNumber: "",
        checkInTime: "",
        stayDays: 1,
        paymentType: "CASH",
        paymentAmount: "",
      });
    } catch (err) {
      console.error("Check-in failed:", err);
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
          />
        </div>

        {/* ✅ International Phone Input (country picker) */}
        <div className="col-12">
          <PhoneInput
            international
            defaultCountry="GH" // change to "US" if you prefer
            value={form.phone}
            onChange={(val) => setForm((p) => ({ ...p, phone: val || "" }))}
            className="form-control"
            placeholder="Phone number"
          />
          <small className="text-muted">Choose a country and enter the number.</small>
        </div>

        <div className="col-md-6">
          <select
            name="idType"
            value={form.idType}
            onChange={handleChange}
            className="form-select"
            required
          >
            {idOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <input
            type="text"
            name="idNumber"
            value={form.idNumber}
            onChange={handleChange}
            placeholder="ID Number"
            className="form-control"
            required
          />
        </div>

        {/* ✅ ONLY ONE date input now: Check-in */}
        <div className="col-md-6">
          <input
            type="datetime-local"
            name="checkInTime"
            value={form.checkInTime}
            onChange={handleChange}
            className="form-control"
          />
          <small className="text-muted">Leave blank to use current time.</small>
        </div>

        {/* ✅ Number of days */}
        <div className="col-md-6">
          <input
            type="number"
            name="stayDays"
            value={form.stayDays}
            onChange={handleChange}
            className="form-control"
            min={1}
            step={1}
            required
            placeholder="Number of Days"
          />
          <small className="text-muted">Checkout will be auto-calculated.</small>
        </div>

        {/* ✅ Live preview */}
        <div className="col-12">
          <div className="alert alert-info mb-0">
            <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">Scheduled Checkout (Preview)</div>
                <div className="text-muted small">Based on stay days • cutoff 11:00 AM</div>
              </div>
              <div className="fw-bold">
                {scheduledCheckoutPreview
                  ? scheduledCheckoutPreview.format("MMM D, YYYY • h:mm A")
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <select
            name="paymentType"
            value={form.paymentType}
            onChange={handleChange}
            className="form-select"
          >
            {paymentOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-6">
          <input
            type="number"
            name="paymentAmount"
            placeholder="Payment Amount"
            value={form.paymentAmount}
            onChange={handleChange}
            className="form-control"
            step="0.01"
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <button type="submit" className="btn btn-primary w-100">
          Check In
        </button>
      </div>
    </form>
  );
}

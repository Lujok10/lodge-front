import { useState, useEffect } from "react";
import api from "../api";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import toast from "react-hot-toast";

export default function GuestForm({ refresh, editingGuest, setEditingGuest }) {
  const emptyForm = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkInTime: "",
    checkOutTime: "",
    paymentType: "CASH",
    paymentAmount: "",
    lateCheckoutFee: "",
    idType: "NATIONAL_ID",
    idNumber: "",
  };

  const [form, setForm] = useState(emptyForm);

  const paymentOptions = ["CASH", "DEBIT", "CREDIT", "OTHER"];

  // Populate when editingGuest changes
  useEffect(() => {
    if (!editingGuest) {
      setForm(emptyForm);
      return;
    }

    setForm({
      firstName: editingGuest.firstName || "",
      lastName: editingGuest.lastName || "",
      email: editingGuest.email || "",
      phone: editingGuest.phone || "",
      checkInTime: editingGuest.checkInTime
        ? String(editingGuest.checkInTime).slice(0, 16)
        : "",
      checkOutTime: editingGuest.checkOutTime
        ? String(editingGuest.checkOutTime).slice(0, 16)
        : "",
      paymentType: editingGuest.paymentType || "CASH",
      paymentAmount:
        editingGuest.paymentAmount === null || editingGuest.paymentAmount === undefined
          ? ""
          : String(editingGuest.paymentAmount),
      lateCheckoutFee:
        editingGuest.lateCheckoutFee === null || editingGuest.lateCheckoutFee === undefined
          ? ""
          : String(editingGuest.lateCheckoutFee),
      idType: editingGuest.idType || "NATIONAL_ID",
      idNumber: editingGuest.idNumber || "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingGuest]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePhoneChange = (value) =>
    setForm((prev) => ({ ...prev, phone: value || "" }));

  const normalizePayload = (f) => ({
    ...f,
    paymentAmount: f.paymentAmount === "" ? null : Number.parseFloat(f.paymentAmount),
    lateCheckoutFee: f.lateCheckoutFee === "" ? null : Number.parseFloat(f.lateCheckoutFee),
    checkInTime: f.checkInTime ? `${f.checkInTime}:00` : null,
    checkOutTime: f.checkOutTime ? `${f.checkOutTime}:00` : null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = normalizePayload(form);

    if (!payload.idNumber || payload.idNumber.trim().length < 4) {
      toast("ID verification required (min 4 characters).", { icon: "⚠️" });
      return;
    }

    const toastId = toast.loading(editingGuest ? "Updating guest..." : "Checking in guest...");

    try {
      if (editingGuest?.id) {
        await api.put(`/guests/${editingGuest.id}`, payload);
        toast.success("Guest updated successfully", { id: toastId });
      } else {
        await api.post("/guests/checkin", payload);
        toast.success("Guest checked in successfully", { id: toastId });
      }

      setEditingGuest?.(null);
      await refresh?.();
      setForm(emptyForm);
    } catch (err) {
      console.error(err?.response || err);
      const msg =
        err?.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : "Failed to save guest. Please try again.";
      toast.error(msg, { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded bg-light">
      <h3 className="mb-4 text-primary">
        {editingGuest ? "Edit Guest" : "Guest Check-In"}
      </h3>

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
            required
          />
        </div>

        {/* International Phone Input */}
        <div className="col-12">
          <PhoneInput
            international
            defaultCountry="US"
            value={form.phone}
            onChange={handlePhoneChange}
            className="form-control"
            placeholder="Enter phone number"
            required
          />
        </div>

        {/* ID TYPE + ID NUMBER */}
        <div className="col-md-6">
          <select
            name="idType"
            value={form.idType}
            onChange={handleChange}
            className="form-select"
          >
            <option value="NATIONAL_ID">National ID</option>
            <option value="DRIVER_LICENSE">Driver's License</option>
            <option value="PASSPORT">Passport</option>
            <option value="OTHER">Other</option>
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

        <div className="col-md-6">
          <input
            type="datetime-local"
            name="checkInTime"
            value={form.checkInTime}
            onChange={handleChange}
            className="form-control"
          />
        </div>

        <div className="col-md-6">
          <input
            type="datetime-local"
            name="checkOutTime"
            value={form.checkOutTime}
            onChange={handleChange}
            className="form-control"
          />
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

        <div className="col-md-3">
          <input
            type="number"
            name="paymentAmount"
            placeholder="Payment Amount"
            value={form.paymentAmount}
            onChange={handleChange}
            className="form-control"
            step="0.01"
          />
        </div>

        <div className="col-md-3">
          <input
            type="number"
            name="lateCheckoutFee"
            placeholder="Late Checkout Fee"
            value={form.lateCheckoutFee}
            onChange={handleChange}
            className="form-control"
            step="0.01"
          />
        </div>
      </div>

      <div className="mt-4 d-grid">
        <button type="submit" className="btn btn-primary">
          {editingGuest ? "Update Guest" : "Check In"}
        </button>
      </div>
    </form>
  );
}

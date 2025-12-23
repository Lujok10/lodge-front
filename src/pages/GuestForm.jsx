import { useState } from "react";
import api from "../api"; // adjust path if GuestForm is in a different folder

export default function GuestForm({ refresh }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    checkInTime: "",
    checkOutTime: "",
    paymentType: "CASH",
    paymentAmount: "",
    lateCheckoutFee: "",
  });

  const paymentOptions = ["CASH", "CARD", "ONLINE"];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/guests/checkin", form);

      refresh?.();

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        checkInTime: "",
        checkOutTime: "",
        paymentType: "CASH",
        paymentAmount: "",
        lateCheckoutFee: "",
      });
    } catch (err) {
      console.error("Check-in failed:", err);
      // optional: alert("Check-in failed");
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
            required
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

      <div className="mt-4">
        <button type="submit" className="btn btn-primary">
          Check In
        </button>
      </div>
    </form>
  );
}

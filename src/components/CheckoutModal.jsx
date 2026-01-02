// src/components/CheckoutModal.jsx
import { useState } from "react";
import api from "../api";

export default function CheckoutModal({ guest, onClose, refresh }) {
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentType, setPaymentType] = useState("CASH");
  const [error, setError] = useState("");

  if (!guest) return null;

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/guests/checkout/${guest.id}`, { idNumber: String(paymentAmount || "").slice(-4), paymentType });
      refresh();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to checkout guest. Please try again.");
    }
  };

  return (
    <div className="modal show" style={{ display: "block" }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Checkout Guest</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleCheckout}>
              <div className="mb-3">
                <label className="form-label">Payment Amount</label>
                <input
                  type="number"
                  className="form-control"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Payment Type</label>
                <select
                  className="form-select"
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                >
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">Checkout</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

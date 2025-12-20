import React, { useEffect, useState } from "react";
import axios from "axios";

const CheckoutReceiptForm = ({ guestId }) => {
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/api/checkout/${guestId}`);
        setReceipt(response.data);
      } catch (error) {
        console.error("Error fetching receipt:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipt();
  }, [guestId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/checkout/${guestId}/receipt`,
        {
          responseType: "blob", // important for binary
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `receipt_guest_${guestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading PDF receipt:", error);
    }
  };

  if (loading) return <p>Loading receipt...</p>;
  if (!receipt) return <p>No receipt found.</p>;

  return (
    <div className="container mt-4">
      <div className="card shadow p-4" id="receipt">
        <h3 className="text-center mb-3">Lodge Checkout Receipt</h3>
        <hr />

        <div className="row mb-2">
          <div className="col-6"><strong>Full Name:</strong></div>
          <div className="col-6">{receipt.fullName}</div>
        </div>

        <div className="row mb-2">
          <div className="col-6"><strong>Payment Type:</strong></div>
          <div className="col-6">{receipt.paymentType}</div>
        </div>

        <div className="row mb-2">
          <div className="col-6"><strong>Days Stayed:</strong></div>
          <div className="col-6">{receipt.daysStayed}</div>
        </div>

        <div className="row mb-2">
          <div className="col-6"><strong>Base Amount:</strong></div>
          <div className="col-6">K {receipt.baseAmount}</div>
        </div>

        <div className="row mb-2">
          <div className="col-6"><strong>Late Checkout Fee:</strong></div>
          <div className="col-6">K {receipt.lateCheckoutFee}</div>
        </div>

        <hr />

        <div className="row mb-3">
          <div className="col-6"><strong>Total Payment:</strong></div>
          <div className="col-6"><strong>K {receipt.totalPayment}</strong></div>
        </div>

        <div className="d-flex justify-content-center gap-3">
          <button className="btn btn-primary" onClick={handlePrint}>
            🖨 Print Receipt
          </button>
          <button className="btn btn-success" onClick={handleDownloadPDF}>
            📄 Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutReceiptForm;

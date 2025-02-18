import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const UdhaarDetailsPage = () => {
  const { phone } = useParams();
  const [udhaarDetails, setUdhaarDetails] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchUdhaarDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://goldrep-1.onrender.com/api/udhaar/${phone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUdhaarDetails(response.data);
    } catch (error) {
      console.error("❌ Error fetching Udhaar details:", error);
    }
  };

  useEffect(() => {
    fetchUdhaarDetails();
  }, [phone]);

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `https://goldrep-1.onrender.com/api/udhaar/pay/${phone}`,
        { amount: parseFloat(paymentAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setUdhaarDetails(response.data.udhaarRecord);
      setPaymentAmount("");
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      alert("Failed to process payment.");
    }

    setLoading(false);
  };


  const handleViewBill = (billId) => {
    const token = localStorage.getItem("token"); // 🔹 Get the token

    if (!token) {
        alert("User not authenticated. Please log in.");
        return;
    }

    const invoiceUrl = `https://goldrep-1.onrender.com/api/billing/invoice/${billId}?token=${token}`;
    
    window.open(invoiceUrl, "_blank"); // ✅ Opens the invoice in a new tab with token
};




  if (!udhaarDetails) return <p>Loading...</p>;

  return (
    <div className="udhaar-details">
      <h2>Udhaar Details</h2>
      <div className="customer-info">
        <p><strong>Customer:</strong> {udhaarDetails.customerName}</p>
        <p><strong>Phone:</strong> {udhaarDetails.customerPhone}</p>
        <p><strong>Total Remaining:</strong> ₹{udhaarDetails.totalRemaining?.toFixed(2)}</p>
      </div>

      <h3>Make Payment</h3>
      <div className="payment-section">
        <input
          type="number"
          placeholder="Enter amount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
        />
        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Processing..." : "Pay"}
        </button>
      </div>

      <h3>Payment History</h3>
      <ul>
        {udhaarDetails.bills?.flatMap((bill) =>
          bill.payments?.map((payment, index) => (
            <li key={index}>
              ₹{payment.amount} on {new Date(payment.date).toLocaleDateString()}
            </li>
          ))
        )}
      </ul>

      <h3>Udhaar Transactions</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Total</th>
            <th>Paid</th>
            <th>Remaining</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {udhaarDetails.bills?.map((bill) => (
            <tr key={bill.billId?._id}>
              <td>{new Date(bill.date).toLocaleDateString()}</td>
              <td>₹{bill.totalAmount?.toFixed(2)}</td>
              <td>₹{bill.paidAmount?.toFixed(2)}</td>
              <td>₹{bill.remainingAmount?.toFixed(2)}</td>
              <td>
      <button 
        onClick={() => handleViewBill(bill.billId)}
        className="btn btn-primary"
      >
        View Bill
      </button>
    </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UdhaarDetailsPage;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";

const LoanDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [additionalLoanAmount, setAdditionalLoanAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Helper function to format decimal values
  const formatDecimalValue = (value) => {
    if (!value) return "0.00";
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal).toFixed(2);
    }
    return parseFloat(value).toFixed(2);
  };

  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("Authentication token not found. Please log in again.");
          setLoading(false);
          return;
        }

        console.log("Fetching loan details for ID:", id);
        const response = await axios.get(`https://goldrep-1.onrender.com/api/loans/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API Response:", response.data);

        // Transform Decimal128 values to numbers
        const transformedLoan = {
          ...response.data,
          loanAmount: formatDecimalValue(response.data.loanAmount),
          interestRate: formatDecimalValue(response.data.interestRate),
          items: response.data.items.map(item => ({
            ...item,
            weight: formatDecimalValue(item.weight)
          })),
          payments: response.data.payments.map(payment => ({
            ...payment,
            amount: formatDecimalValue(payment.amount)
          })),
          additionalLoans: response.data.additionalLoans.map(loan => ({
            ...loan,
            amount: formatDecimalValue(loan.amount)
          }))
        };

        console.log("Transformed Loan Data:", transformedLoan);
        setLoan(transformedLoan);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching loan details:", err);
        setError(err.response?.data?.error || "Failed to fetch loan details. Please try again later.");
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [id]);

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `http://localhost:5000/api/loans/pay/${id}`,
        { amount: parseFloat(paymentAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Payment Recorded!");
      setLoan(response.data.loan);
      setPaymentAmount("");
    } catch (err) {
      console.error("Payment error:", err);
      alert("Failed to process payment.");
    }
  };

  const handleAdditionalLoan = async () => {
    if (!additionalLoanAmount || isNaN(additionalLoanAmount) || additionalLoanAmount <= 0) {
      alert("Enter a valid additional loan amount.");
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `https://goldrep-1.onrender.com/api/loans/add-loan/${id}`,
        { amount: parseFloat(additionalLoanAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Additional Loan Amount Recorded!");
      setLoan(response.data.loan);
      setAdditionalLoanAmount("");
    } catch (err) {
      console.error("Additional loan error:", err);
      alert("Failed to record additional loan amount.");
    }
  };

  const handleCompleteLoan = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`https://goldrep-1.onrender.com/api/loans/complete/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Loan Completed!");
      navigate('/loans');
    } catch (err) {
      console.error("Loan completion error:", err);
      alert("Failed to complete loan.");
    }
  };

  const exportDetailsToPDF = (title, details, filename) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 15);
    doc.setLineWidth(0.5);
    doc.line(14, 18, 190, 18);
    
    let y = 25;
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    Object.entries(details).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        doc.setFont(undefined, "bold");
        doc.text(`${key}:`, 14, y);
        y += 7;
        doc.setFont(undefined, "normal");
        value.forEach((item) => {
          doc.text(`• ${item}`, 20, y);
          y += 6;
        });
      } else {
        doc.setFont(undefined, "bold");
        doc.text(`${key}:`, 14, y);
        doc.setFont(undefined, "normal");
        doc.text(`${value}`, 60, y);
        y += 7;
      }
    });
    
    doc.save(filename);
  };

  const downloadLoanDetailsPDF = () => {
    if (!loan) return;
    const loanDetails = {
      "Customer Name": loan.customerName,
      "Phone": loan.customerPhone,
      "Address": loan.customerAddress,
      "Loan Amount": `${formatDecimalValue(loan.loanAmount)}`,
      "Interest Rate": `${loan.interestRate}%`,
      "Date": new Date(loan.loanDate).toLocaleDateString(),
      "Payment History": loan.payments.map(payment => 
        `${formatDecimalValue(payment.amount)} on ${new Date(payment.date).toLocaleDateString()}`
      ),
      "Additional Loan History": loan.additionalLoans.map(loan => 
        `${formatDecimalValue(loan.amount)} on ${new Date(loan.date).toLocaleDateString()}`
      )
    };
    exportDetailsToPDF("Loan Details", loanDetails, "loan_details.pdf");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Loading loan details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">Error: {error}</p>
        <button onClick={() => navigate('/loans')}>Back to Loans</button>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="error-container">
        <p>Loan not found</p>
        <button onClick={() => navigate('/loans')}>Back to Loans</button>
      </div>
    );
  }

  return (
    <div className="loan-details-container" style={{ marginTop: "50px" , padding:"20px"}}>
      <h2>Loan Details</h2>

      <button onClick={downloadLoanDetailsPDF} className="download-button">
        Download PDF
      </button>

      <div className="customer-details">
        <h3>Customer Information</h3>
        <p><strong>Name:</strong> {loan.customerName}</p>
        <p><strong>Phone:</strong> {loan.customerPhone}</p>
        <p><strong>Address:</strong> {loan.customerAddress}</p>
      </div>

      {loan.customerImage && (
        <div className="image-section">
          <h3>Customer Image</h3>
          <img 
            src={`http://localhost:5000${loan.customerImage}`} 
            alt="Customer" 
            width="200"
            onError={(e) => {
              e.target.src = 'placeholder-image-url';
              e.target.alt = 'Image not available';
            }}
          />
        </div>
      )}

      <div className="items-section">
        <h3>Item Details</h3>
        {loan.items && Array.isArray(loan.items) && loan.items.length > 0 ? (
          <ul className="items-list">
            {loan.items.map((item, index) => (
              <li key={index} className="item-card">
                <p><strong>Item Name:</strong> {item.itemName || "N/A"}</p>
                <p><strong>Material:</strong> {item.material || "N/A"}</p>
                <p><strong>Weight:</strong> {item.weight ? `${item.weight}g` : "N/A"}</p>
                <p><strong>Description:</strong> {item.description || "N/A"}</p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="single-item">
            <p><strong>Item Name:</strong> {loan.itemName || "N/A"}</p>
            <p><strong>Material:</strong> {loan.material || "N/A"}</p>
            <p><strong>Weight:</strong> {loan.weight ? `${loan.weight}g` : "N/A"}</p>
            <p><strong>Description:</strong> {loan.description || "N/A"}</p>
          </div>
        )}
      </div>

      {loan.itemImage && (
        <div className="image-section">
          <h3>Item Image</h3>
          <img 
            src={`http://localhost:5000${loan.itemImage}`} 
            alt="Item" 
            width="200"
            onError={(e) => {
              e.target.src = 'placeholder-image-url';
              e.target.alt = 'Image not available';
            }}
          />
        </div>
      )}

      <div className="loan-financial-details">
        <h3>Loan Details</h3>
        <p><strong>Loan Amount:</strong> ₹{loan.loanAmount}</p>
        <p><strong>Interest Rate:</strong> {loan.interestRate}%</p>
        <p><strong>Date:</strong> {new Date(loan.loanDate).toLocaleDateString()}</p>
      </div>

      <div className="payment-section">
        <h3>Make a Payment</h3>
        <div className="payment-input">
          <input 
            type="number" 
            placeholder="Enter amount to pay"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <button onClick={handlePayment}>Record Payment</button>
        </div>

        <h3>Give Additional Loan</h3>
        <div className="additional-loan-input">
          <input 
            type="number" 
            placeholder="Enter additional loan amount"
            value={additionalLoanAmount}
            onChange={(e) => setAdditionalLoanAmount(e.target.value)}
          />
          <button onClick={handleAdditionalLoan}>Record Additional Loan</button>
        </div>

        <h3>Payment History</h3>
        {loan.payments && loan.payments.length > 0 ? (
          <ul className="payments-list">
            {loan.payments.map((payment, index) => (
              <li key={index}>
                ₹{payment.amount} on {new Date(payment.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No payments recorded yet</p>
        )}

        <h3>Additional Loan History</h3>
        {loan.additionalLoans && loan.additionalLoans.length > 0 ? (
          <ul className="additional-loans-list">
            {loan.additionalLoans.map((loan, index) => (
              <li key={index}>
                ₹{loan.amount} on {new Date(loan.date).toLocaleDateString()}
              </li>
            ))}
          </ul>
        ) : (
          <p>No additional loans recorded yet</p>
        )}
      </div>

      <button 
        onClick={handleCompleteLoan} 
        className="complete-loan-button"
      >
        Complete Loan
      </button>
    </div>
  );
};

export default LoanDetails;

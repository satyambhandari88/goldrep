import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import axios from "axios";

const PreorderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [preorder, setPreorder] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    const fetchPreorder = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("No authentication token found");
        }

        const response = await axios.get(`https://goldrep-1.onrender.com/api/preorders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const data = response.data;
  
        // Handle the dates properly
        const formattedPreorder = {
          ...data,
          weight: parseFloat(data.weight),
          pricePerGram: parseFloat(data.pricePerGram),
          makingChargesPerGram: parseFloat(data.makingChargesPerGram),
          totalAmount: parseFloat(data.totalAmount),
          discount: parseFloat(data.discount),
          paidAmount: parseFloat(data.paidAmount),
          remainingAmount: parseFloat(data.remainingAmount),
          // Keep dates as ISO strings
          date: data.date,
          expectedDate: data.expectedDate,
          oldJewelry: {
            ...data.oldJewelry,
            weight: parseFloat(data.oldJewelry?.weight || 0),
            amountDeducted: parseFloat(data.oldJewelry?.amountDeducted || 0),
          },
          payments: data.payments.map(payment => ({
            amount: parseFloat(payment.amount),
            date: payment.date,
          }))
        };
  
        setPreorder(formattedPreorder);
      } catch (error) {
        console.error("Failed to fetch preorder details:", error);
        setError(error.response?.data?.error || error.message || "Failed to fetch preorder details");
      } finally {
        setLoading(false);
      }
    };
  
    fetchPreorder();
  }, [id]);
  

  const handlePayment = async () => {
    if (!paymentAmount || isNaN(paymentAmount) || parseFloat(paymentAmount) <= 0) {
      alert("Enter a valid payment amount.");
      return;
    }
  
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `https://goldrep-1.onrender.com/api/preorders/pay/${id}`,
        { amount: parseFloat(paymentAmount) }, // ✅ Ensure it's sent as a number
        { headers: { Authorization: `Bearer ${token}` } }
      );
  
      setPreorder(response.data.preorder);
      setPaymentAmount("");
      alert("Payment recorded successfully!");
    } catch (error) {
      console.error("❌ Failed to process payment:", error);
      alert(error.response?.data?.error || "Failed to process payment.");
    }
  };
  

  const handleCompletePreorder = async () => {
    if (!window.confirm("Are you sure you want to mark this preorder as completed?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://goldrep-1.onrender.com/api/preorders/complete/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Preorder marked as completed!");
      navigate("/preorders");
    } catch (error) {
      console.error("Failed to complete preorder:", error);
    }
  };



  const handleGenerateInvoice = () => {
    const token = localStorage.getItem("token"); // ✅ Get token from local storage
  
    if (!token) {
      alert("Please log in to generate the invoice.");
      return;
    }
  
    // ✅ Open invoice with token in URL
    window.open(`https://goldrep-1.onrender.com/api/preorders/invoice/${id}?token=${token}`, "_blank");
  };

  // Utility function to generate a well-styled detailed PDF
const exportDetailsToPDF = (title, details, filename) => {
  const doc = new jsPDF();

  // Header styling
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



// Modify PreorderDetails.js
const downloadPreorderDetailsPDF = () => {
  if (!preorder) return;
  const preorderDetails = {
    "Customer Name": preorder.customerName,
    "Phone": preorder.customerPhone,
    "Address": preorder.customerAddress,
    "Item Name": preorder.itemName,
    "Material": preorder.material,
    "Weight": `${preorder.weight}g`,
    "Price per Gram": `₹${preorder.pricePerGram}`,
    "Making Charges per Gram": `₹${preorder.makingChargesPerGram}`,
    "Total Amount": `₹${preorder.totalAmount}`,
    "Paid Amount": `₹${preorder.paidAmount}`,
    "Remaining Amount": `₹${preorder.remainingAmount}`,
    "Discount": `₹${preorder.discount}`,
    "Expected Delivery": new Date(preorder.expectedDate).toLocaleDateString(),
    "Payment History": preorder.payments.map(payment => `₹${payment.amount} on ${new Date(payment.date).toLocaleDateString()}`)
  };
  exportDetailsToPDF("Preorder Details", preorderDetails, "preorder_details.pdf");
};

  if (!preorder) return <p>Loading preorder details...</p>;

  return (
    <div className="container">
      <div className="heading">
        <h2>Preorder Details</h2>
        <button onClick={downloadPreorderDetailsPDF} className="download-button">Download PDF</button>
      </div>

      <h3>Customer Details</h3>
      <p><strong>Name:</strong> {preorder.customerName}</p>
      <p><strong>Phone:</strong> {preorder.customerPhone}</p>
      <p><strong>Address:</strong> {preorder.customerAddress}</p>
      {preorder.customerImage && <img src={`http://localhost:5000${preorder.customerImage}`} alt="Customer" width="200" />}

      <h3>Item Details</h3>
      <p><strong>Item:</strong> {preorder.itemName}</p>
      <p><strong>Material:</strong> {preorder.material}</p>
      {preorder.material === "Gold" && <p><strong>Karat:</strong> {preorder.karat}K</p>}
      <p><strong>Weight:</strong> {preorder.weight}g</p>
      <p><strong>Price per Gram:</strong> ₹{preorder.pricePerGram}</p>
      <p><strong>Making Charges per Gram:</strong> ₹{preorder.makingChargesPerGram}</p>
      <p><strong>Description:</strong> {preorder.description}</p>
      {preorder.itemImage && <img src={`http://localhost:5000${preorder.itemImage}`} alt="Item" width="200" />}

      <h3>Order Dates</h3>
      <p><strong>Preorder Date:</strong> {new Date(preorder.date).toLocaleDateString()}</p>
      <p><strong>Expected Delivery Date:</strong> {preorder.expectedDate}</p>

      <h3>Payment Details</h3>
      <p><strong>Total Amount:</strong> ₹{preorder.totalAmount}</p>
      <p><strong>Paid:</strong> ₹{preorder.paidAmount}</p>
      <p><strong>Remaining:</strong> ₹{preorder.remainingAmount}</p>
      <p><strong>Discount:</strong> ₹{preorder.discount}</p>

      <h3>Payment History</h3>
      <ul>
        {preorder.payments.map((payment, index) => (
          <li key={index}>
            ₹{payment.amount} on {new Date(payment.date).toLocaleDateString()}
          </li>
        ))}
      </ul>

      {preorder.status === "Pending" && (
        <>
          <h3>Make a Payment</h3>
          <input
            type="number"
            placeholder="Payment Amount"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />
          <button onClick={handlePayment}>Pay</button>

          <button onClick={handleCompletePreorder}>Mark as Completed</button>
        </>
      )}

      <button onClick={() => navigate("/preorders")}>Back to Preorders</button>
      <button onClick={handleGenerateInvoice}>Generate Invoice</button>
    </div>
  );
};

export default PreorderDetails;

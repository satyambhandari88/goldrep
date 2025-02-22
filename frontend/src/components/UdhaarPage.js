import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./UdhaarPage.css";

const UdhaarPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [udhaars, setUdhaars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUdhaarData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        console.log("Token exists:", !!token); // Check if token exists
        
        const response = await axios.get("http://localhost:5000/api/udhaar/all", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
    
        console.log("API Response:", response.data); // Log the response
        setUdhaars(response.data);
        setError(null);
      } catch (err) {
        console.error("❌ Error fetching Udhaar records:", err);
        setError(err.response?.data?.error || "Failed to fetch Udhaar records");
      } finally {
        setLoading(false);
      }
    };

    fetchUdhaarData();
  }, []);




  const filteredUdhaars = udhaars.reduce((acc, record) => {
    const existing = acc.find(entry => entry.customerPhone === record.customerPhone);
    if (existing) {
      existing.totalRemaining += record.totalRemaining;
    } else {
      acc.push(record);
    }
    return acc;
  }, []);



  // Function to download Udhaar records as PDF
  const downloadUdhaarPDF = () => {
    if (filteredUdhaars.length === 0) {
      alert("No Udhaar records to download.");
      return;
    }

    const doc = new jsPDF();
    const title = "Udhaar Records";
    const columns = ["Customer Name", "Phone", "Total Remaining Amount "];
    const rows = filteredUdhaars.map(udhaar => [
      udhaar.customerName || "N/A",
      udhaar.customerPhone || "N/A",
      `${udhaar.totalRemaining?.toLocaleString() ?? "0.00"}`
    ]);

    // Add title
    doc.setFontSize(15);
    doc.text(title, 14, 15);

    // Add table
    doc.autoTable({
      head: [columns],
      body: rows,
      startY: 25,
      theme: "grid",
      styles: { fontSize: 12 },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
    });

    // Save the PDF
    doc.save("udhaar_records.pdf");
  };
  

  // Add this to check data in render
  console.log("Current udhaars state:", udhaars);

  return (
    <div className="container">
      <h2>Udhaar Transactions</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />

<button onClick={downloadUdhaarPDF} className="download-button">
              Download PDF
            </button>

          <div className="table-container">
            <table className="udhaar-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Phone</th>
                  <th>Total Remaining Amount (₹)</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {udhaars.length === 0 ? (
                  <tr>
                    <td colSpan="4">
                      No Udhaar records available. {/* You can add "Create New" button here */}
                      <button 
                        onClick={() => navigate('/create-udhaar')} 
                        className="btn btn-primary"
                      >
                        Create New Udhaar
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredUdhaars.map((customer) => (
                    <tr key={customer.customerPhone}>
                    <td>{customer.customerName}</td>
                    <td>{customer.customerPhone}</td>
                    <td>₹{customer.totalRemaining?.toLocaleString() ?? "0.00"}</td>
                    <td>
                      <button 
                        onClick={() => navigate(`/udhaar/${customer.customerPhone}`)}
                        className="btn btn-info"
                      >
                        View Details ({customer.bills?.length} bills)
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default UdhaarPage;

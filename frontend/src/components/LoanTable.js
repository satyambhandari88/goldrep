import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import jsPDF from "jspdf";
import "jspdf-autotable";
import './LoanTable.css';

const LoanTable = () => {
  const [loans, setLoans] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://goldrep-1.onrender.com/api/loans/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        // Transform the loan data to handle Decimal128 values
        const transformedLoans = response.data.map(loan => ({
          ...loan,
          // Convert Decimal128 to number
          loanAmount: loan.loanAmount && typeof loan.loanAmount === 'object' 
            ? parseFloat(loan.loanAmount.$numberDecimal || '0') 
            : parseFloat(loan.loanAmount || '0'),
          // Convert items' weight fields
          items: loan.items.map(item => ({
            ...item,
            weight: item.weight && typeof item.weight === 'object' 
              ? parseFloat(item.weight.$numberDecimal || '0') 
              : parseFloat(item.weight || '0')
          }))
        }));
  
        setLoans(transformedLoans);
      } catch (error) {
        console.error("Error fetching loans:", error);
        alert("Failed to fetch loans. Please try again later.");
      }
    };
    fetchLoans();
  }, []);

  const filteredLoans = loans.filter(loan =>
    loan.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.customerPhone?.includes(searchTerm)
  );

  const exportToPDF = (data, filename, columns, title) => {
    const doc = new jsPDF();
    doc.text(title, 14, 10);
    const tableData = data.map(row => columns.map(col => {
      if (col === 'loanAmount') {
        return `${parseFloat(row[col]).toFixed(2)}`;
      }
      return row[col] || '';
    }));
    doc.autoTable({ head: [columns], body: tableData, startY: 20 });
    doc.save(filename);
  };

  const downloadLoanPDF = () => {
    if (loans.length === 0) return;
    const filteredLoans = loans.map(({ customerName, customerPhone, items, loanAmount }) => ({
      customerName: customerName || 'Unknown',
      customerPhone: customerPhone || 'N/A',
      itemName: items && Array.isArray(items) && items.length > 0
        ? items.map(item => item.itemName).join(", ")
        : 'No Items',
      loanAmount: loanAmount || 0
    }));
    exportToPDF(
      filteredLoans,
      "loans.pdf",
      ["customerName", "customerPhone", "itemName", "loanAmount"],
      "Loan Details"
    );
  };

  return (
    <div className="loan-container">
      <div className="heading">
        <h2>Loans</h2>
        <div className="sub-heading">
          <input
            type="text"
            placeholder="Search by Name or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <button onClick={downloadLoanPDF} className="download-button">
            Download PDF
          </button>
          <button onClick={() => navigate("/add-loan")} className="add-button">
            Add Loan
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="loan-table">
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Phone</th>
              <th>Item Name</th>
              <th>Loan Amount</th>
              <th>View</th>
            </tr>
          </thead>
          <tbody>
            {filteredLoans.map((loan) => (
              <tr key={loan._id}>
                <td>{loan.customerName || "Unknown"}</td>
                <td>{loan.customerPhone || "N/A"}</td>
                <td>
                  {loan.items && Array.isArray(loan.items) && loan.items.length > 0
                    ? loan.items.map((item) => item.itemName).join(", ")
                    : "No Items"}
                </td>
                <td>₹{loan.loanAmount ? loan.loanAmount.toFixed(2) : "0.00"}</td>
                <td>
                  <button onClick={() => navigate(`/loan/${loan._id}`)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanTable;

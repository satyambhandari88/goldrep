import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import "./PreorderTable.css"; // ✅ Import CSS for styling

const PreorderTable = () => {
  const [preorders, setPreorders] = useState([]);
  const [searchTerm, setSearchTerm] = useState(""); // ✅ Search Term State
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPreorders = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("https://goldrep-1.onrender.com/api/preorders", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreorders(response.data);
      } catch (error) {
        console.error("Failed to fetch preorders:", error);
      }
    };

    fetchPreorders();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this preorder?")) {
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`https://goldrep-1.onrender.com/api/preorders/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPreorders(preorders.filter((order) => order._id !== id));
      } catch (error) {
        console.error("Failed to delete preorder:", error);
      }
    }
  };

  // ✅ Filter Preorders Based on Search Term
  const filteredPreorders = preorders.filter((order) =>
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerPhone.includes(searchTerm) // Allows searching by phone number
  );



  // Utility function to convert table data to PDF format
const exportToPDF = (data, filename, columns, title) => {
  const doc = new jsPDF();
  doc.text(title, 14, 10);
  const tableData = data.map(row => columns.map(col => row[col] !== undefined ? row[col] : ""));
  doc.autoTable({ head: [columns], body: tableData, startY: 20 });
  doc.save(filename);
};


const downloadPreorderPDF = () => {
  if (preorders.length === 0) return;
  const filteredPreorders = preorders.map(({ customerName, customerPhone, itemName, totalAmount, paidAmount, remainingAmount }) => ({ customerName, customerPhone, itemName, totalAmount, paidAmount, remainingAmount }));
  exportToPDF(filteredPreorders, "preorders.pdf", ["customerName", "customerPhone", "itemName", "totalAmount", "paidAmount", "remainingAmount"], "Preorder Details");
};

  return (
    <div className="preorder-container">
      <div className="heading">
      <h2>Preorders</h2>


    <div className="sub-heading">

      {/* ✅ Search Bar */}
<input
  type="text"
  placeholder="Search by Name or Phone..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  className="search-bar"
/>

<button onClick={downloadPreorderPDF} className="download-button">Download PDF</button>

<button onClick={() => navigate("/preorder/add")} className="add-button">
  Add Preorder
</button>

    </div>
      </div>

      {/* ✅ Table with Scrollable Data */}
      <div className="table-container">
        <table className="preorder-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Phone</th>
              <th>Item</th>
              <th>Total (₹)</th>
              <th>Paid (₹)</th>
              <th>Remaining (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPreorders.map((order) => (
              <tr key={order._id}>
                <td>{order.customerName}</td>
                <td>{order.customerPhone}</td>
                <td>{order.itemName}</td>
                <td>{order.totalAmount ? parseFloat(order.totalAmount).toFixed(2) : "0.00"}</td>
<td>{order.paidAmount ? parseFloat(order.paidAmount).toFixed(2) : "0.00"}</td>
<td>{order.remainingAmount ? parseFloat(order.remainingAmount).toFixed(2) : "0.00"}</td>

                <td>
                  <button onClick={() => navigate(`/preorder/${order._id}`)}>View</button>
                  <button onClick={() => navigate(`/preorder/edit/${order._id}`)}>Edit</button>
                  <button onClick={() => handleDelete(order._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreorderTable;

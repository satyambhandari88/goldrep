
import axios from "axios";import React, { useState } from "react";
import { useNavigate } from "react-router-dom";


const AddPreorder = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerAddress: "",
    date: new Date().toISOString().split("T")[0],
  expectedDate: "", // ✅ Expected Delivery Date
    itemName: "",
    material: "Gold",
    weight: "",
    karat: "24",
    pricePerGram: "",
    makingChargesPerGram: "",
    description: "",
    discount: 0,
    oldJewelry: {
      material: "Gold",
      itemName: "",
      weight: "",
      amountDeducted: 0,
    },
    totalAmount: 0,
    paidAmount: 0,
    remainingAmount: 0,
  });

  const [customerImage, setCustomerImage] = useState(null);
  const [itemImage, setItemImage] = useState(null);

  // ✅ Handle Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
  
    // Allow decimals only for specific fields
    const updatedValue = 
      ["weight", "pricePerGram", "makingChargesPerGram", "discount", "paidAmount", "oldJewelry.weight", "oldJewelry.amountDeducted"]
        .includes(name) ? (value === "" ? "" : parseFloat(value)) : value;
  
    setFormData({ ...formData, [name]: updatedValue });
  
    if (["weight", "pricePerGram", "makingChargesPerGram", "discount", "paidAmount"].includes(name)) {
      calculateTotal({ ...formData, [name]: updatedValue });
    }
  };
  
  
  const handleOldJewelryChange = (e) => {
    const { name, value } = e.target;
    
    // Convert empty strings to 0 for number fields
    const updatedValue = ["weight", "amountDeducted"].includes(name) ? (value === "" ? 0 : parseFloat(value)) : value;
  
    setFormData({
      ...formData,
      oldJewelry: { ...formData.oldJewelry, [name]: updatedValue },
    });
  
    if (name === "amountDeducted") {
      calculateTotal({
        ...formData,
        oldJewelry: { ...formData.oldJewelry, [name]: updatedValue },
      });
    }
  };
  

  // ✅ Handle File Uploads
  const handleFileChange = (e, setImage) => {
    setImage(e.target.files[0]);
  };

  // ✅ Calculate Total Amount Automatically
  const calculateTotal = (updatedForm) => {
    const weight = parseFloat(updatedForm.weight) || 0;
    const pricePerGram = parseFloat(updatedForm.pricePerGram) || 0;
    const makingChargesPerGram = parseFloat(updatedForm.makingChargesPerGram) || 0;
    const discount = parseFloat(updatedForm.discount) || 0;
    const oldJewelryDeduction = parseFloat(updatedForm.oldJewelry.amountDeducted) || 0;
    const paidAmount = parseFloat(updatedForm.paidAmount) || 0;
  
    const subtotal = weight * pricePerGram + weight * makingChargesPerGram;
    const grandTotal = subtotal - discount - oldJewelryDeduction;
  
    // ✅ Prevent Negative Remaining Amount
    const remainingAmount = Math.max(grandTotal - paidAmount, 0);
  
    setFormData({
      ...updatedForm,
      totalAmount: grandTotal > 0 ? grandTotal : 0,
      remainingAmount,
    });
  };



  
  
  

  // ✅ Handle Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (typeof formData[key] === "object") {
        formDataToSend.append(key, JSON.stringify(formData[key])); // Convert objects to strings
      } else {
        formDataToSend.append(key, formData[key]);
      }
    });

    if (customerImage) formDataToSend.append("customerImage", customerImage);
    if (itemImage) formDataToSend.append("itemImage", itemImage);

    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/preorders", formDataToSend, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });

      alert("Preorder added successfully!");
      navigate("/preorders");
    } catch (error) {
      console.error("Failed to add preorder:", error);
      alert("Failed to add preorder.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Preorder</h2>

      <h3>Customer Details</h3>
      <input type="text" name="customerName" placeholder="Customer Name" required onChange={handleChange} />
      <input type="tel" name="customerPhone" placeholder="Phone" required onChange={handleChange} />
      <input type="text" name="customerAddress" placeholder="Address" required onChange={handleChange} />
      <input type="file" onChange={(e) => handleFileChange(e, setCustomerImage)} />


      <h3>Preorder Date & Expected Delivery</h3>
      <input type="date" name="expectedDate"  onChange={handleChange} /> {/* ✅ New Field */}
    <input type="date" name="expectedDate"  onChange={handleChange} /> {/* ✅ New Field */}

      <h3>Item Details</h3>
      <input type="text" name="itemName" placeholder="Item Name" required onChange={handleChange} />
      <select name="material" onChange={handleChange}>
        <option value="Gold">Gold</option>
        <option value="Silver">Silver</option>
      </select>

      {/* ✅ Show Karat Only for Gold */}
      {formData.material === "Gold" && (
        <select name="karat" onChange={handleChange}>
          <option value="24">24K</option>
          <option value="22">22K</option>
          <option value="18">18K</option>
        </select>
      )}

      <input type="number" name="weight" placeholder="Weight (g)" required step="0.01"min="0" onChange={handleChange} />
      <input type="number" name="pricePerGram" placeholder="Price per gram" required step="0.01"min="0" onChange={handleChange} />
      <input type="number" name="makingChargesPerGram" placeholder="Making charges per gram" required step="0.01"min="0" onChange={handleChange} />
      <input type="file" onChange={(e) => handleFileChange(e, setItemImage)} />

      <h3>Old Jewelry Exchange</h3>
      <select name="material" onChange={handleOldJewelryChange}>
        <option value="Gold">Gold</option>
        <option value="Silver">Silver</option>
      </select>
      <input type="text" name="itemName" placeholder="Old Jewelry Item Name" onChange={handleOldJewelryChange} />
      <input type="number" name="weight" placeholder="Old Jewelry Weight (g)" step="0.01"min="0" onChange={handleOldJewelryChange} />
      <input type="number" name="amountDeducted" placeholder="Amount Deducted (₹)" onChange={handleOldJewelryChange} />

      <h3>Payment Breakdown</h3>
      <p><strong>Subtotal:</strong> ₹{(formData.weight * formData.pricePerGram + formData.weight * formData.makingChargesPerGram) || 0}</p>
      <p><strong>Old Jewelry Deduction:</strong> ₹{formData.oldJewelry.amountDeducted || 0}</p>
      <p><strong>Discount:</strong> ₹{formData.discount || 0}</p>
      <p><strong>Grand Total:</strong> ₹{formData.totalAmount}</p>

      <h3>Payment Details</h3>
      <label>Discount (₹):</label>
      <input type="number" name="discount" placeholder="Enter Discount Amount"  onChange={handleChange} />

      <label>Paid Amount (₹):</label>
      <input type="number" name="paidAmount" placeholder="Enter Paid Amount"  onChange={handleChange} />

      <p><strong>Remaining Amount:</strong> ₹{formData.remainingAmount}</p>

      <button type="submit">Add Preorder</button>
    </form>
  );
};

export default AddPreorder;

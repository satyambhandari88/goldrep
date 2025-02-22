import React, { useState } from "react";
import axios from "axios";
import './AddItemForm.css';

const AddItemForm = ({ setShowForm, editingItem, onItemAdded }) => {
  const [formData, setFormData] = useState(
    editingItem || { itemName: "", category: "", material: "Gold", karat: "", weight: "", thresholdWeight: "" }
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "karat" || name === "weight" || name === "thresholdWeight" ? parseFloat(value) || "" : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("User not authenticated. Please log in again.");
        return;
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      };

      const requestData = { ...formData };

      let response;
      if (editingItem) {
        // Send a PUT request to update the item
        response = await axios.put(
          `https://goldrep-1.onrender.com/api/inventory/update/${editingItem._id}`,
          requestData,
          config
        );
      } else {
        // Send a POST request to add a new item
        response = await axios.post("https://goldrep-1.onrender.com/api/inventory/add", requestData, config);
      }

      console.log("✅ Response:", response.data);
      onItemAdded(); // Refresh the inventory list
      setShowForm(false); // Close the form
    } catch (error) {
      console.error("❌ Error:", error.response?.data || error.message);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>{editingItem ? "Edit Item" : "Add New Item"}</h2>
        <form onSubmit={handleSubmit}>
          <input type="text" name="itemName" placeholder="Item Name" value={formData.itemName} onChange={handleChange} required />
          <input type="text" name="category" placeholder="Category" value={formData.category} onChange={handleChange} required />
          <select name="material" value={formData.material} onChange={handleChange}>
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
          </select>
          {formData.material === "Gold" && (
            <input type="number" name="karat" placeholder="Karat (18-24)" value={formData.karat} onChange={handleChange} required />
          )}
          <input type="number" name="weight" placeholder="Weight (g)" value={formData.weight} onChange={handleChange} required />
          <input type="number" name="thresholdWeight" placeholder="Threshold Weight (for alerts)" value={formData.thresholdWeight} onChange={handleChange} required />
          <button type="submit">Save</button>
        </form>
        <button className="close-btn" onClick={() => setShowForm(false)}>Close</button>
      </div>
    </div>
  );
};

export default AddItemForm;

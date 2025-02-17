import React, { useState } from "react";
import axios from "axios";
import './AddItemForm.css';

const AddItemForm = ({ setShowForm, editingItem, onItemAdded }) => {
    const [formData, setFormData] = useState(
      editingItem || { itemName: "", category: "", material: "Gold", karat: "", weight: "", thresholdWeight: "" }
    );

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingItem) {
        await axios.put(
          `http://localhost:5000/api/inventory/update/${editingItem._id}`,
          formData,
          config
        );
      } else {
        await axios.post("http://localhost:5000/api/inventory/add", formData, config);
      }
      onItemAdded();
      setShowForm(false);
    } catch (error) {
      console.error("Error adding/updating item:", error);
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

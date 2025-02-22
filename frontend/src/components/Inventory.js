import React, { useState, useEffect } from "react";
import axios from "axios";
import AddItemForm from "./AddItemForm";
import './Inventory.css';

const Inventory = () => {
  const [activeTab, setActiveTab] = useState("Gold");
  const [goldInventory, setGoldInventory] = useState([]);
  const [silverInventory, setSilverInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // Track the item being edited

  const token = localStorage.getItem('token');
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await axios.get('https://goldrep-1.onrender.com/api/inventory/all');
        setGoldInventory(response.data.filter((item) => item.material === "Gold"));
        setSilverInventory(response.data.filter((item) => item.material === "Silver"));
      } catch (error) {
        console.error("Error fetching inventory:", error);
        if (error.response?.status === 401) {
          window.location.href = '/login';
        }
      }
    };
    fetchInventory();
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://goldrep-1.onrender.com/api/inventory/delete/${id}`);
      setGoldInventory(goldInventory.filter((item) => item._id !== id));
      setSilverInventory(silverInventory.filter((item) => item._id !== id));
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item); // Set the item to be edited
    setShowForm(true); // Show the form
  };

  const handleItemAdded = () => {
    // Refresh the inventory list after adding/editing an item
    const fetchInventory = async () => {
      try {
        const response = await axios.get('https://goldrep-1.onrender.com/api/inventory/all');
        setGoldInventory(response.data.filter((item) => item.material === "Gold"));
        setSilverInventory(response.data.filter((item) => item.material === "Silver"));
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };
    fetchInventory();
  };

  const filteredInventory = activeTab === "Gold"
    ? goldInventory.filter(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()))
    : silverInventory.filter(item => item.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="inventory-container">
      <div className="heading">
        <h2>Inventory Management</h2>
        <div className="sub-heading">
          <input
            type="text"
            placeholder="Search by Item Name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-bar"
          />
          <button className="add-button" onClick={() => { setEditingItem(null); setShowForm(true); }}>+ Add Item</button>
        </div>
      </div>

      <div className="toggle-buttons">
        <button className={activeTab === "Gold" ? "active" : ""} onClick={() => setActiveTab("Gold")}>Gold Inventory</button>
        <button className={activeTab === "Silver" ? "active" : ""} onClick={() => setActiveTab("Silver")}>Silver Inventory</button>
      </div>

      <div className="table-container">
  <table className="inventory-table">
    <thead>
      <tr>
        <th>Item Name</th>
        <th>Category</th>
        <th>Material</th>
        {activeTab === "Gold" && <th>Karat</th>} {/* Show Karat only for Gold */}
        <th>Weight (g)</th> {/* Always show Weight */}
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredInventory.map((item) => (
        <tr key={item._id}>
          <td>{item.itemName}</td>
          <td>{item.category}</td>
          <td>{item.material}</td>
          {activeTab === "Gold" && <td>{item.karat}K</td>} {/* Show Karat only for Gold */}
          <td>{item.weight}g</td> {/* Always show Weight */}
          <td>
            <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

      {showForm && (
        <AddItemForm
          setShowForm={setShowForm}
          editingItem={editingItem}
          onItemAdded={handleItemAdded}
        />
      )}
    </div>
  );
};

export default Inventory;

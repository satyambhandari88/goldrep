import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AddLoan = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    date: new Date().toISOString().split('T')[0],
    loanAmount: '',
    interestRate: ''
  });

  const [items, setItems] = useState([]);
  const [showItemCanvas, setShowItemCanvas] = useState(false);
  const [newItem, setNewItem] = useState({ itemName: '', material: 'Gold', weight: '', description: '' });
  const [customerImage, setCustomerImage] = useState(null);
  const [itemImage, setItemImage] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input Change - ${name}:`, value); // Debugging

    // Handle numeric fields separately
    if (name === 'loanAmount' || name === 'interestRate') {
      setFormData({
        ...formData,
        [name]: value // Keep as string for now, will be parsed on submit
      });
    } else {
      // For text fields, just store the value directly
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    // For weight, store as is, will be parsed when adding item
    setNewItem({ ...newItem, [name]: value });
  };

  const addItem = () => {
    // Validate weight is a number before adding
    const weight = parseFloat(newItem.weight);
    if (isNaN(weight)) {
      alert('Please enter a valid weight');
      return;
    }

    const itemToAdd = {
      ...newItem,
      weight: weight // Store as number
    };

    setItems([...items, itemToAdd]);
    setNewItem({ itemName: '', material: 'Gold', weight: '', description: '' });
    setShowItemCanvas(false);
  };

  const handleCustomerImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCustomerImage(file);
    }
  };

  const handleItemImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setItemImage(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate numeric fields before submission
    const loanAmount = parseFloat(formData.loanAmount);
    const interestRate = parseFloat(formData.interestRate);

    if (isNaN(loanAmount) || isNaN(interestRate)) {
      alert('Please enter valid numbers for loan amount and interest rate');
      return;
    }

    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    const formDataToSend = new FormData();
    
    // Add text fields
    formDataToSend.append('customerName', formData.customerName.trim());
    formDataToSend.append('customerPhone', formData.customerPhone.trim());
    formDataToSend.append('customerAddress', formData.customerAddress.trim());
    
    
    // Add numeric fields
    formDataToSend.append('loanAmount', loanAmount);
    formDataToSend.append('interestRate', interestRate);
    
    // Add items array
    formDataToSend.append('items', JSON.stringify(items));

    // Add images if present
    if (customerImage) formDataToSend.append('customerImage', customerImage);
    if (itemImage) formDataToSend.append('itemImage', itemImage);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/loans', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Loan added successfully:', response.data);
      alert('Loan Added Successfully!');
      navigate('/loans');
    } catch (err) {
      console.error('Add loan error:', err.response?.data || err.message);
      alert(err.response?.data?.error || 'Failed to add loan');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="add-loan-form">
      <h2>Add New Loan</h2>

      <h3>Customer Details</h3>
      <input 
        type="text" 
        name="customerName" 
        placeholder="Customer Name" 
        value={formData.customerName}
        required 
        onChange={handleChange} 
      />
      <input 
        type="tel" 
        name="customerPhone" 
        placeholder="Phone" 
        value={formData.customerPhone}
        required 
        onChange={handleChange} 
      />
      <input 
        type="text" 
        name="customerAddress" 
        placeholder="Address" 
        value={formData.customerAddress}
        required 
        onChange={handleChange} 
      />

    <input type="date" name="Date"  onChange={handleChange} /> {/* ✅ New Field */}

      {/* Customer Image Upload */}
      <div>
        <label>Customer Image:</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleCustomerImageChange} 
        />
      </div>

      <h3>Item Details</h3>
      <button type="button" onClick={() => setShowItemCanvas(true)}>Add Item</button>
      {items.length > 0 && (
        <ul>
          {items.map((item, index) => (
            <li key={index}>{item.itemName} - {item.material} - {item.weight}g</li>
          ))}
        </ul>
      )}

      {showItemCanvas && (
        <div className="item-canvas">
          <h3>Add Item</h3>
          <input 
            type="text" 
            name="itemName" 
            placeholder="Item Name" 
            value={newItem.itemName}
            required 
            onChange={handleItemChange} 
          />
          <select 
            name="material" 
            value={newItem.material}
            onChange={handleItemChange}
          >
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
          </select>
          <input 
            type="number" 
            name="weight" 
            placeholder="Weight (g)" 
            value={newItem.weight}
            required 
            step="0.01" 
            onChange={handleItemChange} 
          />
          <input 
            type="text" 
            name="description" 
            placeholder="Description" 
            value={newItem.description}
            onChange={handleItemChange} 
          />

          {/* Item Image Upload */}
          <div>
            <label>Item Image:</label>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleItemImageChange} 
            />
          </div>

          <button type="button" onClick={addItem}>Save Item</button>
          <button type="button" onClick={() => setShowItemCanvas(false)}>Cancel</button>
        </div>
      )}

      <h3>Loan Details</h3>
      <input 
        type="number" 
        name="loanAmount" 
        placeholder="Loan Amount" 
        value={formData.loanAmount}
        required 
        step="0.01" 
        onChange={handleChange} 
      />
      <input 
        type="number" 
        name="interestRate" 
        placeholder="Interest Rate (%)" 
        value={formData.interestRate}
        required 
        step="0.01" 
        onChange={handleChange} 
      />

      <button type="submit">Add Loan</button>
    </form>
  );
};

export default AddLoan;
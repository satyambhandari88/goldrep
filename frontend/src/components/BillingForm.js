import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./BillingForm.css";

const BillingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    date: new Date().toISOString().split('T')[0],
    items: [],
    discount: 0,
    oldJewelry: [],
    paymentType: 'Full',
    paidAmount: 0,
    isGSTBill: false, // Added GST bill toggle
  });

  const [currentItem, setCurrentItem] = useState({
    type: 'Gold',
    itemName: '',
    category: '',
    weight: 0,
    pricePerGram: 0,
    makingChargesPerGram: 0,
    inventoryItemId: '',
    total: 0,
  });

  const [currentOldJewelry, setCurrentOldJewelry] = useState({
    type: 'Gold',
    weight: 0,
    pricePerGram: 0,
    total: 0,
  });

  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState('');

  useEffect(() => {
    const fetchInventoryItems = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/inventory/all', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        setInventoryItems(response.data);
      } catch (error) {
        console.error('Failed to fetch inventory items:', error);
      }
    };

    fetchInventoryItems();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const calculateItemTotal = (item) => {
    const basePrice = item.weight * item.pricePerGram;
    const makingCharges = item.weight * item.makingChargesPerGram;
    return basePrice + makingCharges;
  };

  const addItem = () => {
    if (!currentItem.itemName || !currentItem.weight || !currentItem.pricePerGram) {
      setError('Please fill all required item fields');
      return;
    }

    const total = calculateItemTotal(currentItem);

    const itemToAdd = { ...currentItem, total };
    if (!itemToAdd.inventoryItemId) {
      delete itemToAdd.inventoryItemId;
    }

    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, itemToAdd],
    }));

    setCurrentItem({
      type: 'Gold',
      itemName: '',
      category: '',
      weight: 0,
      pricePerGram: 0,
      makingChargesPerGram: 0,
      total: 0,
    });
    setError('');
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addOldJewelry = () => {
    if (!currentOldJewelry.weight || !currentOldJewelry.pricePerGram) {
      setError('Please fill all required old jewelry fields');
      return;
    }

    const total = currentOldJewelry.weight * currentOldJewelry.pricePerGram;
    setFormData((prev) => ({
      ...prev,
      oldJewelry: [...prev.oldJewelry, { ...currentOldJewelry, total }],
    }));
    setCurrentOldJewelry({
      type: 'Gold',
      weight: 0,
      pricePerGram: 0,
      total: 0,
    });
    setError('');
  };

  const removeOldJewelry = (index) => {
    setFormData((prev) => ({
      ...prev,
      oldJewelry: prev.oldJewelry.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const igst = formData.isGSTBill ? subtotal * 0.015 : 0;
    const sgst = formData.isGSTBill ? subtotal * 0.015 : 0;
    const oldJewelryTotal = formData.oldJewelry.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal + igst + sgst - formData.discount - oldJewelryTotal;
    const remainingAmount = formData.paymentType === 'Udhaar' ? grandTotal - formData.paidAmount : 0;

    return { subtotal, igst, sgst, oldJewelryTotal, grandTotal, remainingAmount };
  };

  const validateForm = () => {
    if (!formData.customerName || !formData.customerPhone) {
      setError('Please fill all required customer details');
      return false;
    }
    if (formData.items.length === 0) {
      setError('Please add at least one item');
      return false;
    }
    if (formData.paymentType === 'Udhaar' && !formData.paidAmount) {
      setError('Please enter paid amount for Udhaar payment');
      return false;
    }
    return true;
  };

  const handleInventorySelect = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      const inventoryItem = inventoryItems.find((item) => item._id === selectedId);
      setSelectedInventoryItem(selectedId);
      setCurrentItem((prev) => ({
        ...prev,
        itemName: inventoryItem.itemName,
        type: inventoryItem.material,
        category: inventoryItem.category,
        inventoryItemId: inventoryItem._id,
        fromInventory: true,
      }));
    } else {
      setSelectedInventoryItem('');
      setCurrentItem((prev) => ({
        ...prev,
        itemName: '',
        inventoryItemId: '',
        fromInventory: false,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login');
        return;
    }

    setLoading(true);
    setError('');

    // Ensure paidAmount is equal to grandTotal for Full Payment
    const totals = calculateTotals();
    const billData = {
        ...formData,
        ...totals,
        paidAmount: formData.paymentType === 'Full' ? totals.grandTotal : formData.paidAmount, 
        remainingAmount: formData.paymentType === 'Full' ? 0 : totals.grandTotal - formData.paidAmount,
        status: formData.paymentType === 'Full' ? 'Paid' : formData.paidAmount > 0 ? 'Partial' : 'Pending',
    };

    try {
        const response = await axios.post('http://localhost:5000/api/billing/create', billData, {
            headers: { Authorization: `Bearer ${token}` },
        });

        const billId = response.data.bill._id;
        const downloadUrl = `http://localhost:5000/api/billing/invoice/${billId}?token=${token}`;
        window.open(downloadUrl, '_blank');

        setFormData({
            customerName: '',
            customerPhone: '',
            customerAddress: '',
            date: new Date().toISOString().split('T')[0],
            items: [],
            discount: 0,
            oldJewelry: [],
            paymentType: 'Full',
            paidAmount: 0,
            isGSTBill: false,
        });

        setError('');
    } catch (error) {
        console.error('Error:', error.response?.data);
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/login');
        } else {
            setError(error.response?.data?.error || 'Failed to create bill');
        }
    } finally {
        setLoading(false);
    }
};

  const totals = calculateTotals();

  return (
    <form onSubmit={handleSubmit} className="billing-form">
      {error && <div className="error-message">{error}</div>}

      <div className="form-section">
        <h2>Bill Type</h2>
        <div className="check-input-group">
  <input
    type="checkbox"
    id="gstCheckbox"
    checked={formData.isGSTBill}
    onChange={(e) => setFormData((prev) => ({ ...prev, isGSTBill: e.target.checked }))}
  />
  <label htmlFor="gstCheckbox">Generate GST Bill</label>
</div>

      </div>

      <div className="form-section">
        <h2>Customer Details</h2>
        <div className="input-group">
          <input
            type="text"
            placeholder="Customer Name *"
            value={formData.customerName}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
            required
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={formData.customerPhone}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerPhone: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Address"
            value={formData.customerAddress}
            onChange={(e) => setFormData((prev) => ({ ...prev, customerAddress: e.target.value }))}
          />
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
      </div>

      <div className="form-section">
        <h2>Add Items</h2>
        <div className="input-group">
          <select
            value={selectedInventoryItem}
            onChange={handleInventorySelect}
          >
            <option value="">Select from Inventory</option>
            {inventoryItems.map((item) => (
              <option key={item._id} value={item._id}>
                {item.itemName} ({item.weight}g)
              </option>
            ))}
          </select>
          <select
            value={currentItem.type}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
          </select>
          <input
            type="text"
            placeholder="Item Name *"
            value={currentItem.itemName}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, itemName: e.target.value }))}
          />
          <input
            type="text"
            placeholder="Category"
            value={currentItem.category}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, category: e.target.value }))}
          />
          <input
            type="number"
            placeholder="Weight (g) *"
            value={currentItem.weight || ''}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
          />
          <input
            type="number"
            placeholder="Price per gram *"
            value={currentItem.pricePerGram || ''}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, pricePerGram: parseFloat(e.target.value) || 0 }))}
          />
          <input
            type="number"
            placeholder="Making charges per gram"
            value={currentItem.makingChargesPerGram || ''}
            onChange={(e) => setCurrentItem((prev) => ({ ...prev, makingChargesPerGram: parseFloat(e.target.value) || 0 }))}
          />
          <button type="button" onClick={addItem} className="add-button">
            Add Item
          </button>
        </div>

        <div className="items-list">
          {formData.items.map((item, index) => (
            <div key={index} className="item-entry">
              <span>
                {item.itemName} - {item.type} - {item.weight}g - ₹{item.total}
              </span>
              <button type="button" onClick={() => removeItem(index)} className="remove-button">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h2>Old Jewelry Exchange</h2>
        <div className="input-group">
          <select
            value={currentOldJewelry.type}
            onChange={(e) => setCurrentOldJewelry((prev) => ({ ...prev, type: e.target.value }))}
          >
            <option value="Gold">Gold</option>
            <option value="Silver">Silver</option>
          </select>
          <input
            type="number"
            placeholder="Weight (g) *"
            value={currentOldJewelry.weight || ''}
            onChange={(e) => setCurrentOldJewelry((prev) => ({ ...prev, weight: parseFloat(e.target.value) || 0 }))}
          />
          <input
            type="number"
            placeholder="Price per gram *"
            value={currentOldJewelry.pricePerGram || ''}
            onChange={(e) => setCurrentOldJewelry((prev) => ({ ...prev, pricePerGram: parseFloat(e.target.value) || 0 }))}
          />
          <button type="button" onClick={addOldJewelry} className="add-button">
            Add Item
          </button>
        </div>

        <div className="items-list">
          {formData.oldJewelry.map((item, index) => (
            <div key={index} className="item-entry">
              <span>
                {item.type} - {item.weight}g - ₹{item.total}
              </span>
              <button type="button" onClick={() => removeOldJewelry(index)} className="remove-button">
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="form-section">
        <h2>Bill Details</h2>
        <div className="input-group">
          <input
            type="number"
            placeholder="Discount"
            value={formData.discount || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
          />
        </div>
        <div className="calculations">
          <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
          {formData.isGSTBill && (
            <>
              <p>IGST (1.5%): ₹{totals.igst.toFixed(2)}</p>
              <p>SGST (1.5%): ₹{totals.sgst.toFixed(2)}</p>
            </>
          )}
          <p>Discount: ₹{formData.discount}</p>
          <p>Old Jewelry Value: ₹{totals.oldJewelryTotal.toFixed(2)}</p>
          <p className="grand-total">Grand Total: ₹{totals.grandTotal.toFixed(2)}</p>
        </div>
      </div>

      <div className="form-section">
        <h2>Payment Details</h2>
        <div className="input-group">
          <select
            value={formData.paymentType}
            onChange={(e) => setFormData((prev) => ({ ...prev, paymentType: e.target.value }))}
          >
            <option value="Full">Full Payment</option>
            <option value="Udhaar">Udhaar</option>
          </select>

          {formData.paymentType === 'Udhaar' && (
            <div className="udhaar-details">
              <input
                type="number"
                placeholder="Paid Amount *"
                value={formData.paidAmount || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, paidAmount: parseFloat(e.target.value) || 0 }))}
              />
              <p>Remaining Amount: ₹{totals.remainingAmount.toFixed(2)}</p>
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Generating Bill...' : 'Generate Bill'}
      </button>
    </form>
  );
};

export default BillingForm;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import "./BillingForm.css";

const BillingForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

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
    isGSTBill: false,
  });

  const [currentItem, setCurrentItem] = useState({
    type: 'Gold',
    itemName: '',
    category: '',
    weight: 0,
    pricePerGram: 0,
    makingChargeValue: 0,
    makingChargeType: 'perGram',
    inventoryItemId: '',
    total: 0,
  });

  const [currentOldJewelry, setCurrentOldJewelry] = useState({
    type: 'Gold',
    weight: 0,
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
    let makingCharges = 0;

    if (item.makingChargeType === 'perGram') {
      makingCharges = item.weight * item.makingChargeValue;
    } else if (item.makingChargeType === 'percentage') {
      makingCharges = (basePrice * item.makingChargeValue) / 100;
    }

    return basePrice + makingCharges;
  };

  const addItem = () => {
    if (!currentItem.itemName || !currentItem.weight || !currentItem.pricePerGram) {
      setError('Please fill all required item fields');
      return;
    }

    const total = calculateItemTotal(currentItem);
    const newItem = {
      ...currentItem,
      total,
      itemName: currentItem.itemName.trim(),
      weight: parseFloat(currentItem.weight),
      pricePerGram: parseFloat(currentItem.pricePerGram),
      type: currentItem.type || 'Gold',
      category: currentItem.category || '',
      makingChargeValue: parseFloat(currentItem.makingChargeValue) || 0,
      makingChargeType: currentItem.makingChargeType || 'perGram'
    };

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setCurrentItem({
      type: 'Gold',
      itemName: '',
      category: '',
      weight: 0,
      pricePerGram: 0,
      makingChargeValue: 0,
      makingChargeType: 'perGram',
      total: 0,
    });

    setError('');
    setSelectedInventoryItem('');
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const addOldJewelry = () => {
    if (!currentOldJewelry.weight || !currentOldJewelry.total) {
      setError('Please fill all required old jewelry fields');
      return;
    }

    setFormData((prev) => ({
      ...prev,
      oldJewelry: [...prev.oldJewelry, { ...currentOldJewelry }],
    }));

    setCurrentOldJewelry({
      type: 'Gold',
      weight: 0,
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
    if (!formData.customerName.trim() || !formData.customerPhone.trim()) {
      setError('Please fill all required customer details');
      return false;
    }

    if (!Array.isArray(formData.items) || formData.items.length === 0) {
      setError('Please add at least one item before generating the bill');
      return false;
    }

    const invalidItems = formData.items.filter(
      item => !item.itemName || !item.weight || !item.pricePerGram
    );
    if (invalidItems.length > 0) {
      setError('Some items have missing required fields');
      return false;
    }

    if (formData.paymentType === 'Udhaar') {
      if (formData.paidAmount === undefined || formData.paidAmount === null) {
        setError('Please enter paid amount for Udhaar payment');
        return false;
      }
    }

    setError('');
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
    console.log("Form submission initiated");
    console.log("Current form data:", formData);

    if (!validateForm()) {
      console.log("Form validation failed");
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');

    const totals = calculateTotals();
    const billData = {
      ...formData,
      ...totals,
      paidAmount: formData.paymentType === 'Full' ? totals.grandTotal : formData.paidAmount,
      remainingAmount: formData.paymentType === 'Full' ? 0 : totals.grandTotal - formData.paidAmount,
      status: formData.paymentType === 'Full' ? 'Paid' : formData.paidAmount > 0 ? 'Partial' : 'Pending',
    };

    try {
      console.log("Sending bill data to server:", billData);
      const response = await axios.post('http://localhost:5000/api/billing/create', billData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const billId = response.data.bill._id;
      const previewUrl = `http://localhost:5000/api/billing/invoice/${billId}?token=${token}`;

      // Fetch the preview data
      const previewResponse = await axios.get(previewUrl, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });

      const blob = new Blob([previewResponse.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      setPreviewData(url); // Set the preview data
      setShowPreview(true); // Show the preview modal

    } catch (error) {
      console.error('Error creating bill:', error.response?.data);
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

  const handlePrint = () => {
    if (previewData) {
      const iframe = document.createElement('iframe');
      iframe.src = previewData;
      iframe.style.display = 'none';
      document.body.appendChild(iframe);

      iframe.onload = () => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
      };
    }
  };

  // Add this function to handle the download
  const handleDownload = () => {
    if (previewData) {
      const link = document.createElement('a');
      link.href = previewData;
      link.download = 'bill.pdf'; // You can customize the filename here
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Calculate totals for display
  const totals = calculateTotals();

  return (
    <div className="billing-form">
      <form onSubmit={handleSubmit}>
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
                  {item.itemName} - {item.category} - {item.material} ({item.weight}g)
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

            <select
              value={currentItem.makingChargeType}
              onChange={(e) => setCurrentItem((prev) => ({ ...prev, makingChargeType: e.target.value }))}
            >
              <option value="perGram">Making Charge per Gram</option>
              <option value="percentage">Making Charge in %</option>
            </select>

            <input
              type="number"
              placeholder={currentItem.makingChargeType === "perGram" ? "Making charges per gram" : "Making charge percentage"}
              value={currentItem.makingChargeValue || ''}
              onChange={(e) => setCurrentItem((prev) => ({ ...prev, makingChargeValue: parseFloat(e.target.value) || 0 }))}
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
              placeholder="Total Amount *"
              value={currentOldJewelry.total || ''}
              onChange={(e) => setCurrentOldJewelry((prev) => ({ ...prev, total: parseFloat(e.target.value) || 0 }))}
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

      {showPreview && (
        <div className="preview-modal">
          <div className="preview-content">
            <iframe src={previewData} width="100%" height="500px"></iframe>
            <button onClick={handlePrint}>Print Bill</button>
            <button onClick={handleDownload}>Download Bill</button> {/* New button */}
            <button onClick={() => setShowPreview(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillingForm;

const mongoose = require("mongoose");

const BillSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  billNumber: { type: String},
  date: { type: Date, default: Date.now },
  
  // Customer Details
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  
  // GST Details
  isGSTBill: { type: Boolean, default: false },
  igst: { type: Number, default: 0 },
  sgst: { type: Number, default: 0 },
  
  // Items
  items: [{
    type: { type: String, enum: ["Gold", "Silver"], required: true },
    itemName: { type: String, required: true },
    category: { type: String, required: true },
    weight: { type: Number, required: true },
    pricePerGram: { type: Number, required: true },
    makingChargesPerGram: { type: Number, required: true },
    inventoryItemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
    fromInventory: { type: Boolean, default: false },
    total: { type: Number, required: true }
  }],
  
  // Calculations
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  
  // Old Jewelry Exchange
  oldJewelry: [{
    type: { type: String, enum: ["Gold", "Silver"] },
    weight: { type: Number },
    pricePerGram: { type: Number},
    total: { type: Number }
  }],
  oldJewelryTotal: { type: Number, default: 0 },
  
  // Payment Details
  grandTotal: { type: Number, required: true },
  paymentType: { type: String, enum: ["Full", "Udhaar"], required: true },
  paidAmount: { type: Number, required: true },
  remainingAmount: { type: Number, default: 0 },
  
  status: { type: String, enum: ["Paid", "Partial", "Pending"], required: true },

  payments: [{
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now }
  }]
});

// Auto-generate bill number
BillSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      
      const lastBill = await this.constructor.findOne({ userId: this.userId })
        .sort({ billNumber: -1 });
        
      let sequence = '001';
      if (lastBill && lastBill.billNumber) {
        const lastSequence = parseInt(lastBill.billNumber.slice(-3));
        sequence = (lastSequence + 1).toString().padStart(3, '0');
      }
      
      this.billNumber = `BILL-${year}${month}-${sequence}`;
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Bill", BillSchema);
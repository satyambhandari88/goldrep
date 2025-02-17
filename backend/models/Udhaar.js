const mongoose = require("mongoose");

const UdhaarSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  totalRemaining: { type: Number, default: 0 }, // Sum of all outstanding Udhaar
  bills: [{
    billId: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" }, // Link to Bills
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    payments: [{ amount: Number, date: { type: Date, default: Date.now } }]
  }]
});

module.exports = mongoose.model("Udhaar", UdhaarSchema);

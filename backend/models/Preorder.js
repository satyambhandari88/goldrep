const mongoose = require("mongoose");

const PreorderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  customerImage: { type: String },

  date: { type: Date, default: Date.now }, // ✅ Preorder Date
  expectedDate: { type: Date }, // ✅ Expected Delivery Date

  itemName: { type: String, required: true },
  material: { type: String, enum: ["Gold", "Silver"], required: true },
  weight: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  karat: { type: Number, enum: [18, 20, 22, 24], required: function () { return this.material === "Gold"; } },
  pricePerGram: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  makingChargesPerGram: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  description: { type: String },
  itemImage: { type: String },

  totalAmount: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },
  discount: { type: mongoose.Schema.Types.Decimal128, default: 0, min: 0 },
  paidAmount: { type: mongoose.Schema.Types.Decimal128, default: 0, min: 0 },
  remainingAmount: { type: mongoose.Schema.Types.Decimal128, required: true, min: 0 },

  status: { type: String, enum: ["Pending", "Completed"], default: "Pending" }
});

module.exports = mongoose.model("Preorder", PreorderSchema);

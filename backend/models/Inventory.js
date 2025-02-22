// models/Inventory.js
const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  itemName: { type: String, required: true },
  category: { type: String, required: true },
  material: { type: String, enum: ["Gold", "Silver"], required: true },
  karat: { type: Number, min: 18, max: 24, required: function () { return this.material === "Gold"; } },  
  weight: { type: Number, required: true },
  thresholdWeight: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

InventorySchema.methods.isLowStock = function() {
  return this.weight < this.thresholdWeight;
};

module.exports = mongoose.model("Inventory", InventorySchema);
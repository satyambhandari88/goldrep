const SalesSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shopkeeper", required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    items: [{
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },
      name: { type: String, required: true }, 
      category: { type: String, required: true },
      material: { type: String, enum: ["Gold", "Silver"], required: true },
      karat: { type: Number, required: function () { return this.material === "Gold"; } },
      weight: { type: Number, required: true },
      pricePerGram: { type: Number, required: true },
      makingChargesPerGram: { type: Number, required: true },
      totalPrice: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    exchangeDeduction: { type: Number, default: 0 },
    igst: { type: Number, default: function () { return this.totalAmount * 0.015; } },
    sgst: { type: Number, default: function () { return this.totalAmount * 0.015; } },
    netAmount: { type: Number, required: true }, // (totalAmount - discount - exchangeDeduction) + IGST + SGST
    paidAmount: { type: Number, required: true },
    dueAmount: { type: Number, default: function () { return this.netAmount - this.paidAmount; } },
    paymentMethod: { type: String, enum: ["Cash", "UPI", "Card", "Bank Transfer"], required: true },
    invoicePDF: { type: String }, // Store file path
    saleDate: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model("Sales", SalesSchema);
  
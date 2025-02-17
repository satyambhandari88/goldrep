const ReportSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shopkeeper", required: true },
    reportType: { type: String, enum: ["Sales", "Outstanding Payments"], required: true },
    month: { type: String, required: true }, // e.g., "January 2024"
    totalSales: { type: Number, required: true },
    totalUdhaar: { type: Number, required: true },
    totalCollected: { type: Number, required: true }
  });
  
  module.exports = mongoose.model("Report", ReportSchema);
  
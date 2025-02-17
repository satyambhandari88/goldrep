const SettingsSchema = new mongoose.Schema({
    shopId: { type: mongoose.Schema.Types.ObjectId, ref: "Shopkeeper", required: true },
    enableBarcode: { type: Boolean, default: false },
    enableWhatsAppInvoice: { type: Boolean, default: false },
    loyaltyProgram: { type: Boolean, default: false }
  });
  
  module.exports = mongoose.model("Settings", SettingsSchema);
  
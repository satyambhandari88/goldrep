const mongoose = require("mongoose");
const LoanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },

  items: [{  
    itemName: { type: String, required: true },
    material: { type: String, enum: ["Gold", "Silver"], required: true },
    weight: { type: mongoose.Schema.Types.Decimal128, required: true },  // ✅ Decimal Precision
    description: { type: String }
  }],

  loanAmount: { type: mongoose.Schema.Types.Decimal128, required: true },  // ✅ Decimal Precision
  interestRate: { type: mongoose.Schema.Types.Decimal128, required: true }, // ✅ Decimal Precision
  loanDate: { type: Date, default: Date.now },

  customerImage: { type: String },
  itemImage: { type: String },

  payments: [{  // For customer payments
    amount: { type: mongoose.Schema.Types.Decimal128, required: true }, // ✅ Decimal Precision
    date: { type: Date, default: Date.now }
  }],

  additionalLoans: [{  // For additional loan amounts given by the shopkeeper
    amount: { type: mongoose.Schema.Types.Decimal128, required: true }, // ✅ Decimal Precision
    date: { type: Date, default: Date.now }
  }],

  status: { type: String, enum: ["Active", "Completed"], default: "Active" }
});

module.exports = mongoose.model("Loan", LoanSchema);

// models/User.js
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  shopName: { type: String, required: true },
  ownerName: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  logo: { type: String }, 
  gstNo: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Auto-generate ID when creating new user
UserSchema.pre('save', function(next) {
  if (this.isNew) {
    this._id = new mongoose.Types.ObjectId();
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
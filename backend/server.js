require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const auth = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const inventoryRoutes = require("./routes/inventoryRoutes");
const billingRoutes = require("./routes/billingRoutes");
const loanRoutes = require("./routes/loanRoutes");
const preorderRoutes = require("./routes/preorderRoutes");
const udhaarRoutes = require("./routes/udhaarRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");


const app = express();

// Middleware

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

// Import Routes


// ✅ Serve uploaded images as static files
app.use("/uploads", express.static("uploads"));




app.use("/api/auth", auth);
app.use("/api/profile", profileRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/preorders", preorderRoutes);
app.use("/api/udhaar", udhaarRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "client/build")));

// Handle React routing, return all requests to React app
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

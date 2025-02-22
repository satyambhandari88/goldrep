const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { shopName, ownerName, phone, address, logo, gstNo, password } = req.body;

    // Check if user exists
    let existingUser = await User.findOne({ phone });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save new user
    const newUser = new User({ shopName, ownerName, phone, address, logo, gstNo, password: hashedPassword });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login Route


router.post("/login", async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    console.log("🔹 Login Attempt:", { phone });

    // Check if user exists
    const user = await User.findOne({ phone });
    if (!user) {
      console.log("❌ User not found");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Incorrect password");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    console.log("✅ Login successful:", user.phone);
    res.json({ token, user });

  } catch (error) {
    console.error("🔥 Login Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;

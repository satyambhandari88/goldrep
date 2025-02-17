const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const fs = require("fs");
const Loan = require("../models/Loan");
const authMiddleware = require("../middleware/auth"); 

const router = express.Router();
 router.use(authMiddleware); // Ensure authentication for all routes

// Ensure "uploads" directory exists
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = "uploads/";
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage });

//  Get All Active Loans
router.get("/all", async (req, res) => {
  try {
    const loans = await Loan.find({ userId: req.user.userId, status: "Active" }).lean();

    //  Ensure items field is always an array
    loans.forEach((loan) => {
      if (!Array.isArray(loan.items)) {
        loan.items = [];
      }
    });

    console.log("Loans Sent to Frontend:", loans);
    res.json(loans);
  } catch (error) {
    console.error(" Error fetching loans:", error);
    res.status(500).json({ error: "Failed to fetch loans" });
  }
});

//  Get Loan by ID
router.get("/:id", async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id).lean();
    if (!loan) return res.status(404).json({ error: "Loan not found" });

    //  Ensure `items` is always an array
    if (!Array.isArray(loan.items) || loan.items.length === 0) {
      loan.items = [];

      //  Convert Old Loan Format to New `items[]` Format
      if (loan.itemName && loan.material && loan.weight) {
        loan.items.push({
          itemName: loan.itemName,
          material: loan.material,
          weight: loan.weight,
          description: loan.description || "",
        });
      }
    }

    console.log(" Loan Sent to Frontend:", loan);
    res.json(loan);
  } catch (error) {
    console.error(" Error fetching loan:", error);
    res.status(500).json({ error: "Failed to fetch loan details" });
  }
});

// Add a New Loan
router.post("/", upload.fields([{ name: "customerImage" }, { name: "itemImage" }]), async (req, res) => {
  try {
    console.log(" Received request body:", req.body);

    const { customerName, customerPhone, customerAddress, loanAmount, interestRate } = req.body;

    // Basic validation
    if (!customerName || !customerPhone || !customerAddress || !loanAmount || !interestRate) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let items = [];
    if (req.body.items) {
      try {
        items = JSON.parse(req.body.items);
        if (!Array.isArray(items)) {
          return res.status(400).json({ error: "Items must be an array" });
        }
      } catch (error) {
        console.error(" JSON Parse Error:", error.message);
        return res.status(400).json({ error: "Invalid items format" });
      }
    }

    // Validate each item in the items array
    for (const item of items) {
      if (!item.itemName || !item.material || !item.weight) {
        return res.status(400).json({ error: "Each item must have a name, material, and weight" });
      }
    }

    // Create new loan document
    const newLoan = new Loan({
      userId: req.user.userId,
      customerName,
      customerPhone,
      customerAddress,
      loanAmount: mongoose.Types.Decimal128.fromString(loanAmount.toString()),
      interestRate: mongoose.Types.Decimal128.fromString(interestRate.toString()),
      items: items.map(item => ({
        ...item,
        weight: mongoose.Types.Decimal128.fromString(item.weight.toString())
      })),
      customerImage: req.files?.customerImage ? `/uploads/${req.files.customerImage[0].filename}` : "",
      itemImage: req.files?.itemImage ? `/uploads/${req.files.itemImage[0].filename}` : "",
      status: "Active"
    });

    await newLoan.save();
    console.log(" Loan saved successfully:", newLoan);
    res.status(201).json({ message: "Loan added successfully", loan: newLoan });
  } catch (error) {
    console.error(" Server Error:", error);
    res.status(500).json({ error: "Failed to add loan", details: error.message });
  }
});





  

//  Record a Payment
//  Record a Payment
router.put("/pay/:id", async (req, res) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.userId });

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    // Add the payment to the payments array
    loan.payments.push({ amount });
    await loan.save();

    res.json({ message: "Payment recorded", loan });
  } catch (error) {
    res.status(500).json({ error: "Failed to record payment" });
  }
});

//  Record an Additional Loan Amount
router.put("/add-loan/:id", async (req, res) => {
  try {
    const { amount } = req.body;
    const loan = await Loan.findOne({ _id: req.params.id, userId: req.user.userId });

    if (!loan) return res.status(404).json({ error: "Loan not found" });

    // Add the additional loan amount to the additionalLoans array
    loan.additionalLoans.push({ amount });
    await loan.save();

    res.json({ message: "Additional loan amount recorded", loan });
  } catch (error) {
    res.status(500).json({ error: "Failed to record additional loan amount" });
  }
});





//  Complete a Loan (Remove from Active Loans)
router.put("/complete/:id", async (req, res) => {
  try {
    const loan = await Loan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { status: "Completed" },
      { new: true }
    );
    if (!loan) return res.status(404).json({ error: "Loan not found" });
    res.json({ message: "Loan completed successfully", loan });
  } catch (error) {
    res.status(500).json({ error: "Failed to complete loan" });
  }
});

module.exports = router;

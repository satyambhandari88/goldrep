const express = require("express");
const mongoose = require("mongoose");

const multer = require("multer");
const fs = require("fs");
const Preorder = require("../models/Preorder");
const authMiddleware = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const path = require("path");
const router = express.Router();

router.use(authMiddleware);

// ✅ Multer Configuration for Image Uploads
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

// ✅ Create Preorder
router.post("/", upload.fields([{ name: "customerImage" }, { name: "itemImage" }]), async (req, res) => {
    try {
      console.log("Received request body:", req.body); // ✅ Debugging Step
      console.log("Received files:", req.files);
  
      const { customerName, customerPhone, customerAddress, date, expectedDate, itemName, material, weight, karat, pricePerGram, makingChargesPerGram, description, discount, totalAmount, paidAmount } = req.body;
  
      // ✅ Convert to Numbers (Fix possible string issues)
      const grandTotal = parseFloat(totalAmount) || 0;
      const paid = parseFloat(paidAmount) || 0;
      const discountValue = parseFloat(discount) || 0;
  
      // ✅ Convert Old Jewelry JSON String to Object
      let oldJewelry = {};
      if (req.body.oldJewelry) {
        oldJewelry = JSON.parse(req.body.oldJewelry);
      }
      const oldJewelryDeduction = parseFloat(oldJewelry?.amountDeducted) || 0;
  
      const customerImage = req.files.customerImage ? `/uploads/${req.files.customerImage[0].filename}` : "";
      const itemImage = req.files.itemImage ? `/uploads/${req.files.itemImage[0].filename}` : "";
  
      // ✅ Prevent Negative Remaining Amount
      const remainingAmount = Math.max(grandTotal - paid - oldJewelryDeduction, 0);
  
      const newPreorder = new Preorder({
        userId: req.user.userId,
        customerName, customerPhone, customerAddress, date,expectedDate,
        itemName, material, weight, karat, pricePerGram, makingChargesPerGram, description,
        discount: discountValue,
        totalAmount: grandTotal,
        paidAmount: paid,
        remainingAmount,
        customerImage, itemImage,
        oldJewelry,
        payments: paid > 0 ? [{ amount: paid }] : []
      });
  
      await newPreorder.save();
      res.status(201).json({ message: "Preorder created successfully", preorder: newPreorder });
    } catch (error) {
      console.error("Error adding preorder:", error);
      res.status(500).json({ error: "Failed to create preorder", details: error.message });
    }
  });
  
  

// ✅ Get All Preorders
router.get("/", async (req, res) => {
  try {
    const preorders = await Preorder.find().lean();

    // ✅ Convert Decimal128 fields safely
    const formattedPreorders = preorders.map(preorder => ({
      ...preorder,
      totalAmount: preorder.totalAmount ? parseFloat(preorder.totalAmount.toString()) : 0,
      paidAmount: preorder.paidAmount ? parseFloat(preorder.paidAmount.toString()) : 0,
      remainingAmount: preorder.remainingAmount ? parseFloat(preorder.remainingAmount.toString()) : 0,
    }));

    console.log("Preorders Sent to Frontend:", formattedPreorders);
    res.json(formattedPreorders);
  } catch (error) {
    console.error("Error fetching preorders:", error);
    res.status(500).json({ error: "Failed to fetch preorders" });
  }
});


// ✅ Get Preorder Details
router.get("/:id", async (req, res) => {
  try {
    const preorder = await Preorder.findById(req.params.id).lean();
    if (!preorder) return res.status(404).json({ error: "Preorder not found" });

    // ✅ Helper function to safely convert Decimal128
    const formatDecimal = (value) => (value !== null && value !== undefined ? parseFloat(value.toString()) : 0);

    preorder.totalAmount = formatDecimal(preorder.totalAmount);
    preorder.paidAmount = formatDecimal(preorder.paidAmount);
    preorder.remainingAmount = formatDecimal(preorder.remainingAmount);
    preorder.discount = formatDecimal(preorder.discount);

    preorder.weight = formatDecimal(preorder.weight);
    preorder.pricePerGram = formatDecimal(preorder.pricePerGram);
    preorder.makingChargesPerGram = formatDecimal(preorder.makingChargesPerGram);
    preorder.expectedDate = preorder.expectedDate ? new Date(preorder.expectedDate).toLocaleDateString() : "Not Provided";


    if (preorder.oldJewelry) {
      preorder.oldJewelry.weight = formatDecimal(preorder.oldJewelry?.weight);
      preorder.oldJewelry.amountDeducted = formatDecimal(preorder.oldJewelry?.amountDeducted);
    }

    preorder.payments = Array.isArray(preorder.payments) ? preorder.payments.map(payment => ({
      amount: formatDecimal(payment.amount),
      date: payment.date,
    })) : []; 

    console.log("✅ Preorder Sent to Frontend:", preorder);
    res.json(preorder);
  } catch (error) {
    console.error("❌ Error fetching preorder:", error);
    res.status(500).json({ error: "Failed to fetch preorder details" });
  }
});




// ✅ Make Payment
router.put("/pay/:id", async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    const preorder = await Preorder.findById(req.params.id);
    if (!preorder) return res.status(404).json({ error: "Preorder not found" });

    // ✅ Convert Decimal128 values safely before updating
    const formatDecimal = (value) => (value !== null && value !== undefined ? parseFloat(value.toString()) : 0);

    let paidAmount = formatDecimal(preorder.paidAmount);
    let remainingAmount = formatDecimal(preorder.remainingAmount);
    let paymentAmount = parseFloat(amount); // ✅ Ensure it's a number

    // ✅ Proper addition, not string concatenation
    paidAmount += paymentAmount;
    remainingAmount -= paymentAmount;

    // ✅ Ensure we don't allow overpayment
    if (remainingAmount < 0) {
      return res.status(400).json({ error: "Payment exceeds remaining amount" });
    }

    // ✅ Push new payment record
    preorder.payments.push({ amount: paymentAmount, date: new Date() });

    // ✅ Save updated paidAmount and remainingAmount
    preorder.paidAmount = new mongoose.Types.Decimal128(paidAmount.toFixed(2));
    preorder.remainingAmount = new mongoose.Types.Decimal128(remainingAmount.toFixed(2));

    await preorder.save();
    
    console.log("✅ Payment Added:", { paidAmount, remainingAmount });
    res.json({ message: "Payment recorded successfully", preorder });
  } catch (error) {
    console.error("❌ Error processing payment:", error);
    res.status(500).json({ error: "Failed to process payment" });
  }
});


// ✅ Delete Preorder
router.delete("/:id", async (req, res) => {
  try {
    await Preorder.findByIdAndDelete(req.params.id);
    res.json({ message: "Preorder deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete preorder" });
  }
});

// ✅ Generate Invoice for Preorder


// Helper function to safely parse numbers
const safeParseFloat = (value) => {
  if (value === null || value === undefined) return 0;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};

// Helper function to safely access nested object properties
const safeGetValue = (obj, path, defaultValue = 0) => {
  try {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj) ?? defaultValue;
  } catch (e) {
      return defaultValue;
  }
};


router.get("/invoice/:id", async (req, res) => {
  let doc = null;
  
  try {
      // Find and validate preorder
      const preorder = await Preorder.findById(req.params.id);
      if (!preorder) {
          console.log("Preorder not found for ID:", req.params.id);
          return res.status(404).json({ error: "Preorder not found" });
      }

      // Populate user data
      await preorder.populate("userId", "shopName gstNo address");
      if (!preorder.userId) {
          console.log("User data not found for preorder:", preorder._id);
          return res.status(404).json({ error: "User data not found" });
      }

      // Initialize PDF document
      doc = new PDFDocument({ 
          margin: 50, 
          size: 'A4',
          bufferPages: true
      });

      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=invoice-${preorder._id}.pdf`);
      
      // Pipe the PDF to the response
      doc.pipe(res);

      // Header Section
      doc.rect(50, 40, 495, 110).lineWidth(1.5).stroke();
      doc.fontSize(28).font('Helvetica-Bold')
         .text(preorder.userId.shopName || 'Shop Name', 60, 55, { align: "center" });
      doc.fontSize(12).font('Helvetica')
         .text(`GST No: ${preorder.userId.gstNo || 'N/A'}`, { align: "center" })
         .text(preorder.userId.address || 'Address not available', { align: "center" });

      // Invoice Details Section
      doc.rect(50, 170, 495, 50).lineWidth(1).stroke();
      doc.fontSize(14).font('Helvetica-Bold')
         .text('INVOICE', 60, 180)
         .fontSize(11).font('Helvetica')
         .text(`Invoice No: ${preorder._id}`, 350, 180)
         .text(`Date: ${new Date(preorder.date).toLocaleDateString()}`, 350, 195);

      // Customer Details Section
      doc.rect(50, 240, 495, 80).stroke();
      doc.fontSize(14).font('Helvetica-Bold')
         .text('Customer Details', 60, 250);
      doc.fontSize(11).font('Helvetica')
         .text(`Name: ${preorder.customerName || 'N/A'}`, 60, 270)
         .text(`Phone: ${preorder.customerPhone || 'N/A'}`, 300, 270)
         .text(`Address: ${preorder.customerAddress || 'N/A'}`, 60, 290)
         

      // Item Details Table
      const tableTop = 340;
      const tableHeaders = ['Item', 'Material', 'Weight', 'Price/g', 'Making/g', 'Amount'];
      const colWidths = [100, 80, 80, 80, 80, 75];

      // Draw Table Header
      doc.rect(50, tableTop, 495, 30).stroke();
      doc.font('Helvetica-Bold');
      tableHeaders.forEach((header, i) => {
          let xPos = 60 + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.text(header, xPos, tableTop + 10);
      });

      // Calculate and format amounts
      const weight = safeParseFloat(preorder.weight);
      const pricePerGram = safeParseFloat(preorder.pricePerGram);
      const makingChargesPerGram = safeParseFloat(preorder.makingChargesPerGram);
      const amount = weight * (pricePerGram + makingChargesPerGram);

      // Draw Table Row
      doc.rect(50, tableTop + 30, 495, 30).stroke();
      doc.font('Helvetica');
      
      const rowData = [
          preorder.itemName || 'N/A',
          `${preorder.material || 'N/A'} ${preorder.material === 'Gold' ? (preorder.karat + 'K') : ''}`,
          `${weight}g`,
          `₹${pricePerGram.toFixed(2)}`,
          `₹${makingChargesPerGram.toFixed(2)}`,
          `₹${amount.toFixed(2)}`
      ];

      rowData.forEach((data, i) => {
          let xPos = 60 + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
          doc.text(data, xPos, tableTop + 40);
      });

      let yPosition = 420;

      // Safely handle old jewelry data
      const hasOldJewelry = preorder.oldJewelry && safeParseFloat(safeGetValue(preorder, 'oldJewelry.amountDeducted')) > 0;
      
      if (hasOldJewelry) {
          doc.rect(50, yPosition, 495, 90).stroke();
          doc.fontSize(14).font('Helvetica-Bold')
             .text('Old Jewelry Exchange', 60, yPosition + 10);
          doc.fontSize(11).font('Helvetica')
             .text(`Material: ${safeGetValue(preorder, 'oldJewelry.material', 'N/A')}`, 60, yPosition + 30)
             .text(`Item: ${safeGetValue(preorder, 'oldJewelry.itemName', 'N/A')}`, 300, yPosition + 30)
             .text(`Weight: ${safeParseFloat(safeGetValue(preorder, 'oldJewelry.weight', 0))}g`, 60, yPosition + 50)
             .text(`Amount Deducted: ₹${safeParseFloat(safeGetValue(preorder, 'oldJewelry.amountDeducted', 0)).toFixed(2)}`, 300, yPosition + 50);
          yPosition += 110;
      }

      // Payment Summary Section
      doc.rect(50, yPosition, 495, 160).lineWidth(1).stroke();
      doc.fontSize(14).font('Helvetica-Bold')
         .text('Payment Summary', 60, yPosition + 10);

      // Format all monetary values
      const oldJewelryDeduction = safeParseFloat(safeGetValue(preorder, 'oldJewelry.amountDeducted', 0));
      const discount = safeParseFloat(preorder.discount);
      const totalAmount = safeParseFloat(preorder.totalAmount);
      const paidAmount = safeParseFloat(preorder.paidAmount);
      const remainingAmount = safeParseFloat(preorder.remainingAmount);

      // Payment Details Rows
      const paymentRows = [
          ['Subtotal:', `₹${amount.toFixed(2)}`],
          ['Old Jewelry Deduction:', `₹${oldJewelryDeduction.toFixed(2)}`],
          ['Discount:', `₹${discount.toFixed(2)}`],
          ['Grand Total:', `₹${totalAmount.toFixed(2)}`],
          ['Paid Amount:', `₹${paidAmount.toFixed(2)}`],
          ['Remaining Amount:', `₹${remainingAmount.toFixed(2)}`]
      ];

      paymentRows.forEach((row, i) => {
          const isTotal = i > 2;
          doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
             .fontSize(11)
             .text(row[0], 60, yPosition + 40 + (i * 20))
             .text(row[1], 400, yPosition + 40 + (i * 20));
      });

      // Footer
      doc.fontSize(10)
         .text('Thank you for choosing us!', { align: 'center' })
         .fontSize(8)
         .text('This is a computer-generated invoice.', { align: 'center' });

      // Finalize the PDF
      doc.end();

  } catch (error) {
      console.error("Invoice generation error:", error);
      
      // Clean up PDF document if it exists
      if (doc) {
          try {
              doc.end();
          } catch (e) {
              console.error("Error closing PDF document:", e);
          }
      }

      // Only send error response if headers haven't been sent
      if (!res.headersSent) {
          res.status(500).json({ 
              error: "Failed to generate invoice", 
              details: error.message 
          });
      }
  }
});
  

module.exports = router;

  



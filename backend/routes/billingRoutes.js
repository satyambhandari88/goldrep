// routes/billingRoutes.js
const express = require("express");
const mongoose = require("mongoose");
const Bill = require("../models/Bill");
const Inventory = require("../models/Inventory");
const User = require("../models/User");
const Udhaar = require("../models/Udhaar");
const authMiddleware = require("../middleware/auth");
const PDFDocument = require("pdfkit");
const router = express.Router();
const jwt = require("jsonwebtoken");

router.use(authMiddleware);



router.post("/create", async (req, res) => {
  try {
    const billData = { ...req.body, userId: req.user.userId };

    billData.items = billData.items.map(item => {
      // Remove inventoryItemId if it's empty or null
      if (!item.inventoryItemId) {
        const { inventoryItemId, ...cleanedItem } = item;
        return cleanedItem;
      }
      return item;
    });

    billData.items.forEach((item) => {
      if (item.makingChargeType === "perGram") {
        item.makingCharges = item.makingChargeValue * item.weight;
      } else {
        item.makingCharges = (item.makingChargeValue / 100) * (item.pricePerGram * item.weight);
      }
      item.total = item.weight * item.pricePerGram + item.makingCharges;
    });

    if (billData.paymentType === "Full") {
      billData.status = "Paid";
      billData.remainingAmount = 0;
    } else {
      billData.status = billData.paidAmount > 0 ? "Partial" : "Pending";
      billData.remainingAmount = billData.grandTotal - billData.paidAmount;
    }
    
    // Update inventory if items were selected from stock
    for (const item of billData.items) {
      // Only update inventory if inventoryItemId is provided
      if (item.inventoryItemId) {
        const inventoryItem = await Inventory.findById(item.inventoryItemId);
        
        if (!inventoryItem) {
          return res.status(400).json({ error: `Inventory item not found for ${item.itemName}` });
        }
        
        // Check if enough stock is available
        if (inventoryItem.weight < item.weight) {
          return res.status(400).json({ 
            error: `Not enough stock for ${item.itemName}. Available: ${inventoryItem.weight}g, Required: ${item.weight}g` 
          });
        }
        
        // Update inventory
        await Inventory.findByIdAndUpdate(item.inventoryItemId, {
          $inc: { weight: -item.weight }
        });
      }
    }
    
    const bill = new Bill(billData);
    await bill.save();

    // ✅ Store Udhaar data only if payment type is Udhaar
    // In billingRoutes.js, when creating a new Udhaar record
if (bill.paymentType === "Udhaar") {
  let udhaarRecord = await Udhaar.findOne({ 
    userId: bill.userId,
    customerPhone: bill.customerPhone 
  });

  // Calculate the remaining amount
  const remainingAmount = bill.grandTotal - bill.paidAmount;

  if (!udhaarRecord) {
    // Create new Udhaar record
    udhaarRecord = new Udhaar({
      userId: bill.userId,
      customerName: bill.customerName,
      customerPhone: bill.customerPhone,
      totalRemaining: remainingAmount, // Set initial total remaining
      bills: [{
        billId: bill._id,
        totalAmount: bill.grandTotal,
        paidAmount: bill.paidAmount,
        remainingAmount: remainingAmount,
        date: bill.date,
        payments: bill.paidAmount > 0 ? [
          { 
            amount: bill.paidAmount,
            date: new Date()
          }
        ] : []
      }]
    });
  } else {
    // Update existing Udhaar record
    udhaarRecord.totalRemaining = (udhaarRecord.totalRemaining || 0) + remainingAmount;
    udhaarRecord.bills.push({
      billId: bill._id,
      totalAmount: bill.grandTotal,
      paidAmount: bill.paidAmount,
      remainingAmount: remainingAmount,
      date: bill.date,
      payments: bill.paidAmount > 0 ? [
        { 
          amount: bill.paidAmount,
          date: new Date()
        }
      ] : []
    });
  }

  // Save and log the record
  await udhaarRecord.save();
  console.log("Saved Udhaar Record:", JSON.stringify(udhaarRecord, null, 2));
}

    res.status(201).json({ message: "Bill created successfully", bill });
  } catch (error) {
    console.error("❌ Error creating bill:", error);
    res.status(500).json({ error: "Failed to create bill" });
  }
});


router.get("/invoice/:id", async (req, res) => {
  try {
    // Authentication checks remain the same
    let token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) token = req.query.token;
    if (!token) return res.status(401).json({ error: "Authentication required" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const bill = await Bill.findOne({
      _id: req.params.id,
      userId: decoded.userId,
    }).populate("userId", "shopName gstNo address phone logo");

    if (!bill) return res.status(404).json({ error: "Bill not found" });

    // Validation checks remain the same
    if (!bill.items?.length || !bill.customerName || !bill.customerPhone) {
      return res.status(400).json({ error: "Invalid bill data" });
    }

    // Format number function remains the same
    const formatNumber = (num) => {
      if (typeof num === 'string' && num.includes('e')) {
        num = parseFloat(num);
      }
      return new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(num);
    };

    // Colors remain the same
    const colors = {
      primary: '#1e3799',
      secondary: '#e84118',
      headerBg: '#f1f2f6',
      lightBlue: '#c8d6e5',
      lightRed: '#ff7675'
    };

    // Calculate totals remain the same
    bill.subtotal = bill.subtotal || bill.items.reduce((sum, item) => sum + (item.total || 0), 0);
    bill.igst = bill.isGSTBill ? bill.subtotal * 0.015 : 0;
    bill.sgst = bill.isGSTBill ? bill.subtotal * 0.015 : 0;
    bill.grandTotal = bill.subtotal + bill.igst + bill.sgst - (bill.discount || 0) - (bill.oldJewelryTotal || 0);

    // Calculate dynamic page height based on number of items
    const baseHeight = 421; // Base height (half A4)
    const itemHeight = 18; // Height per item
    const headerHeight = 175; // Total height of header sections
    const footerHeight = 40; // Height of footer section
    const minHeight = baseHeight;
    
    // Calculate required height for all content
    const requiredHeight = headerHeight + (bill.items.length * itemHeight) + footerHeight;
    const pageHeight = Math.max(minHeight, requiredHeight);

    // Create PDF document with dynamic height
    const doc = new PDFDocument({ 
      size: [595, pageHeight],
      margin: 20,
      autoFirstPage: false
    });

    // Add first page with calculated dimensions
    doc.addPage({
      size: [595, pageHeight],
      margin: 20
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${bill.isGSTBill ? `invoice-${bill.billNumber}` : 'receipt'}.pdf`);
    doc.pipe(res);

    let y = 20; // Initial y-position

    // Header section remains the same
    doc.fontSize(20).font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text(bill.userId.shopName, 30, y + 2, { align: "center" });

    doc.fontSize(8).font('Helvetica')
       .fillColor(colors.secondary);
    
    if (bill.isGSTBill) {
      doc.text(`GST No: ${bill.userId.gstNo}`, { align: "center" });
    }
    
    doc.text(bill.userId.address, { align: "center" })
       .text(`Phone: ${bill.userId.phone}`, { align: "center" });

    y += 70;

    // Document type header
    doc.rect(20, y, 555, 25).fill(colors.headerBg);
    doc.rect(20, y, 555, 25).lineWidth(1).stroke(colors.primary);
    
    doc.fontSize(9).font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text(bill.isGSTBill ? 'TAX INVOICE' : 'CASH MEMO', 30, y + 8);

    if (bill.isGSTBill) {
      doc.fontSize(9).font('Helvetica')
         .fillColor(colors.secondary)
         .text(`Bill No: ${bill.billNumber}`, 400, y + 6);
    }
    
    doc.text(`Date: ${new Date(bill.date).toLocaleDateString('en-IN')}`, 400, y + 12);

    y += 35;

    // Customer Details section
    doc.rect(20, y, 555, 50).lineWidth(1).stroke(colors.primary);
    doc.rect(20, y, 555, 20).fill(colors.lightBlue);
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text('CUSTOMER DETAILS', 30, y + 8);

    doc.fontSize(9).font('Helvetica')
       .fillColor('#000000')
       .text(`Name: ${bill.customerName}`, 30, y + 25)
       .text(`Phone: ${bill.customerPhone}`, 280, y + 30)
       .text(`Address: ${bill.customerAddress || ''}`, 30, y + 40);

    y += 60;

    // Items Table with fixed width
    const tableTop = y;
    const tableWidth = 400;
    
    // Table header
    doc.rect(20, y, tableWidth, 20).fill(colors.lightBlue);
    doc.rect(20, y, tableWidth, 20).lineWidth(1).stroke(colors.primary);
    
    const columns = [
      { x: 25, w: 70, text: 'CATEGORY' },
      { x: 95, w: 50, text: 'TYPE' },
      { x: 145, w: 50, text: 'WEIGHT (g)' },
      { x: 195, w: 70, text: 'PRICE/g' },
      { x: 265, w: 70, text: 'MAKING' },
      { x: 335, w: 70, text: 'TOTAL' }
    ];
    
    doc.font('Helvetica-Bold').fontSize(8)
       .fillColor(colors.primary);
    
    columns.forEach(col => {
      doc.text(col.text, col.x, y + 6);
    });
    
    y += 20;
    
    // Table rows
    bill.items.forEach((item, i) => {
      if (i % 2 === 0) {
        doc.rect(20, y, tableWidth, itemHeight).fill('#f8f9fa');
      }
      doc.rect(20, y, tableWidth, itemHeight).stroke(colors.primary);
      
      let makingChargeDisplay = item.makingChargeType === 'perGram' 
        ? `${formatNumber(item.makingChargeValue)}/g`
        : `${formatNumber(item.makingChargeValue)}%`;
    
      doc.font('Helvetica').fontSize(8)
         .fillColor('#000000')
         .text(item.category, columns[0].x, y + 4)
         .text(item.type, columns[1].x, y + 4)
         .text(formatNumber(item.weight), columns[2].x, y + 4)
         .text(formatNumber(item.pricePerGram), columns[3].x, y + 4)
         .text(makingChargeDisplay, columns[4].x, y + 4)
         .text(formatNumber(item.total), columns[5].x, y + 4);
      
      y += itemHeight;
    });

    // Payment Summary (aligned with items table)
    const summaryWidth = 160;
    const summaryX = 20 + tableWidth + 10;

    doc.rect(summaryX, tableTop, summaryWidth, 123).stroke(colors.primary);
    doc.rect(summaryX, tableTop, summaryWidth, 20).fill(colors.lightBlue);
    
    doc.fontSize(10).font('Helvetica-Bold')
       .fillColor(colors.primary)
       .text('PAYMENT SUMMARY', summaryX + 10, tableTop + 5);

    const paymentDetails = [
      ['Subtotal:', `${formatNumber(bill.subtotal)}`],
      ['Discount:', `${formatNumber(bill.discount || 0)}`]
    ];

    if (bill.oldJewelryTotal > 0) {
      paymentDetails.push(['Old Jewelry Total:', `${formatNumber(bill.oldJewelryTotal)}`]);
    }

    if (bill.isGSTBill) {
      paymentDetails.push(
        ['IGST (1.5%):', `${formatNumber(bill.igst)}`],
        ['SGST (1.5%):', `${formatNumber(bill.sgst)}`]
      );
    }

    paymentDetails.push(['Grand Total:', `${formatNumber(bill.grandTotal)}`]);

    if (bill.paymentType === 'Udhaar') {
      paymentDetails.push(
        ['Paid Amount:', `${formatNumber(bill.paidAmount || 0)}`],
        ['Remaining:', `${formatNumber(bill.remainingAmount || 0)}`]
      );
    }

    // Draw payment details
    paymentDetails.forEach((row, i) => {
      const isTotal = i === paymentDetails.length - 1;
      const yPos = tableTop + 25 + (i * 15);
      
      if (isTotal) {
        doc.rect(summaryX + 5, yPos - 5, summaryWidth - 10, 20).fill(colors.lightBlue);
      }

      doc.font(isTotal ? 'Helvetica-Bold' : 'Helvetica')
         .fontSize(isTotal ? 10 : 8)
         .fillColor(isTotal ? colors.primary : '#000000')
         .text(row[0], summaryX + 10, yPos)
         .text(row[1], summaryX + summaryWidth - 60, yPos);
    });

    // Footer (at the bottom of the page)
    const footerY = pageHeight - footerHeight -5;
    
    doc.fontSize(8)
       .fillColor(colors.primary)
       .text('Thank you for your business!', 20, footerY, { align: 'center' });

    if (bill.remainingAmount > 0) {
      doc.fontSize(7)
         .fillColor(colors.secondary)
         .text('This is a credit bill. Please clear the remaining amount as per agreed terms.', 
               20, footerY + 8, { align: 'center' });
    }

    doc.fontSize(6)
       .fillColor(colors.primary)
       .text('This is a digital bill generated by GOLDREP (Reporev Technologies Pvt. Ltd.)', 20, footerY + 16, { align: 'center' });

    doc.end();
  } catch (error) {
    console.error("Invoice generation error:", error);
    return res.status(500).json({ error: "Failed to generate invoice", details: error.message });
  }
});

module.exports = router;

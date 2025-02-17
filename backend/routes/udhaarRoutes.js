const express = require("express");
const mongoose = require("mongoose");
const Udhaar = require("../models/Udhaar");
const authMiddleware = require("../middleware/auth");
const jwt = require("jsonwebtoken"); // ✅ Import authentication middleware

const router = express.Router();

router.use(authMiddleware);

// ✅ Fetch all Udhaar transactions

router.get("/all", async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: "Unauthorized: No user ID found" });
      }
  
      const udhaarRecords = await Udhaar.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.user.userId),
          },
        },
        {
          $group: {
            _id: "$customerPhone",
            customerName: { $first: "$customerName" },
            customerPhone: { $first: "$customerPhone" },
            totalRemaining: { $sum: { $sum: "$bills.remainingAmount" } }, // Summing remaining amounts
            bills: {
              $push: {
                billId: "$bills.billId",
                totalAmount: "$bills.totalAmount",
                paidAmount: "$bills.paidAmount",
                remainingAmount: "$bills.remainingAmount",
                date: "$bills.date",
                payments: "$bills.payments",
              },
            },
          },
        },
        {
          $match: {
            totalRemaining: { $gt: 0 },
          },
        },
        { $sort: { totalRemaining: -1 } },
      ]);
  
      console.log("Aggregated Records:", JSON.stringify(udhaarRecords, null, 2));
      return res.json(udhaarRecords);
    } catch (error) {
      console.error("❌ Error fetching Udhaar records:", error);
      res.status(500).json({ error: "Failed to fetch Udhaar records" });
    }
  });
  




  router.get("/:phone", async (req, res) => {
    try {
      const customerPhone = req.params.phone;
      console.log("Fetching Udhaar records for customer:", customerPhone);
  
      const udhaarRecord = await Udhaar.findOne({ customerPhone }).populate("bills.billId");
  
      if (!udhaarRecord) {
        return res.status(404).json({ error: "No Udhaar records found for this customer" });
      }
  
      const aggregatedData = {
        customerName: udhaarRecord.customerName,
        customerPhone: udhaarRecord.customerPhone,
        totalRemaining: udhaarRecord.totalRemaining,
        bills: udhaarRecord.bills.map((bill) => ({
          billId: bill.billId._id,
          totalAmount: bill.totalAmount,
          paidAmount: bill.paidAmount,
          remainingAmount: bill.remainingAmount,
          date: bill.date,
          payments: bill.payments,
          status: bill.billId.status,
        })),
      };
  
      console.log("Aggregated Udhaar Data:", JSON.stringify(aggregatedData, null, 2));
      res.json(aggregatedData);
    } catch (error) {
      console.error("❌ Error fetching Udhaar details:", error);
      res.status(500).json({ error: "Failed to fetch Udhaar details" });
    }
  });
  
  
  
  
  
  



  router.put("/pay/:phone", async (req, res) => {
    try {
      const { amount } = req.body;
      const customerPhone = req.params.phone;
  
      let udhaarRecord = await Udhaar.findOne({ customerPhone });
  
      if (!udhaarRecord) {
        return res.status(404).json({ error: "No active Udhaar record found" });
      }
  
      let remainingPayment = amount;
  
      // Deduct from oldest Udhaar bills first
      for (let bill of udhaarRecord.bills) {
        if (bill.remainingAmount > 0) {
          let deduction = Math.min(bill.remainingAmount, remainingPayment);
          bill.remainingAmount -= deduction;
          bill.paidAmount += deduction;
          remainingPayment -= deduction;
  
          bill.payments.push({ amount: deduction, date: new Date() });
  
          if (remainingPayment === 0) break;
        }
      }
  
      // Update total remaining Udhaar for customer
      udhaarRecord.totalRemaining -= amount;
      await udhaarRecord.save();
  
      res.json({ message: "Payment successful", udhaarRecord });
    } catch (error) {
      console.error("❌ Error processing payment:", error);
      res.status(500).json({ error: "Failed to process payment" });
    }
  });
  
  
  

module.exports = router;

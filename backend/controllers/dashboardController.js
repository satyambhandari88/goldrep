const Bill = require("../models/Bill");
const Udhaar = require("../models/Udhaar");
const User = require("../models/User");
const Inventory = require("../models/Inventory");
const mongoose = require("mongoose");

// Helper function for try-catch wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ✅ Get shop overview stats
const getShopStats = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    console.log("Fetching shop stats for user ID:", userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's bills
  const todayBills = await Bill.find({
    userId,
    date: { $gte: today, $lt: tomorrow }
  });

  if (!todayBills.length) {
    console.log("⚠️ No bills found for today");
    return res.status(200).json({
      success: true,
      data: {
        totalBilling: 0,
        paidAmount: 0,
        totalUdhaar: 0,
        newCustomers: 0
      }
    });
  }

  // Calculate today's totals
  const stats = todayBills.reduce((acc, bill) => ({
    totalBilling: acc.totalBilling + (bill.grandTotal || 0),
    paidAmount: acc.paidAmount + (bill.paidAmount || 0),
    totalUdhaar: acc.totalUdhaar + (bill.paymentType === "Udhaar" ? (bill.remainingAmount || 0) : 0)
  }), { totalBilling: 0, paidAmount: 0, totalUdhaar: 0 });

  // Get unique customers today
  const uniqueCustomers = new Set(todayBills.map(bill => bill.customerPhone));

  console.log("✅ Shop Stats:", stats);
  res.json({
    success: true,
    data: {
      ...stats,
      newCustomers: uniqueCustomers.size
    }
  });
});

// ✅ Get sales analysis
const getSalesAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { timeframe = "weekly" } = req.query;
    const now = new Date();

    let start = new Date();
    let end = new Date();
    end.setHours(23, 59, 59, 999); // Include full day

    switch (timeframe) {
        case "weekly":
            start.setDate(now.getDate() - 7);
            break;
        case "monthly":
            start.setMonth(now.getMonth() - 1);
            break;
        case "yearly":
            start.setFullYear(now.getFullYear() - 1);
            break;
        default:
            start.setDate(now.getDate() - 7);
    }

    console.log("🔍 Sales Date Range:", start.toISOString(), "to", end.toISOString());

    // Fetch and log raw sales data
    // const salesRawData = await Bill.find({
    //     userId,
    //     date: { $gte: start, $lte: end }
    // }).limit(5);
    // console.log("📜 Sample Sales Data:", salesRawData);

    const salesData = await Bill.aggregate([
        {
            $match: {
                 userId: new mongoose.Types.ObjectId(req.user.userId),
                date: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: { format: "%Y-%m-%d", date: "$date" }
                    }
                },
                totalSales: { $sum: "$grandTotal" },
                count: { $sum: 1 }
            }
        },
        { $sort: { "_id.date": 1 } }
    ]);

    console.log("✅ Sales Analysis:", salesData);
    res.json({ success: true, data: salesData });
});


  

// ✅ Get inventory analysis
const getInventoryAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

  const inventoryData = await Inventory.aggregate([
    {
      $match: {  userId: new mongoose.Types.ObjectId(req.user.userId), }
    },
    {
      $group: {
        _id: { type: "$type", category: "$category" },
        totalItems: { $sum: 1 },
        totalWeight: { $sum: "$weight" },
        averagePrice: { $avg: "$pricePerGram" }
      }
    }
  ]);

//   console.log("✅ Inventory Analysis:", inventoryData);
  res.json({ success: true, data: inventoryData });
});

// ✅ Get Udhaar analysis
const getUdhaarAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

  const udhaarData = await Udhaar.aggregate([
    {
      $match: { userId }
    },
    {
      $unwind: "$bills"
    },
    {
      $group: {
        _id: null,
        totalUdhaar: { $sum: "$bills.remainingAmount" },
        totalCustomers: { $addToSet: "$customerPhone" },
        averageUdhaar: { $avg: "$bills.remainingAmount" }
      }
    }
  ]);

//   console.log("✅ Udhaar Analysis:", udhaarData);
  res.json({ success: true, data: udhaarData[0] });
});

// ✅ Get metal prices trends
const getMetalPrices = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log("Fetching metal prices for user:", userId);

    const dateRange = { start: new Date(new Date().setDate(new Date().getDate() - 30)), end: new Date() };

    const metalPrices = await Bill.aggregate([
      {
        $match: {
          userId,
          date: { $gte: dateRange.start, $lt: dateRange.end }
        }
      },
      {
        $unwind: "$items"
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
            type: "$items.type"
          },
          averagePrice: { $avg: "$items.pricePerGram" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    if (!metalPrices.length) {
      console.log("⚠️ No metal price data found");
      return res.json({ success: true, data: [] });
    }

    console.log("✅ Metal Prices Fetched:", metalPrices);
    res.json({ success: true, data: metalPrices });
  } catch (error) {
    console.error("🔥 Metal Prices Fetch Error:", error.message);
    res.status(500).json({ success: false, error: "Failed to fetch metal prices", details: error.message });
  }
});

// ✅ Export all functions
module.exports = {
  getShopStats,
  getSalesAnalysis,
  getInventoryAnalysis,
  getUdhaarAnalysis,
  getMetalPrices
};

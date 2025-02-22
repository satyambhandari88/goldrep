// routes/inventoryRoutes.js
const express = require("express");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Add New Inventory Item
router.post("/add", async (req, res) => {
  try {
      console.log("🆔 Extracted User ID:", req.user.userId); // Debugging log

      if (!req.user.userId) {
          return res.status(401).json({ error: "User not authenticated (User ID Missing)" });
      }

      const { itemName, category, material, karat, weight, thresholdWeight } = req.body;

      const newItem = new Inventory({
          userId: req.user.userId, // ✅ Now it correctly assigns `userId`
          itemName,
          category,
          material,
          karat: material === "Gold" ? karat : undefined,
          weight,
          thresholdWeight
      });

      await newItem.save();
      console.log("✅ Inventory item added:", newItem);
      res.status(201).json({ success: true, message: "Item added successfully", item: newItem });

  } catch (error) {
      console.error("🔥 Error saving inventory:", error);
      res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});








// View All Items
router.get("/all", async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await Inventory.find({ userId });
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Error fetching inventory", details: error.message });
  }
});

// Update Item
router.put("/update/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const updatedData = req.body;

    delete updatedData.material;
    delete updatedData.userId;

    const updatedItem = await Inventory.findOneAndUpdate(
      { _id: id, userId },
      updatedData,
      { new: true }
    );

    if (!updatedItem) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item Updated", item: updatedItem });
  } catch (error) {
    res.status(500).json({ error: "Update Failed", details: error.message });
  }
});

// Delete Item
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const deletedItem = await Inventory.findOneAndDelete({ _id: id, userId });
    if (!deletedItem) return res.status(404).json({ error: "Item not found" });

    res.json({ message: "Item Deleted", item: deletedItem });
  } catch (error) {
    res.status(500).json({ error: "Delete Failed", details: error.message });
  }
});

// Check Low Stock Alert
router.get("/low-stock", async (req, res) => {
  try {
    const userId = req.user.userId;
    const lowStockItems = await Inventory.find({
      userId,
      $expr: { $lt: ["$weight", "$thresholdWeight"] }
    });

    if (lowStockItems.length === 0) {
      return res.json({ message: "All items are in stock" });
    }

    res.json({ message: "Low Stock Alert", items: lowStockItems });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch low stock items", details: error.message });
  }
});

module.exports = router;
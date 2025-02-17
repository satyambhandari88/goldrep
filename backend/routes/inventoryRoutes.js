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
    const { itemName, category, material, karat, weight, thresholdWeight } = req.body;
    const userId = req.user.userId;

    if (material === "Gold" && ![18, 20, 21, 22, 23, 24].includes(karat)) {
      return res.status(400).json({ error: "Invalid Gold Karat Value" });
    }

    const newItem = new Inventory({
      userId,
      itemName,
      category,
      material,
      karat: material === "Gold" ? karat : undefined,
      weight,
      thresholdWeight,
    });

    await newItem.save();
    res.status(201).json({ message: "Item Added Successfully", item: newItem });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error", details: error.message });
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
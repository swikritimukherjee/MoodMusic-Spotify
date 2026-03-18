const express = require("express");
const MoodHistory = require("../models/MoodHistory");

const router = express.Router();

router.post("/mood", async (req, res) => {
  try {
    const { userId, mood } = req.body;

    if (!userId || !mood) {
      return res.status(400).json({ message: "userId and mood are required" });
    }

    const record = await MoodHistory.create({
      userId,
      mood,
      timestamp: new Date(),
    });

    return res.status(201).json({ message: "Mood saved", record });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save mood", error: error.message });
  }
});

module.exports = router;

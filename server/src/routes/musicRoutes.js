const express = require("express");
const { searchTracks } = require("../services/spotifyService");

const router = express.Router();

router.get("/music", async (req, res) => {
  try {
    const query = req.query.query?.toString().trim();

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    const tracks = await searchTracks(query, 10);

    return res.status(200).json({ tracks });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch music", error: error.message });
  }
});

module.exports = router;

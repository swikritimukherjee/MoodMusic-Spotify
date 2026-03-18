const express = require("express");
const Playlist = require("../models/Playlist");

const router = express.Router();

router.get("/playlists", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const playlists = await Playlist.find({ userId }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ playlists });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch playlists", error: error.message });
  }
});

router.post("/playlists", async (req, res) => {
  try {
    const { userId, name, description, mood, songs } = req.body;

    if (!userId || !name) {
      return res.status(400).json({ message: "userId and name are required" });
    }

    const playlist = await Playlist.create({
      userId,
      name,
      description: description || "",
      mood: mood || "mixed",
      songs: Array.isArray(songs) ? songs : [],
    });

    return res.status(201).json({ message: "Playlist created", playlist });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create playlist", error: error.message });
  }
});

router.put("/playlists/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, mood, songs } = req.body;

    const updates = {};

    if (typeof name === "string") updates.name = name.trim();
    if (typeof description === "string") updates.description = description.trim();
    if (typeof mood === "string") updates.mood = mood.trim();
    if (Array.isArray(songs)) updates.songs = songs;

    const playlist = await Playlist.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!playlist) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.status(200).json({ message: "Playlist updated", playlist });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update playlist", error: error.message });
  }
});

router.delete("/playlists/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Playlist.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({ message: "Playlist not found" });
    }

    return res.status(200).json({ message: "Playlist deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete playlist", error: error.message });
  }
});

module.exports = router;

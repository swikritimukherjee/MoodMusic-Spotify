const express = require("express");
const SongInteraction = require("../models/SongInteraction");

const router = express.Router();

router.post("/song-interaction", async (req, res) => {
  try {
    const { userId, songId, title, artist, image, spotifyUrl, mood, liked, note } = req.body;

    if (!userId || !songId || !title || !artist) {
      return res.status(400).json({
        message: "userId, songId, title, and artist are required",
      });
    }

    const existing = await SongInteraction.findOne({ userId, songId });
    const interaction = await SongInteraction.findOneAndUpdate(
      { userId, songId },
      {
        $set: {
          title,
          artist,
          image: image || existing?.image || "",
          spotifyUrl: spotifyUrl || existing?.spotifyUrl || "",
          mood: mood || existing?.mood || "search",
          liked: existing?.liked ? true : Boolean(liked),
          note: typeof note === "string" ? note : existing?.note || "",
          timestamp: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(201).json({ message: "Song interaction saved", interaction });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save song interaction", error: error.message });
  }
});

router.put("/song-interaction/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artist, image, spotifyUrl, mood, liked, note } = req.body;

    const updates = {};

    if (typeof title === "string") updates.title = title.trim();
    if (typeof artist === "string") updates.artist = artist.trim();
    if (typeof image === "string") updates.image = image.trim();
    if (typeof spotifyUrl === "string") updates.spotifyUrl = spotifyUrl.trim();
    if (typeof mood === "string") updates.mood = mood.trim();
    if (typeof liked === "boolean") updates.liked = liked;
    if (typeof note === "string") updates.note = note.trim();
    updates.timestamp = new Date();

    const interaction = await SongInteraction.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!interaction) {
      return res.status(404).json({ message: "Song interaction not found" });
    }

    return res.status(200).json({ message: "Song interaction updated", interaction });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update song interaction", error: error.message });
  }
});

router.delete("/song-interaction/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await SongInteraction.findByIdAndDelete(id).lean();

    if (!deleted) {
      return res.status(404).json({ message: "Song interaction not found" });
    }

    return res.status(200).json({ message: "Song interaction deleted" });
  } catch (error) {
    return res.status(500).json({ message: "Failed to delete song interaction", error: error.message });
  }
});

module.exports = router;

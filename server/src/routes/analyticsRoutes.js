const express = require("express");
const mongoose = require("mongoose");
const MoodHistory = require("../models/MoodHistory");
const SongInteraction = require("../models/SongInteraction");

const router = express.Router();

router.get("/analytics", async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);

    const moodDistribution = await MoodHistory.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: "$mood", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const mostSelectedMood = moodDistribution[0]?._id || null;

    const likedArtistResult = await SongInteraction.aggregate([
      { $match: { userId: userObjectId, liked: true } },
      { $group: { _id: "$artist", likes: { $sum: 1 } } },
      { $sort: { likes: -1 } },
      { $limit: 1 },
    ]);

    const mostLikedArtist = likedArtistResult[0]?._id || null;

    const recentlyPlayed = await SongInteraction.find({ userId: userObjectId })
      .sort({ timestamp: -1 })
      .limit(10)
      .select("songId title artist image spotifyUrl mood liked timestamp")
      .lean();

    const likedSongs = await SongInteraction.find({ userId: userObjectId, liked: true })
      .sort({ timestamp: -1 })
      .limit(50)
      .select("songId title artist image spotifyUrl mood liked note timestamp")
      .lean();

    const totalMoodLogs = await MoodHistory.countDocuments({ userId: userObjectId });
    const totalTracksTouched = await SongInteraction.countDocuments({ userId: userObjectId });

    const badges = [];

    if (totalMoodLogs >= 5) {
      badges.push({ key: "mood-explorer", name: "Mood Explorer", description: "Logged 5+ mood sessions." });
    }
    if (likedSongs.length >= 3) {
      badges.push({ key: "heart-beat", name: "Heart Beat", description: "Liked at least 3 songs." });
    }
    if (totalTracksTouched >= 10) {
      badges.push({ key: "crate-digger", name: "Crate Digger", description: "Interacted with 10+ unique tracks." });
    }
    if (mostLikedArtist) {
      badges.push({ key: "artist-fan", name: "Artist Fan", description: `You keep returning to ${mostLikedArtist}.` });
    }

    return res.status(200).json({
      mostSelectedMood,
      moodDistribution,
      mostLikedArtist,
      recentlyPlayed,
      likedSongs,
      badges,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
});

module.exports = router;

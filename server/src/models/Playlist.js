const mongoose = require("mongoose");

const playlistSongSchema = new mongoose.Schema(
  {
    songId: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    artist: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: "",
      trim: true,
    },
    spotifyUrl: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { _id: false }
);

const playlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    mood: {
      type: String,
      default: "mixed",
      trim: true,
      index: true,
    },
    songs: {
      type: [playlistSongSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Playlist", playlistSchema);

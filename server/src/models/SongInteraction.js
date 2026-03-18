const mongoose = require("mongoose");

const songInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
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
      index: true,
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
    mood: {
      type: String,
      default: "search",
      trim: true,
      index: true,
    },
    liked: {
      type: Boolean,
      default: false,
      index: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
      maxlength: 180,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    versionKey: false,
  }
);

module.exports = mongoose.model("SongInteraction", songInteractionSchema);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const authRoutes = require("./routes/authRoutes");
const musicRoutes = require("./routes/musicRoutes");
const moodRoutes = require("./routes/moodRoutes");
const songInteractionRoutes = require("./routes/songInteractionRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const playlistRoutes = require("./routes/playlistRoutes");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.status(200).json({ message: "Mood Music Intelligence API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api", musicRoutes);
app.use("/api", moodRoutes);
app.use("/api", songInteractionRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", playlistRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({ message: "Unexpected server error", error: error.message });
});

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is required in .env");
    }

    await mongoose.connect(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();

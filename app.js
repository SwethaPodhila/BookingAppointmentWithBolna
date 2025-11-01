require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const connectDB = require("./config/db");
const appointmentRoutes = require("./routes/appointment.routes");

const app = express();
app.use(express.json());

// ✅ Enable CORS for all routes (safe for Vapi)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: '*'
}));

// ✅ Connect to MongoDB
connectDB();

// ✅ Serve static frontend files (like index.html, CSS, JS)
app.use(express.static(path.join(__dirname, "public")));

// ✅ API Routes
app.use("/api", appointmentRoutes);

// ✅ Default route → render index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// API Routes
app.post("/api/login", require("./api/login.js"));
app.get("/api/auth-check", require("./api/auth-check.js"));
app.post("/api/book", require("./api/book.js"));
app.get("/api/booked-slots", require("./api/booked-slots.js"));
app.get("/api/transcripts", require("./api/transcripts.js"));

// Serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

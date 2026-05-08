const express = require("express");
const path = require("path");

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const vibes = [
  {
    id: 1,
    mood: "Peaceful",
    location: "Ella Rock",
    tip: "Start trek early morning to avoid crowds and catch sunrise.",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    mood: "Crowded",
    location: "Sigiriya",
    tip: "Book tickets online in advance. Weekdays are less busy than weekends.",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    mood: "Rainy but Beautiful",
    location: "Kandy Temple of the Tooth",
    tip: "Monsoonal rains make it cooler. Bring an umbrella!",
    createdAt: new Date().toISOString()
  }
];

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "destination-pulse" });
});

app.get("/api/vibes", (_req, res) => {
  const moodCounts = vibes.reduce((acc, item) => {
    acc[item.mood] = (acc[item.mood] || 0) + 1;
    return acc;
  }, {});

  res.json({
    total: vibes.length,
    moodCounts,
    items: vibes.slice().reverse()
  });
});

app.post("/api/vibes", (req, res) => {
  const { mood, location, tip } = req.body || {};

  if (!mood || !location || !tip) {
    return res.status(400).json({
      error: "mood, location, and tip are required"
    });
  }

  if (mood.length > 30 || location.length > 60 || tip.length > 200) {
    return res.status(400).json({
      error: "Input too long. Keep mood <= 30, location <= 60, tip <= 200."
    });
  }

  const newItem = {
    id: vibes.length + 1,
    mood: mood.trim(),
    location: location.trim(),
    tip: tip.trim(),
    createdAt: new Date().toISOString()
  };

  vibes.push(newItem);
  return res.status(201).json(newItem);
});

app.listen(port, () => {
  console.log(`Campus Vibe Board running on port ${port}`);
});

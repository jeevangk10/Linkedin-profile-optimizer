require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");

const authRoutes = require("./routes/auth");
const profileRoutes = require("./routes/profile");
const aiRoutes = require("./routes/ai");
const analysisRoutes = require("./routes/analyses");
const analysisSaveRoutes = require("./routes/analysisSave");

const app = express();
const PORT = Number(process.env.PORT || 5000);

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_, res) => res.json({ ok: true, service: "linkedin-profile-optimizer" }));

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/analyses", analysisRoutes);
app.use("/api/analysis", analysisSaveRoutes);

const frontendDist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(frontendDist));
app.get("*splat", (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  res.sendFile(path.join(frontendDist, "index.html"), err => {
    if (err) res.status(404).json({ error: "Frontend not built." });
  });
});

app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { cleanString } = require("../middleware/validation");

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: true });

function issue(res, user) {
  const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "7d" });
  res.cookie("access_token", token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

router.post("/register", limiter, async (req, res) => {
  try {
    const name = cleanString(req.body.name, 120);
    const email = cleanString(req.body.email, 190).toLowerCase();
    const password = String(req.body.password || "");
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
      return res.status(400).json({ error: "Name, valid email, and password of at least 8 characters are required." });
    }
    const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (existing.length) return res.status(409).json({ error: "An account with that email already exists." });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query("INSERT INTO users(name,email,password_hash) VALUES(?,?,?)", [name, email, hash]);
    await db.query("INSERT INTO profiles(user_id,full_name) VALUES(?,?)", [result.insertId, name]);
    issue(res, { id: result.insertId, email });
    res.status(201).json({ user: { id: result.insertId, name, email } });
  } catch (e) { console.error(e); res.status(500).json({ error: "Registration failed." }); }
});

router.post("/login", limiter, async (req, res) => {
  try {
    const email = cleanString(req.body.email, 190).toLowerCase();
    const password = String(req.body.password || "");
    const [rows] = await db.query("SELECT * FROM users WHERE email=?", [email]);
    if (!rows.length || !(await bcrypt.compare(password, rows[0].password_hash))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }
    issue(res, rows[0]);
    res.json({ user: { id: rows[0].id, name: rows[0].name, email: rows[0].email } });
  } catch (e) { res.status(500).json({ error: "Login failed." }); }
});

router.post("/logout", (req, res) => {
  res.clearCookie("access_token");
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) return res.status(401).json({ error: "Not authenticated." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await db.query("SELECT id,name,email FROM users WHERE id=?", [payload.id]);
    if (!rows.length) return res.status(401).json({ error: "Not authenticated." });
    res.json({ user: rows[0] });
  } catch { res.status(401).json({ error: "Not authenticated." }); }
});

module.exports = router;

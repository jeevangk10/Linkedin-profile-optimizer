const express = require("express");
const db = require("../db");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id,a.target_role,a.score,a.created_at
      FROM analyses a JOIN profiles p ON p.id=a.profile_id
      WHERE p.user_id=? ORDER BY a.created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ analyses: rows });
  } catch { res.status(500).json({ error: "Could not load analysis history." }); }
});

router.get("/:id", authRequired, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.* FROM analyses a JOIN profiles p ON p.id=a.profile_id
      WHERE a.id=? AND p.user_id=?`, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: "Analysis not found." });
    res.json({ analysis: rows[0] });
  } catch { res.status(500).json({ error: "Could not load analysis." }); }
});

router.delete("/:id", authRequired, async (req, res) => {
  try {
    const [result] = await db.query(`
      DELETE a FROM analyses a JOIN profiles p ON p.id=a.profile_id
      WHERE a.id=? AND p.user_id=?`, [req.params.id, req.user.id]);
    if (!result.affectedRows) return res.status(404).json({ error: "Analysis not found." });
    res.json({ ok: true });
  } catch { res.status(500).json({ error: "Could not delete analysis." }); }
});

module.exports = router;

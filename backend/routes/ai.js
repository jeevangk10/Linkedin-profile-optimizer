const express = require("express");
const rateLimit = require("express-rate-limit");
const { authRequired } = require("../middleware/auth");
const { analyzeProfile, generateText, chat } = require("../services/ai");

const router = express.Router();
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30 });

function failureMessage(error, operation) {
  if (error.status === 401 || error.status === 403) {
    return "AI provider rejected the credentials. Verify that AI_API_KEY matches the provider configured by AI_BASE_URL.";
  }
  if (error.status === 404) {
    return "AI endpoint or model was not found. Verify AI_BASE_URL and AI_MODEL.";
  }
  if (error.status === 429) {
    return "AI provider rate limit or quota reached. Check your provider account and try again later.";
  }
  if (error.status) {
    return `${operation} failed because the AI provider returned HTTP ${error.status}.`;
  }
  if (error instanceof TypeError) {
    return "Could not connect to the AI provider. Verify AI_BASE_URL and the server's network connection.";
  }
  return `${operation} failed. Check the server log for details.`;
}

router.post("/analyze", limiter, async (req, res) => {
  try { res.json({ analysis: await analyzeProfile(req.body.profile || {}) }); }
  catch (e) { console.error(e); res.status(502).json({ error: failureMessage(e, "AI analysis") }); }
});

router.post("/generate", limiter, async (req, res) => {
  try {
    const items = await generateText(req.body.task, req.body.profile || {}, req.body.extra || "");
    res.json({ items });
  } catch (e) { console.error(e); res.status(502).json({ error: failureMessage(e, "AI generation") }); }
});

router.post("/chat", limiter, authRequired, async (req, res) => {
  try {
    if (!req.body.message || String(req.body.message).length > 2000) return res.status(400).json({ error: "Enter a short question." });
    res.json({ answer: await chat(req.body.profile || {}, String(req.body.message)) });
  } catch (e) { console.error(e); res.status(502).json({ error: failureMessage(e, "AI assistant") }); }
});

module.exports = router;

const { demoAnalyze } = require("./demoAi");

const SYSTEM = `You are an expert professional-profile editor and career content assistant.
Analyze only information supplied by the user. Never invent employers, degrees, certifications, skills, achievements, metrics, job titles, responsibilities, or experience.
When information is missing, identify it as missing and provide suggestions rather than fabricating it.
Improve clarity, professionalism, specificity, readability, and relevance to the target role.
Use industry-relevant keywords naturally without keyword stuffing.
Preserve factual meaning. Separate existing facts from recommendations and suggested wording.
Never claim optimization guarantees interviews, employment, recruiter responses, or job offers.
Return only valid JSON matching the requested schema.`;

function providerError(status) {
  const error = new Error(`AI provider returned HTTP ${status}.`);
  error.status = status;
  return error;
}

function extractJson(text) {
  const clean = String(text || "").replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end < start) throw new Error("AI returned no JSON object.");
  return JSON.parse(clean.slice(start, end + 1));
}

function validateAnalysis(x) {
  if (!x || typeof x !== "object") throw new Error("Invalid analysis.");
  const required = ["overallScore", "scores", "strengths", "improvements", "quickWins",
    "headlineSuggestions", "aboutSuggestion", "experienceSuggestions",
    "existingKeywords", "suggestedKeywords", "missingInformation"];
  for (const k of required) if (!(k in x)) throw new Error(`AI response missing ${k}.`);
  x.overallScore = Math.max(0, Math.min(100, Number(x.overallScore) || 0));
  for (const key of ["completeness","headline","about","experience","skills","keywords","projects"]) {
    x.scores[key] = Math.max(0, Math.min(100, Number(x.scores[key]) || 0));
  }
  return x;
}

async function analyzeProfile(profile) {
  if (!process.env.AI_API_KEY) return demoAnalyze(profile);

  const response = await fetch(`${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Analyze this profile. Return the required structured JSON.\n${JSON.stringify(profile)}` }
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) throw providerError(response.status);
  const data = await response.json();
  return validateAnalysis(extractJson(data.choices?.[0]?.message?.content));
}

async function generateText(task, profile, extra = "") {
  if (!process.env.AI_API_KEY) {
    const demo = demoAnalyze(profile);
    if (task === "headline") return demo.headlineSuggestions;
    if (task === "about") return [demo.aboutSuggestion];
    return [demo.aboutSuggestion];
  }
  const response = await fetch(`${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `${task} generation. Return a JSON object with an "items" array of strings. ${extra}\nProfile:\n${JSON.stringify(profile)}` }
      ],
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) throw providerError(response.status);
  const data = await response.json();
  const parsed = extractJson(data.choices?.[0]?.message?.content);
  if (!Array.isArray(parsed.items)) throw new Error("Invalid AI generation response.");
  return parsed.items.slice(0, 10);
}

async function chat(profile, message) {
  if (!process.env.AI_API_KEY) {
    return "Demo assistant: use the profile facts you provided as the source of truth. I can suggest clearer wording, role-specific keywords, and ways to make achievements more concrete without inventing facts.";
  }
  const response = await fetch(`${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: `Answer this career/profile question using only the supplied profile context.\nQuestion: ${message}\nProfile: ${JSON.stringify(profile)}` }
      ]
    })
  });
  if (!response.ok) throw providerError(response.status);
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "No response.";
}

module.exports = { analyzeProfile, generateText, chat };

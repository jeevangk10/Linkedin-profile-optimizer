const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const db = require("../db");
const { authRequired } = require("../middleware/auth");
const { cleanString, validateProfile } = require("../middleware/validation");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    cb(null, allowed.includes(file.mimetype));
  }
});

async function getProfile(userId) {
  const [[p]] = await db.query("SELECT * FROM profiles WHERE user_id=?", [userId]);
  if (!p) return null;
  const [[experiences], [education], [skills], [certifications], [projects]] = await Promise.all([
    db.query("SELECT * FROM experiences WHERE profile_id=? ORDER BY start_date DESC", [p.id]),
    db.query("SELECT * FROM education WHERE profile_id=? ORDER BY graduation_year DESC", [p.id]),
    db.query("SELECT * FROM skills WHERE profile_id=? ORDER BY skill_name", [p.id]),
    db.query("SELECT * FROM certifications WHERE profile_id=? ORDER BY issue_date DESC", [p.id]),
    db.query("SELECT * FROM projects WHERE profile_id=? ORDER BY project_name", [p.id])
  ]);
  return {
    id: p.id, fullName: p.full_name, headline: p.headline || "", about: p.about || "",
    location: p.location || "", industry: p.industry || "", targetRole: p.target_role || "",
    yearsExperience: p.years_experience || 0,
    experiences, education, skills: skills.map(x => x.skill_name), certifications, projects
  };
}

router.get("/", authRequired, async (req, res) => {
  try { res.json({ profile: await getProfile(req.user.id) }); }
  catch { res.status(500).json({ error: "Could not load profile." }); }
});

router.put("/", authRequired, async (req, res) => {
  const errors = validateProfile(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });
  const p = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT id FROM profiles WHERE user_id=?", [req.user.id]);
    const profileId = rows[0]?.id;
    if (!profileId) throw new Error("Profile not found.");
    await conn.query(
      `UPDATE profiles SET full_name=?,headline=?,about=?,location=?,industry=?,target_role=?,years_experience=? WHERE id=?`,
      [cleanString(p.fullName,120), cleanString(p.headline,5000), cleanString(p.about,10000),
       cleanString(p.location,120), cleanString(p.industry,120), cleanString(p.targetRole,150),
       Number(p.yearsExperience || 0), profileId]
    );
    for (const table of ["experiences","education","skills","certifications","projects"]) {
      await conn.query(`DELETE FROM ${table} WHERE profile_id=?`, [profileId]);
    }
    for (const x of (p.experiences || [])) {
      await conn.query(
        `INSERT INTO experiences(profile_id,company,job_title,start_date,end_date,current_position,description,achievements) VALUES(?,?,?,?,?,?,?,?)`,
        [profileId, cleanString(x.company,160), cleanString(x.jobTitle,160), x.startDate || null, x.currentPosition ? null : (x.endDate || null),
         !!x.currentPosition, cleanString(x.description,10000), cleanString(x.achievements,10000)]
      );
    }
    for (const x of (p.education || [])) {
      await conn.query(
        `INSERT INTO education(profile_id,institution,degree,field_of_study,start_year,graduation_year,description) VALUES(?,?,?,?,?,?,?)`,
        [profileId, cleanString(x.institution,180), cleanString(x.degree,160), cleanString(x.fieldOfStudy,160),
         x.startYear || null, x.graduationYear || null, cleanString(x.description,5000)]
      );
    }
    for (const skill of (p.skills || []).slice(0,100)) {
      if (String(skill).trim()) await conn.query("INSERT INTO skills(profile_id,skill_name) VALUES(?,?)", [profileId, cleanString(skill,120)]);
    }
    for (const x of (p.certifications || [])) {
      await conn.query("INSERT INTO certifications(profile_id,certification_name,issuing_organization,issue_date) VALUES(?,?,?,?)",
        [profileId, cleanString(x.certificationName,180), cleanString(x.issuingOrganization,180), x.issueDate || null]);
    }
    for (const x of (p.projects || [])) {
      await conn.query("INSERT INTO projects(profile_id,project_name,description,technologies,project_url) VALUES(?,?,?,?,?)",
        [profileId, cleanString(x.projectName,180), cleanString(x.description,10000), cleanString(x.technologies,500), cleanString(x.projectUrl,500)]);
    }
    await conn.commit();
    res.json({ profile: await getProfile(req.user.id) });
  } catch (e) {
    await conn.rollback(); console.error(e);
    res.status(500).json({ error: "Could not save profile." });
  } finally { conn.release(); }
});

router.post("/resume", authRequired, upload.single("resume"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Upload a PDF or DOCX file under 5 MB." });
  try {
    let text = "";
    if (req.file.mimetype === "application/pdf") text = (await pdfParse(req.file.buffer)).text;
    else text = (await mammoth.extractRawText({ buffer: req.file.buffer })).value;
    res.json({ text: text.slice(0, 30000), filename: req.file.originalname });
  } catch { res.status(400).json({ error: "Could not extract text from that resume." }); }
});

module.exports = router;

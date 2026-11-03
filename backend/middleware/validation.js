function cleanString(value, max = 10000) {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, max);
}

function validateProfile(body) {
  const p = body || {};
  const errors = [];
  if (cleanString(p.fullName, 120).length > 120) errors.push("Name is too long.");
  if (cleanString(p.targetRole, 150).length > 150) errors.push("Target role is too long.");
  if (p.yearsExperience !== undefined && (Number(p.yearsExperience) < 0 || Number(p.yearsExperience) > 80)) {
    errors.push("Years of experience must be between 0 and 80.");
  }
  if (!Array.isArray(p.experiences)) errors.push("Experiences must be an array.");
  if (!Array.isArray(p.skills)) errors.push("Skills must be an array.");
  return errors;
}

module.exports = { cleanString, validateProfile };

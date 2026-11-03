function words(text) {
  return String(text || "").toLowerCase().match(/[a-z0-9+#.-]+/g) || [];
}

const ROLE_TERMS = {
  "full stack developer": ["javascript", "react", "node.js", "rest api", "sql", "git", "authentication", "database"],
  "frontend developer": ["javascript", "react", "html", "css", "accessibility", "responsive design", "git"],
  "data scientist": ["python", "sql", "statistics", "machine learning", "pandas", "numpy", "data visualization"],
  "ai engineer": ["python", "machine learning", "llm", "apis", "sql", "model evaluation", "prompt engineering"]
};

function demoAnalyze(profile) {
  const target = String(profile.targetRole || "full stack developer").toLowerCase();
  const terms = ROLE_TERMS[target] || ROLE_TERMS["full stack developer"];
  const text = [
    profile.headline, profile.about,
    ...(profile.skills || []),
    ...(profile.projects || []).map(x => `${x.projectName} ${x.description} ${x.technologies}`),
    ...(profile.experiences || []).map(x => `${x.jobTitle} ${x.description} ${x.achievements}`)
  ].join(" ").toLowerCase();

  const completenessFields = [
    profile.headline, profile.about, profile.experiences?.length,
    profile.skills?.length, profile.education?.length, profile.projects?.length
  ];
  const completeness = Math.round(completenessFields.filter(Boolean).length / completenessFields.length * 100);
  const keywordHits = terms.filter(t => text.includes(t)).length;
  const keywordScore = Math.round(keywordHits / terms.length * 100);
  const headlineScore = profile.headline ? Math.min(95, 55 + Math.min(35, words(profile.headline).length * 3)) : 20;
  const aboutScore = profile.about ? Math.min(95, 50 + Math.min(40, words(profile.about).length)) : 20;
  const expScore = profile.experiences?.length
    ? Math.min(95, 55 + Math.min(35, profile.experiences.reduce((n, x) => n + words(x.description + " " + x.achievements).length, 0) / 8))
    : 20;
  const skillsScore = Math.min(100, 40 + (profile.skills?.length || 0) * 7);
  const projectScore = profile.projects?.length ? Math.min(95, 60 + profile.projects.length * 10) : 25;
  const overallScore = Math.round((completeness + headlineScore + aboutScore + expScore + skillsScore + keywordScore + projectScore) / 7);
  const existingKeywords = terms.filter(t => text.includes(t));
  const missing = terms.filter(t => !text.includes(t));

  const experienceSuggestions = (profile.experiences || []).map(x => ({
    company: x.company,
    original: x.description || "",
    optimized: x.description
      ? `${x.description.trim()} — emphasize the action taken, technology used, and measurable result where you have real evidence.`
      : `Describe what you built or changed as ${x.jobTitle}, the technologies involved, and the outcome.`
  }));

  return {
    overallScore,
    scores: {
      completeness, headline: Math.round(headlineScore), about: Math.round(aboutScore),
      experience: Math.round(expScore), skills: Math.round(skillsScore),
      keywords: keywordScore, projects: Math.round(projectScore)
    },
    strengths: [
      profile.skills?.length ? "Your profile has a visible skills foundation." : "Once skills are added, this section can show stronger technical coverage.",
      profile.projects?.length ? "Projects provide concrete evidence of your work." : "Projects can provide useful evidence of practical work.",
      profile.targetRole ? `Your profile has a defined target role: ${profile.targetRole}.` : "A target role will make optimization more focused."
    ],
    improvements: [
      !profile.headline ? "Add a concise headline centered on your target role." : "Make the headline more specific to the target role and value proposition.",
      !profile.about ? "Add an About section covering expertise, evidence, and career direction." : "Make the About section clearer about expertise, outcomes, and career direction.",
      "Add measurable achievements only when you have real metrics or evidence."
    ],
    quickWins: [
      missing.length ? `Review suggested keywords such as ${missing.slice(0, 3).join(", ")} if they genuinely match your experience.` : "Review every keyword for accuracy and natural placement.",
      "Rewrite experience bullets around action, task, technology, and verified result.",
      "Keep the first lines of each section easy to scan."
    ],
    headlineSuggestions: [
      `${profile.targetRole || "Professional"} | ${existingKeywords.slice(0, 3).join(" | ") || "Building practical solutions"} | Focused on measurable impact`,
      `${profile.targetRole || "Professional"} | ${existingKeywords.slice(0, 4).join(" | ") || "Technology & Problem Solving"} | Open to opportunities`,
      `${profile.targetRole || "Professional"} | Building ${profile.industry || "technology"} solutions | ${existingKeywords.slice(0, 2).join(" | ") || "Continuous Learning"}`
    ],
    aboutSuggestion: profile.about
      ? `${profile.about.trim()}\n\nFocus next on a clear value proposition, two or three concrete examples, and the type of role you are targeting.`
      : `I am a ${profile.targetRole || "professional"} interested in building practical solutions and continuing to grow my expertise. My current focus is ${profile.industry || "technology and problem solving"}. Add your strongest projects, achievements, technologies, and career direction here.`,
    experienceSuggestions,
    existingKeywords,
    suggestedKeywords: missing,
    missingInformation: [
      !profile.about ? "About section" : null,
      !(profile.experiences || []).length ? "Work experience" : null,
      !(profile.projects || []).length ? "Projects" : null,
      !(profile.education || []).length ? "Education" : null
    ].filter(Boolean),
    note: "This is a heuristic/demo analysis, not an official LinkedIn score and not a prediction of recruiter outcomes."
  };
}

module.exports = { demoAnalyze };

import './styles.css';
const API = `${import.meta.env.VITE_API_URL || ""}/api`;
let state = {
  view: "landing", user: null, profile: null, analysis: null, history: [], demo: false,
  formStep: 0, theme: localStorage.getItem("theme") || "dark"
};

const demoProfile = {
  fullName: "Alex Johnson", headline: "Software Developer | JavaScript | React | SQL",
  about: "Software developer focused on building practical web applications and learning modern development practices.",
  location: "Bengaluru, India", industry: "Software Development", yearsExperience: 1,
  targetRole: "Full Stack Developer",
  experiences: [{ company:"Tech Studio", jobTitle:"Software Developer Intern", startDate:"2025-06-01", endDate:"2025-08-31", currentPosition:false, description:"Built web interfaces using JavaScript and React.", achievements:"Created reusable components for an internal project." }],
  education: [{ institution:"Example University", degree:"B.E.", fieldOfStudy:"Computer Science", startYear:2022, graduationYear:2026, description:"" }],
  skills:["JavaScript","React","SQL","HTML","CSS","Python"],
  certifications:[], projects:[{projectName:"Expense Tracker",description:"Built a responsive expense tracking web app.",technologies:"HTML, CSS, JavaScript, SQL",projectUrl:""}]
};

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const $ = id => document.getElementById(id);
async function api(path, options={}) {
  const res = await fetch(API + path, { credentials:"include", ...options, headers:{ "Content-Type":"application/json", ...(options.headers||{}) }});
  const data = await res.json().catch(()=>({}));
  if (!res.ok) throw new Error(data.error || "Request failed.");
  return data;
}
function toast(msg, type="info") {
  const el = document.createElement("div"); el.className=`toast ${type}`; el.textContent=msg;
  document.body.appendChild(el); setTimeout(()=>el.remove(),3500);
}
function setView(v) { state.view=v; render(); window.scrollTo({top:0,behavior:"smooth"}); }
function saveDemo() { localStorage.setItem("demoProfile", JSON.stringify(state.profile)); }
function loadDemo() { state.profile = JSON.parse(localStorage.getItem("demoProfile") || JSON.stringify(demoProfile)); }

function landing() {
  return `<header class="topbar"><div class="brand"><span class="logo">✦</span> Profile<span>AI</span></div><div class="nav-actions"><button class="btn ghost" id="loginBtn">Log in</button><button class="btn primary" id="demoBtn">Try Demo →</button></div></header>
  <main class="landing"><section class="hero"><div class="eyebrow">AI CAREER PROFILE OPTIMIZER</div><h1>Make your professional profile <em>work harder.</em></h1><p>Analyze your profile, discover missing role-specific keywords, and turn rough career content into clear, factual, recruiter-friendly writing.</p><div class="hero-actions"><button class="btn primary xl" id="startBtn">Analyze My Profile →</button><button class="btn secondary xl" id="heroDemo">Explore Demo</button></div><div class="trust">✓ No LinkedIn password &nbsp; ✓ No scraping required &nbsp; ✓ Your facts stay your facts</div></section>
  <section class="feature-grid">${[
    ["◈","Profile Analysis","Get a structured heuristic score across completeness, headline, experience, skills, keywords, and projects."],
    ["⌁","AI Rewriting","Generate clearer headlines, About sections, and experience wording without inventing achievements."],
    ["⌘","Job Match","Compare your profile with a job description and identify relevant gaps and keywords."]
  ].map(x=>`<article class="feature"><div class="feature-icon">${x[0]}</div><h3>${x[1]}</h3><p>${x[2]}</p></article>`).join("")}</section>
  <section class="how"><div><div class="eyebrow">HOW IT WORKS</div><h2>From raw profile to <span>career-ready content.</span></h2></div><div class="steps">${["Add your profile","Analyze with AI","Apply improvements"].map((x,i)=>`<div class="step"><b>0${i+1}</b><strong>${x}</strong><p>${["Paste your information or upload a resume.","Review strengths, gaps, keywords and opportunities.","Copy the improved content you actually want to use."][i]}</p></div>`).join("")}</div></section>
  <section class="privacy"><div class="privacy-icon">🔒</div><div><h3>Privacy by design</h3><p>We never need your LinkedIn password. Use manual input, copied profile text, or an optional PDF/DOCX resume. AI suggestions are grounded in the information you provide.</p></div></section></main>`;
}

function authModal() {
  return `<div class="modal-backdrop" id="authModal"><div class="modal"><button class="close" id="closeAuth">×</button><div class="eyebrow">WELCOME</div><h2 id="authTitle">Create your account</h2><p class="muted">Save analyses and access your dashboard.</p><form id="authForm"><div id="nameField"><label>Name<input id="authName" required maxlength="120"></label></div><label>Email<input id="authEmail" type="email" required></label><label>Password<input id="authPassword" type="password" minlength="8" required></label><button class="btn primary full" type="submit" id="authSubmit">Create account</button></form><button class="text-btn" id="switchAuth">Already have an account? Log in</button></div></div>`;
}

function profileWizard() {
  const p=state.profile||demoProfile;
  const steps=["Basics","Headline","About","Experience","Education","Skills","Projects","Goal"];
  const forms=[
    `<div class="form-grid"><label>Full Name<input id="fName" value="${esc(p.fullName)}"></label><label>Professional Title<input id="fTitle" value="${esc(p.professionalTitle||"")}"></label><label>Location<input id="fLocation" value="${esc(p.location)}"></label><label>Industry<input id="fIndustry" value="${esc(p.industry)}"></label><label>Years of Experience<input id="fYears" type="number" min="0" max="80" value="${p.yearsExperience||0}"></label></div>`,
    `<label>Current LinkedIn headline<textarea id="fHeadline" rows="5">${esc(p.headline)}</textarea></label><div class="hint">Aim for clarity and relevance. The AI will suggest alternatives later.</div>`,
    `<label>Current About section<textarea id="fAbout" rows="12">${esc(p.about)}</textarea></label>`,
    `<div id="expList">${(p.experiences||[]).map((x,i)=>experienceCard(x,i)).join("")}</div><button class="btn secondary" id="addExp">+ Add Experience</button>`,
    `<div id="eduList">${(p.education||[]).map((x,i)=>educationCard(x,i)).join("")}</div><button class="btn secondary" id="addEdu">+ Add Education</button>`,
    `<label>Skills <span class="muted">comma separated</span><input id="fSkills" value="${esc((p.skills||[]).join(", "))}"></label><div class="chip-wrap">${(p.skills||[]).map(s=>`<span class="chip">${esc(s)}</span>`).join("")}</div>`,
    `<div id="projectList">${(p.projects||[]).map((x,i)=>projectCard(x,i)).join("")}</div><button class="btn secondary" id="addProject">+ Add Project</button>`,
    `<label>What job are you targeting?<input id="fTarget" value="${esc(p.targetRole)}" placeholder="e.g. Full Stack Developer"></label>`
  ];
  return `<div class="wizard-shell"><div class="wizard-top"><button class="brand-btn" id="homeBtn">← ProfileAI</button><div class="privacy-pill">🔒 No LinkedIn credentials required</div></div>
  <div class="progress"><div style="width:${((state.formStep+1)/steps.length)*100}%"></div></div>
  <div class="wizard"><aside><div class="eyebrow">PROFILE BUILDER</div><h1>Tell us about your professional story.</h1><p class="muted">Step ${state.formStep+1} of ${steps.length}. You can edit everything later.</p><ol>${steps.map((s,i)=>`<li class="${i===state.formStep?"active":i<state.formStep?"done":""}"><b>${i<state.formStep?"✓":i+1}</b>${s}</li>`).join("")}</ol><div class="resume-box"><strong>Have a resume?</strong><p>Upload PDF or DOCX to extract text.</p><input type="file" id="resume" accept=".pdf,.docx"><small>Max 5 MB.</small></div></aside>
  <section class="wizard-card"><div class="eyebrow">STEP ${String(state.formStep+1).padStart(2,"0")}</div><h2>${steps[state.formStep]}</h2><div id="stepForm">${forms[state.formStep]}</div><div class="wizard-actions"><button class="btn secondary" id="prev" ${state.formStep===0?"disabled":""}>Back</button>${state.formStep<steps.length-1?`<button class="btn primary" id="next">Continue →</button>`:`<button class="btn primary" id="analyze">Analyze Profile ✦</button>`}</div></section></div></div>`;
}
function experienceCard(x={},i){return `<div class="repeat-card"><button class="remove" data-remove="exp" data-index="${i}">×</button><div class="form-grid"><label>Company<input data-exp="company" data-i="${i}" value="${esc(x.company)}"></label><label>Job Title<input data-exp="jobTitle" data-i="${i}" value="${esc(x.jobTitle)}"></label><label>Start Date<input type="date" data-exp="startDate" data-i="${i}" value="${esc(x.startDate)}"></label><label>End Date<input type="date" data-exp="endDate" data-i="${i}" value="${esc(x.endDate)}" ${x.currentPosition?"disabled":""}></label></div><label><input type="checkbox" data-exp="currentPosition" data-i="${i}" ${x.currentPosition?"checked":""}> Current position</label><label>Description<textarea data-exp="description" data-i="${i}" rows="4">${esc(x.description)}</textarea></label><label>Achievements<textarea data-exp="achievements" data-i="${i}" rows="3">${esc(x.achievements)}</textarea></label></div>`}
function educationCard(x={},i){return `<div class="repeat-card"><button class="remove" data-remove="edu" data-index="${i}">×</button><div class="form-grid"><label>Institution<input data-edu="institution" data-i="${i}" value="${esc(x.institution)}"></label><label>Degree<input data-edu="degree" data-i="${i}" value="${esc(x.degree)}"></label><label>Field of Study<input data-edu="fieldOfStudy" data-i="${i}" value="${esc(x.fieldOfStudy)}"></label><label>Graduation Year<input data-edu="graduationYear" data-i="${i}" value="${esc(x.graduationYear||"")}"></label></div><label>Description<textarea data-edu="description" data-i="${i}" rows="3">${esc(x.description)}</textarea></div>`}
function projectCard(x={},i){return `<div class="repeat-card"><button class="remove" data-remove="project" data-index="${i}">×</button><div class="form-grid"><label>Project Name<input data-project="projectName" data-i="${i}" value="${esc(x.projectName)}"></label><label>Technologies<input data-project="technologies" data-i="${i}" value="${esc(x.technologies)}"></label></div><label>Description<textarea data-project="description" data-i="${i}" rows="4">${esc(x.description)}</textarea><label>Project URL<input data-project="projectUrl" data-i="${i}" value="${esc(x.projectUrl)}"></label></div>`}

function dashboard() {
  const a=state.analysis, p=state.profile||demoProfile;
  const score=a?.overallScore ?? "—";
  return `<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="logo">✦</span> Profile<span>AI</span></div><nav>${["Dashboard","Profile Analysis","Headline Generator","About Generator","Experience Optimizer","Keyword Optimizer","Job Match","Profile History"].map((x,i)=>`<button class="${i===0?"active":""}" data-nav="${x}">${["⌂","◉","✎","✦","↗","⌕","≋","◷"][i]} ${x}</button>`).join("")}</nav><div class="side-bottom"><button id="theme">☾ Toggle theme</button><button id="logout">↪ Log out</button></div></aside>
  <main class="dashboard"><header class="dash-head"><div><div class="eyebrow">OVERVIEW</div><h1>Good evening, ${esc((p.fullName||"there").split(" ")[0])}.</h1><p class="muted">Here is your profile optimization snapshot.</p></div><button class="btn primary" id="reanalyze">✦ Analyze profile</button></header>
  <section class="metric-grid"><div class="metric hero-metric"><span>PROFILE SCORE</span><strong>${score}<small>/100</small></strong><p>${a?"AI-generated heuristic":"Run your first analysis"}</p></div><div class="metric"><span>COMPLETENESS</span><strong>${a?.scores?.completeness??"—"}%</strong><p>Profile coverage</p></div><div class="metric"><span>KEYWORD COVERAGE</span><strong>${a?.scores?.keywords??"—"}%</strong><p>Target-role terms</p></div><div class="metric"><span>OPPORTUNITIES</span><strong>${a?.improvements?.length??"—"}</strong><p>Areas to improve</p></div></section>
  <section class="dash-grid"><div class="panel"><div class="panel-head"><div><h2>Score breakdown</h2><p class="muted">Heuristic, not an official LinkedIn score.</p></div></div>${a?Object.entries(a.scores).map(([k,v])=>`<div class="score-row"><span>${k}</span><div><i style="width:${v}%"></i></div><b>${v}</b></div>`).join(""):`<div class="empty"><div>✦</div><h3>No analysis yet</h3><p>Run an analysis to see your profile breakdown.</p></div>`}</div>
  <div class="panel"><div class="panel-head"><h2>Quick wins</h2></div>${(a?.quickWins||["Add a target role","Add your About section","Add at least one project"]).map((x,i)=>`<div class="insight"><b>0${i+1}</b><span>${esc(x)}</span></div>`).join("")}</div></section>
  <section class="dash-grid"><div class="panel"><div class="panel-head"><h2>Strengths</h2></div>${(a?.strengths||["Define your profile and target role to reveal strengths."]).map(x=>`<div class="bullet positive">✓ <span>${esc(x)}</span></div>`).join("")}</div><div class="panel"><div class="panel-head"><h2>Areas to improve</h2></div>${(a?.improvements||["Add information so the AI can identify improvement opportunities."]).map(x=>`<div class="bullet warning">△ <span>${esc(x)}</span></div>`).join("")}</div></section>
  <section class="panel checklist"><div class="panel-head"><h2>Improvement checklist</h2><span class="badge">3 / 7</span></div>${["Improve headline","Add relevant skills","Rewrite About section","Add measurable achievements","Add projects","Optimize keywords","Review target role"].map((x,i)=>`<label><input type="checkbox" ${i===1||i===4?"checked":""}> <span>${x}</span></label>`).join("")}</section></main></div>`;
}

function analysisView() {
  const a=state.analysis; if(!a) return dashboard();
  return `<div class="app-shell"><aside class="sidebar">${dashboard().match(/<aside class="sidebar">([\s\S]*?)<\/aside>/)[0]}</aside><main class="dashboard"><header class="dash-head"><div><div class="eyebrow">AI ANALYSIS</div><h1>Your profile, decoded.</h1><p class="muted">${esc(a.note||"AI-generated heuristic analysis.")}</p></div><button class="btn secondary" id="editProfile">Edit profile</button></header>
  <section class="analysis-hero"><div class="score-ring"><strong>${a.overallScore}</strong><span>/100</span></div><div><div class="eyebrow">OVERALL PROFILE SCORE</div><h2>There is a clear path to improvement.</h2><p class="muted">Use the suggestions below as editing guidance, not a guarantee of recruiter outcomes.</p></div></section>
  <section class="dash-grid">${cardList("Strengths",a.strengths,"positive")}${cardList("Areas to improve",a.improvements,"warning")}</section>
  <section class="panel"><div class="panel-head"><h2>Score breakdown</h2></div>${Object.entries(a.scores).map(([k,v])=>`<div class="score-row"><span>${k}</span><div><i style="width:${v}%"></i></div><b>${v}</b></div>`).join("")}</section>
  <section class="dash-grid"><div class="panel"><div class="panel-head"><h2>Existing keywords</h2></div><div class="chip-wrap">${a.existingKeywords.map(x=>`<span class="chip">${esc(x)}</span>`).join("")||"<span class='muted'>No matches found.</span>"}</div></div><div class="panel"><div class="panel-head"><h2>Suggested keywords</h2></div><div class="chip-wrap">${a.suggestedKeywords.map(x=>`<span class="chip suggestion">${esc(x)}</span>`).join("")||"<span class='muted'>No obvious gaps.</span>"}</div></div></section>
  <section class="panel"><div class="panel-head"><h2>Headline suggestions</h2><button class="btn secondary small" id="copyHeadline">Copy first</button></div>${a.headlineSuggestions.map((x,i)=>`<div class="rewrite"><span>0${i+1}</span><p>${esc(x)}</p><button class="icon-btn copy" data-copy="${esc(x)}">⧉</button></div>`).join("")}</section>
  <section class="panel"><div class="panel-head"><h2>About suggestion</h2><button class="btn secondary small copy" data-copy="${esc(a.aboutSuggestion)}">Copy</button></div><div class="generated">${esc(a.aboutSuggestion)}</div></section>
  <section class="panel"><div class="panel-head"><h2>Experience optimizer</h2></div>${a.experienceSuggestions.map(x=>`<div class="compare"><div><small>ORIGINAL · ${esc(x.company)}</small><p>${esc(x.original||"No description supplied.")}</p></div><div><small>AI SUGGESTION</small><p>${esc(x.optimized)}</p><button class="btn secondary small copy" data-copy="${esc(x.optimized)}">Copy</button></div></div>`).join("")}</section>
  </main></div>`;
}
function cardList(title,items,type){return `<div class="panel"><div class="panel-head"><h2>${title}</h2></div>${items.map(x=>`<div class="bullet ${type}">✓ <span>${esc(x)}</span></div>`).join("")}</div>`}

function render() {
  document.documentElement.dataset.theme=state.theme;
  const app=$("app");
  if(state.view==="landing"){app.innerHTML=landing(); bindLanding(); return;}
  if(state.view==="wizard"){app.innerHTML=profileWizard(); bindWizard(); return;}
  if(state.view==="analysis"){app.innerHTML=analysisView(); bindDashboard(); return;}
  if(state.view==="dashboard"){app.innerHTML=dashboard(); bindDashboard(); return;}
}
function bindLanding(){
  $("startBtn").onclick=()=>{state.demo=false; state.profile=state.profile||JSON.parse(JSON.stringify(demoProfile)); setView("wizard")};
  $("heroDemo").onclick=$("demoBtn").onclick=()=>{state.demo=true;loadDemo();setView("wizard")};
  $("loginBtn").onclick=()=>showAuth(false);
}
function showAuth(register=true){
  const div=document.createElement("div");div.innerHTML=authModal();document.body.append(div);
  let mode=register; const title=$("authTitle"), submit=$("authSubmit"), name=$("nameField"), switcher=$("switchAuth");
  const refresh=()=>{title.textContent=mode?"Create your account":"Welcome back";submit.textContent=mode?"Create account":"Log in";name.style.display=mode?"block":"none";switcher.textContent=mode?"Already have an account? Log in":"Need an account? Create one"};
  refresh(); $("closeAuth").onclick=()=>div.remove(); switcher.onclick=()=>{mode=!mode;refresh()};
  $("authForm").onsubmit=async e=>{e.preventDefault();try{const d=await api(mode?"/auth/register":"/auth/login",{method:"POST",body:JSON.stringify({name:$("authName").value,email:$("authEmail").value,password:$("authPassword").value})});state.user=d.user;div.remove();state.view="dashboard";await loadProfile();render();toast(mode?"Account created.":"Logged in.","success")}catch(err){toast(err.message,"error")}};
}
function bindWizard(){
  $("homeBtn").onclick=()=>setView("landing");
  $("prev").onclick=()=>{captureStep();state.formStep--;render()};
  $("next")?.addEventListener("click",()=>{captureStep();state.formStep++;render()});
  $("analyze")?.addEventListener("click",async()=>{captureStep();await analyze()});
 $("addExp")?.addEventListener("click", () => {
    captureStep();
    state.profile.experiences.push({
        company: "",
        jobTitle: "",
        description: "",
        achievements: []
    });
    render();
});

$("addEdu")?.addEventListener("click", () => {
    captureStep();
    state.profile.education.push({
        institution: "",
        degree: "",
        fieldOfStudy: ""
    });
    render();
});

$("addProject")?.addEventListener("click", () => {
    captureStep();
    state.profile.projects.push({
        projectName: "",
        description: "",
        technologies: []
    });
    render();
});
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{captureStep();const t=b.dataset.remove,i=Number(b.dataset.index);state.profile[{exp:"experiences",edu:"education",project:"projects"}[t]].splice(i,1);render()});
  document.querySelectorAll("[data-exp]").forEach(el=>el.oninput=()=>captureRepeat(el,"experiences","exp"));
  document.querySelectorAll("[data-edu]").forEach(el=>el.oninput=()=>captureRepeat(el,"education","edu"));
  document.querySelectorAll("[data-project]").forEach(el=>el.oninput=()=>captureRepeat(el,"projects","project"));
  $("resume").onchange=async e=>{if(!e.target.files[0])return;const fd=new FormData();fd.append("resume",e.target.files[0]);try{const r=await fetch(API+"/profile/resume",{method:"POST",credentials:"include",body:fd});const d=await r.json();if(!r.ok)throw Error(d.error);toast("Resume text extracted. Review your fields before using it.","success");$("fAbout")&&( $("fAbout").value = d.text.slice(0,10000));}catch(err){toast(err.message,"error")}};
}
function captureRepeat(el,key,kind){const i=Number(el.dataset.i), field=el.dataset[kind];if(!state.profile[key])state.profile[key]=[];state.profile[key][i] ||= {};state.profile[key][i][field]=el.type==="checkbox"?el.checked:el.value}
function captureStep(){
  const p=state.profile;
  if($("fName"))p.fullName=$("fName").value;
  if($("fLocation"))p.location=$("fLocation").value;
  if($("fIndustry"))p.industry=$("fIndustry").value;
  if($("fYears"))p.yearsExperience=Number($("fYears").value||0);
  if($("fHeadline"))p.headline=$("fHeadline").value;
  if($("fAbout"))p.about=$("fAbout").value;
  if($("fSkills"))p.skills=$("fSkills").value.split(",").map(x=>x.trim()).filter(Boolean);
  if($("fTarget"))p.targetRole=$("fTarget").value;
  if(state.demo)saveDemo();
}
async function analyze(){
  try{
    toast("Analyzing your profile…");
    if(!state.demo && state.user) await api("/profile",{method:"PUT",body:JSON.stringify(state.profile)});
    const d=await api("/ai/analyze",{method:"POST",body:JSON.stringify({profile:state.profile})});
    state.analysis=d.analysis; if(!state.demo && state.user){ try{ await api("/analysis",{method:"POST",body:JSON.stringify({targetRole:state.profile.targetRole,analysis:state.analysis})}); }catch{} } if(state.demo)saveDemo();
    setView("analysis");
  }catch(e){toast(e.message,"error")}
}
async function loadProfile(){try{const d=await api("/profile");state.profile=d.profile||JSON.parse(JSON.stringify(demoProfile))}catch{}}
function bindDashboard(){
  document.querySelectorAll("[data-nav]").forEach(b=>b.onclick=()=>toast(`${b.dataset.nav} module is ready in the project scaffold.`));
 $("editProfile")?.addEventListener("click", () => {
    state.formStep = 0;
    setView("wizard");
});

$("reanalyze")?.addEventListener("click", () => {
    state.formStep = 0;
    setView("wizard");
});

 $("logout")?.addEventListener("click", async () => {
    try {
        await api("/auth/logout", {
            method: "POST"
        });
    } catch {}

    state.user = null;
    state.analysis = null;
    render();
});

 $("theme")?.addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    localStorage.setItem("theme", state.theme);
    render();
});

  document.querySelectorAll(".copy").forEach(b=>b.onclick=()=>{navigator.clipboard.writeText(b.dataset.copy||b.textContent);toast("Copied to clipboard.","success")});
 $("copyHeadline")?.addEventListener("click", () => {
    navigator.clipboard.writeText(
        state.analysis?.headlineSuggestions?.[0] || ""
    );
    toast("Copied");
});
}
loadProfile().finally(()=>render());

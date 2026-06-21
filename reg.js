/* WebCraft Pro – JavaScript core */
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Utility: generate or retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Store session token (if any) in localStorage
function setSession(token) {
  if (token) {
    localStorage.setItem("sessionToken", token);
  } else {
    localStorage.removeItem("sessionToken");
  }
}
function getSession() {
  return localStorage.getItem("sessionToken");
}

// Generic POST helper to the webhook
async function sendAction(action, payload) {
  const body = {
    action,
    deviceId: getDeviceId(),
    sessionToken: getSession(),
    data: payload,
  };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (result.sessionToken) setSession(result.sessionToken);
    return result;
  } catch (err) {
    console.error("Webhook error", err);
    return { error: err.message };
  }
}

// Helper to display result in a <pre> element
function showResult(elementId, data) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = JSON.stringify(data, null, 2);
}

// Register form handling
const registerForm = document.getElementById("register_form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = registerForm.username.value.trim();
    const password = registerForm.password.value;
    const result = await sendAction("register", { username, password });
    showResult("registerResult", result);
    if (result.error) toast(result.error, "error");
  });
}

// Login form handling
const loginForm = document.getElementById("login_form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;
    const result = await sendAction("login", { username, password });
    showResult("loginResult", result);
    if (result.error) toast(result.error, "error");
  });
}

// Plan selection handling
document.querySelectorAll(".select_plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.closest(".plan_card").dataset.plan;
    const result = await sendAction("choose_plan", { plan });
    showResult("planResult", result);
    if (result.error) toast(result.error, "error");
  });
});

// Dashboard actions – Save / Load project
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const projectData = {
      timestamp: new Date().toISOString(),
      content: "Sample project data",
    };
    const result = await sendAction("save_project", projectData);
    showResult("dashboardResult", result);
    if (result.error) toast(result.error, "error");
  });
}
if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const result = await sendAction("load_project", {});
    showResult("dashboardResult", result);
    if (result.error) toast(result.error, "error");
  });
}

// Simple toast for user feedback
function toast(message, type = "info") {
  const div = document.createElement("div");
  div.textContent = message;
  div.style.position = "fixed";
  div.style.bottom = "20px";
  div.style.right = "20px";
  div.style.padding = "0.8rem 1.2rem";
  div.style.background = type === "error" ? "rgba(200,0,0,0.8)" : "rgba(0,0,0,0.7)";
  div.style.color = "#fff";
  div.style.borderRadius = "8px";
  div.style.zIndex = 9999;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// Particle generation for neon effect
function createParticle() {
  const p = document.createElement("div");
  p.className = "particle";
  const size = Math.random() * 8 + 4; // 4-12px
  p.style.width = `${size}px`;
  p.style.height = `${size}px`;
  p.style.left = `${Math.random() * 100}%`;
  p.style.top = `${Math.random() * 100}%`;
  document.body.appendChild(p);
  // Remove after animation duration
  setTimeout(() => p.remove(), 8000);
}
// Spawn particles continuously
setInterval(createParticle, 300);

// End of reg.js

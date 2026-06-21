// WebCraft Pro - Frontend Logic
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Ensure a unique device ID stored in localStorage
if (!localStorage.getItem("deviceId")) {
  const generateUUID = () => crypto.randomUUID();
  localStorage.setItem("deviceId", generateUUID());
}
const getDeviceId = () => localStorage.getItem("deviceId");

// Generic POST helper
async function postToWebhook(action, payload) {
  const body = { action, deviceId: getDeviceId(), payload };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Server error");
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// Utility to display result in a <pre> element
function showResult(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = JSON.stringify(data, null, 2);
}

// Registration handling
const registrationForm = document.getElementById("registrationForm");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const result = await postToWebhook("register", { username, password });
    showResult("regResult", result);
  });
}

// Login handling
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const result = await postToWebhook("login", { username, password });
    showResult("loginResult", result);
    // Store session token if provided
    if (result?.token) localStorage.setItem("sessionToken", result.token);
  });
}

// Plan selection handling
document.querySelectorAll(".select-plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.closest(".plan-card").dataset.plan;
    const result = await postToWebhook("selectPlan", { plan });
    showResult("planResult", result);
  });
});

// Dashboard actions – Save / Load project
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");
const dashboard = document.getElementById("dashboard");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const content = dashboard.innerHTML;
    const result = await postToWebhook("saveProject", { content });
    showResult("projectResult", result);
  });
}

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const result = await postToWebhook("loadProject", {});
    if (result?.content) dashboard.innerHTML = result.content;
    showResult("projectResult", result);
  });
}

// Optional: simple particle generation for visual effect (adds to body)
function createParticle() {
  const p = document.createElement("div");
  p.className = "particle";
  const size = Math.random() * 3 + 2;
  p.style.width = p.style.height = `${size}px`;
  p.style.left = `${Math.random() * 100}%`;
  p.style.top = `${Math.random() * 100}%`;
  document.body.appendChild(p);
  setTimeout(() => p.remove(), 8000);
}
setInterval(createParticle, 300);

// Export for debugging (optional)
window.WebCraft = { postToWebhook, getDeviceId };

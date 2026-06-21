// WebCraft Pro - Frontend Logic
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// ------------ Utility ------------
function generateDeviceId() {
  // Simple deterministic UUID‑like generator
  return crypto.randomUUID();
}
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = generateDeviceId();
    localStorage.setItem("deviceId", id);
  }
  return id;
}
async function postToWebhook(action, payload) {
  const body = { action, deviceId: getDeviceId(), ...payload };
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  const data = await response.json();
  return data;
}
function showResult(targetId, data) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = `<pre class="result">${JSON.stringify(data, null, 2)}</pre>`;
}

// ------------ Registration ------------
const regForm = document.getElementById("register_form");
if (regForm) {
  regForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = regForm.querySelector("[name='username']").value.trim();
    const password = regForm.querySelector("[name='password']").value;
    const result = await postToWebhook("register", { username, password });
    if (result.token) localStorage.setItem("sessionToken", result.token);
    showResult("regResult", result);
  });
}

// ------------ Login ------------
const loginForm = document.getElementById("login_form");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const username = loginForm.querySelector("[name='username']").value.trim();
    const password = loginForm.querySelector("[name='password']").value;
    const result = await postToWebhook("login", { username, password });
    if (result.token) localStorage.setItem("sessionToken", result.token);
    showResult("loginResult", result);
  });
}

// ------------ Plan Selection ------------
const planButtons = document.querySelectorAll(".plan-cell");
planButtons.forEach(btn => {
  btn.addEventListener("click", async () => {
    const plan = btn.dataset.plan;
    const token = localStorage.getItem("sessionToken") || "";
    const result = await postToWebhook("selectPlan", { plan, token });
    showResult("planResult", result);
  });
});

// ------------ Project Dashboard ------------
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const projectData = document.getElementById("dashboardContent").innerHTML;
    const token = localStorage.getItem("sessionToken") || "";
    const result = await postToWebhook("saveProject", { project: projectData, token });
    showResult("dashboardResult", result);
  });
}
if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const token = localStorage.getItem("sessionToken") || "";
    const result = await postToWebhook("loadProject", { token });
    if (result.project) {
      document.getElementById("dashboardContent").innerHTML = result.project;
    }
    showResult("dashboardResult", result);
  });
}

// ------------ UI Helpers ------------
function initOrbs() {
  const container = document.body;
  for (let i = 0; i < 8; i++) {
    const orb = document.createElement("div");
    orb.className = "orb";
    orb.style.left = Math.random() * 100 + "%";
    orb.style.top = Math.random() * 100 + "%";
    container.appendChild(orb);
  }
}
window.addEventListener("load", initOrbs);

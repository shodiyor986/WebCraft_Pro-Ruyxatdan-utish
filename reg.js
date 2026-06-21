/* WebCraft Pro - Frontend Logic */
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// ---------- Utility ----------
function generateDeviceId() {
  // Simple deterministic UUID v4 like generator
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
  const body = {
    action,
    deviceId: getDeviceId(),
    payload,
  };
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return data;
}

function showResult(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (data.error) {
    el.textContent = "Error: " + data.error;
    el.style.color = "#ff4d4d";
  } else {
    el.textContent = JSON.stringify(data, null, 2);
    el.style.color = "#4dff4d";
  }
}

// ---------- Registration ----------
const registrationForm = document.getElementById("registration-form");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    const result = await postToWebhook("register", { username, password });
    showResult("regResult", result);
    if (result.token) {
      localStorage.setItem("sessionToken", result.token);
    }
  });
}

// ---------- Login ----------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const result = await postToWebhook("login", { username, password });
    showResult("loginResult", result);
    if (result.token) {
      localStorage.setItem("sessionToken", result.token);
    }
  });
}

// ---------- Plan Selection ----------
document.querySelectorAll(".select-plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.dataset.plan || btn.textContent.trim().toLowerCase();
    const result = await postToWebhook("selectPlan", { plan });
    showResult("planResult", result);
  });
});

// ---------- Dashboard Actions ----------
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const content = document.getElementById("dashboard").innerHTML;
    const result = await postToWebhook("saveProject", { content });
    showResult("projectResult", result);
  });
}

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const result = await postToWebhook("loadProject", {});
    if (result.content) {
      document.getElementById("dashboard").innerHTML = result.content;
    }
    showResult("projectResult", result);
  });
}

// Initialize device ID on first load
getDeviceId();

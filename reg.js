// WebCraft Pro – Registration, Login, Plans, Dashboard logic
// ---------------------------------------------------------------
// Webhook URL (replace with your actual endpoint)
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// ---------------------------------------------------------------
// Device ID – persistent per browser (stored in localStorage)
function getDeviceId() {
  let id = localStorage.getItem("wc_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("wc_device_id", id);
  }
  return id;
}

// ---------------------------------------------------------------
// Session handling (username & token) – stored in localStorage
function setSession(user, token) {
  localStorage.setItem("wc_session", JSON.stringify({ user, token }));
}
function getSession() {
  const data = localStorage.getItem("wc_session");
  return data ? JSON.parse(data) : null;
}
function clearSession() {
  localStorage.removeItem("wc_session");
}

// ---------------------------------------------------------------
// UI helpers – toast messages, tab switching, etc.
function showMessage(msg, type = "info") {
  const box = document.getElementById("msg-box");
  if (!box) return;
  box.textContent = msg;
  box.style.background = type === "error" ? "rgba(255,0,0,0.8)" : "rgba(0,0,0,0.8)";
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 3000);
}

function switchTab(targetId) {
  // Deactivate all tabs & sections
  document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".form-section").forEach(sec => sec.classList.remove("active"));
  // Activate chosen tab & its section
  const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
  if (btn) btn.classList.add("active");
  const sec = document.getElementById(targetId);
  if (sec) sec.classList.add("active");
}

function initTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.target));
  });
}

function initLogout() {
  const btn = document.getElementById("logout-btn");
  if (btn) {
    btn.addEventListener("click", () => {
      clearSession();
      showMessage("Logged out");
      switchTab("login-section");
    });
  }
}

// ---------------------------------------------------------------
// Generic POST helper – sends action + payload + deviceId to webhook
async function postToWebhook(action, payload = {}) {
  const body = { action, deviceId: getDeviceId(), ...payload };
  const res = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Server error");
  return data;
}

// ---------------------------------------------------------------
// Form Handlers
async function handleRegister(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value;
  if (!username || !password) return showMessage("All fields required", "error");
  try {
    const data = await postToWebhook("register", { username, password });
    setSession(data.username || username, data.token);
    showMessage("Registered successfully");
    document.getElementById("user-name").textContent = username;
    switchTab("dashboard-section");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value;
  if (!username || !password) return showMessage("All fields required", "error");
  try {
    const data = await postToWebhook("login", { username, password });
    setSession(data.username || username, data.token);
    showMessage("Login successful");
    document.getElementById("user-name").textContent = username;
    switchTab("dashboard-section");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

async function handlePlan(e) {
  e.preventDefault();
  const plan = e.target.plan.value;
  const session = getSession();
  if (!session) return showMessage("Please login first", "error");
  try {
    await postToWebhook("choose_plan", { plan, token: session.token });
    showMessage(`Plan "${plan}" selected`);
    switchTab("dashboard-section");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// Optional – project save / load (future extensions)
async function handleSaveProject(e) {
  e.preventDefault();
  const name = e.target.project_name?.value?.trim();
  const data = e.target.project_data?.value;
  const session = getSession();
  if (!session) return showMessage("Login required", "error");
  try {
    await postToWebhook("save_project", { name, data, token: session.token });
    showMessage("Project saved");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

async function handleLoadProject(e) {
  e.preventDefault();
  const name = e.target.project_name?.value?.trim();
  const session = getSession();
  if (!session) return showMessage("Login required", "error");
  try {
    const resp = await postToWebhook("load_project", { name, token: session.token });
    // Assuming response contains {data: "..."}
    const textarea = document.getElementById("project_data");
    if (textarea) textarea.value = resp.data || "";
    showMessage("Project loaded");
  } catch (err) {
    showMessage(err.message, "error");
  }
}

// ---------------------------------------------------------------
// Initialization – attach listeners, restore session, etc.
function init() {
  // Attach form submit listeners
  const regForm = document.getElementById("register-form");
  if (regForm) regForm.addEventListener("submit", handleRegister);
  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.addEventListener("submit", handleLogin);
  const planForm = document.getElementById("plan-form");
  if (planForm) planForm.addEventListener("submit", handlePlan);
  // Optional project forms (if present in future)
  const saveForm = document.getElementById("save-project-form");
  if (saveForm) saveForm.addEventListener("submit", handleSaveProject);
  const loadForm = document.getElementById("load-project-form");
  if (loadForm) loadForm.addEventListener("submit", handleLoadProject);

  initTabs();
  initLogout();

  // Auto‑login if session exists
  const sess = getSession();
  if (sess) {
    document.getElementById("user-name").textContent = sess.user || sess.username || "";
    switchTab("dashboard-section");
  } else {
    switchTab("login-section");
  }
}

// Run init when DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

// WebCraft Pro - Full Frontend Logic
// Updated on 2026-06-21

const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Utility: generate or retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    // Simple random UUID (not cryptographically strong but sufficient for demo)
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Generic POST helper to the webhook
async function postToWebhook(action, payload) {
  const body = {
    action,
    deviceId: getDeviceId(),
    ...payload,
  };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    console.error("Webhook error:", err);
    return { success: false, error: err };
  }
}

// Session handling – store logged‑in user email
function setSession(email) {
  localStorage.setItem("sessionUser", email);
}
function clearSession() {
  localStorage.removeItem("sessionUser");
}
function getSession() {
  return localStorage.getItem("sessionUser");
}

// UI helpers
function showResponse(elementId, message, ok = true) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.color = ok ? "#00ff00" : "#ff5555";
  }
}
function toggleDashboard(show) {
  const dash = document.getElementById("dashboard");
  const sections = document.querySelectorAll("section.card");
  sections.forEach((s) => (s.style.display = show ? "none" : "block"));
  dash.style.display = show ? "block" : "none";
}

// Register form handling
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const res = await postToWebhook("register", { email, password });
  if (res.success && res.data?.status === "ok") {
    showResponse("registerResponse", "Ro‘yxatdan o‘tish muvaffaqiyatli!");
    setSession(email);
    toggleDashboard(true);
    loadProjects();
  } else {
    showResponse(
      "registerResponse",
      res.data?.message || res.error?.message || "Xatolik",
      false
    );
  }
});

// Login form handling
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const res = await postToWebhook("login", { email, password });
  if (res.success && res.data?.status === "ok") {
    showResponse("loginResponse", "Kirish muvaffaqiyatli!");
    setSession(email);
    toggleDashboard(true);
    loadProjects();
  } else {
    showResponse(
      "loginResponse",
      res.data?.message || res.error?.message || "Xatolik",
      false
    );
  }
});

// Plan selection handling
document.querySelectorAll(".select-plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.dataset.plan;
    const email = getSession();
    if (!email) {
      showResponse("planResponse", "Avvalo kirish qiling", false);
      return;
    }
    const res = await postToWebhook("select_plan", { email, plan });
    if (res.success && res.data?.status === "ok") {
      showResponse("planResponse", `Reja ${plan} tanlandi`);
    } else {
      showResponse(
        "planResponse",
        res.data?.message || res.error?.message || "Xatolik",
        false
      );
    }
  });
});

// Project handling – simple in‑memory storage via webhook
async function loadProjects() {
  const email = getSession();
  if (!email) return;
  const res = await postToWebhook("list_projects", { email });
  const container = document.getElementById("projectList");
  container.innerHTML = "";
  if (res.success && Array.isArray(res.data?.projects)) {
    res.data.projects.forEach((proj) => {
      const div = document.createElement("div");
      div.className = "project-item";
      div.textContent = proj.name;
      container.appendChild(div);
    });
  } else {
    container.textContent = "Loyiha yo‘q";
  }
}

// Logout handling
document.getElementById("logoutBtn").addEventListener("click", () => {
  clearSession();
  toggleDashboard(false);
});

// On page load – check for existing session
window.addEventListener("DOMContentLoaded", () => {
  const user = getSession();
  if (user) {
    toggleDashboard(true);
    loadProjects();
  }
});

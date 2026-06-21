// WebCraft Pro – Frontend Logic
// --------------------------------------------------
// Centralised configuration
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// --------------------------------------------------
// Utility: Device ID (persisted in localStorage)
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// --------------------------------------------------
// Generic POST helper – returns {success, data}
async function postToWebhook(action, payload = {}) {
  const body = { action, deviceId: getDeviceId(), ...payload };
  const response = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return { success: response.ok, data };
}

// --------------------------------------------------
// UI helper – colour‑coded messages
function showMessage(containerId, message, success = true) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.textContent = message;
  el.style.color = success ? "#00ff00" : "#ff5555";
}

// --------------------------------------------------
// Section toggling (auth ↔ dashboard)
function showSection(sectionId) {
  document.querySelectorAll("section").forEach((s) => s.classList.add("hidden"));
  const target = document.getElementById(sectionId);
  if (target) target.classList.remove("hidden");
}

// --------------------------------------------------
// Registration flow
document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const { success, data } = await postToWebhook("register", { email, password });
  if (success && data?.status === "ok") {
    localStorage.setItem("sessionUser", email);
    showMessage("registerResponse", "✅ Registration successful!");
    loadDashboard();
  } else {
    showMessage("registerResponse", data?.message || "Registration failed", false);
  }
});

// --------------------------------------------------
// Login flow
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = e.target.email.value.trim();
  const password = e.target.password.value;
  const { success, data } = await postToWebhook("login", { email, password });
  if (success && data?.status === "ok") {
    localStorage.setItem("sessionUser", email);
    showMessage("loginResponse", "✅ Logged in!");
    loadDashboard();
  } else {
    showMessage("loginResponse", data?.message || "Login failed", false);
  }
});

// --------------------------------------------------
// Plan selection
document.querySelectorAll(".select-plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const plan = btn.dataset.plan;
    const { success, data } = await postToWebhook("select_plan", { plan });
    if (success && data?.status === "ok") {
      showMessage("planResponse", `Plan "${plan}" selected`);
    } else {
      showMessage("planResponse", data?.message || "Plan selection failed", false);
    }
  });
});

// --------------------------------------------------
// Dashboard initialisation
function loadDashboard() {
  const user = localStorage.getItem("sessionUser");
  if (!user) {
    // No session – show registration page by default
    showSection("register");
    return;
  }
  // User logged in – show dashboard and hide auth sections
  document.querySelectorAll(".auth-section").forEach((el) => el.classList.add("hidden"));
  showSection("dashboard");
  loadProjects();
}

// --------------------------------------------------
// Project handling (save / load)
async function saveProject(name, content) {
  const { success, data } = await postToWebhook("save_project", { name, content });
  if (success && data?.status === "ok") {
    showMessage("projectResponse", `Project "${name}" saved`);
    loadProjects();
  } else {
    showMessage("projectResponse", data?.message || "Save failed", false);
  }
}

async function loadProjects() {
  const listEl = document.getElementById("projectList");
  if (!listEl) return;
  listEl.innerHTML = "";
  const { success, data } = await postToWebhook("load_projects");
  if (success && Array.isArray(data?.projects)) {
    data.projects.forEach((proj) => {
      const li = document.createElement("li");
      li.textContent = proj.name;
      li.className = "project-item";
      li.addEventListener("click", () => {
        const editor = document.getElementById("projectEditor");
        if (editor) editor.value = proj.content;
      });
      listEl.appendChild(li);
    });
  } else {
    showMessage("projectResponse", "No projects found", false);
  }
}

// --------------------------------------------------
// Save button in dashboard
document.getElementById("saveProjectBtn")?.addEventListener("click", () => {
  const name = document.getElementById("projectName")?.value.trim();
  const content = document.getElementById("projectEditor")?.value;
  if (!name) {
    showMessage("projectResponse", "Enter a project name", false);
    return;
  }
  saveProject(name, content);
});

// --------------------------------------------------
// Initialise UI on page load
window.addEventListener("DOMContentLoaded", () => {
  loadDashboard();
});

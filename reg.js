// WebCraft Pro – JavaScript core
// Webhook URL for all actions
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Utility: generate / retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    // simple UUIDv4 generator
    id = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Session token handling (stored in localStorage)
function setSessionToken(token) {
  if (token) localStorage.setItem("sessionToken", token);
  else localStorage.removeItem("sessionToken");
}
function getSessionToken() {
  return localStorage.getItem("sessionToken");
}

// Generic POST helper – sends action + payload to webhook
async function sendAction(action, payload = {}) {
  const body = {
    action,
    deviceId: getDeviceId(),
    sessionToken: getSessionToken(),
    data: payload
  };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    // If the webhook returns a new token, store it
    if (result.sessionToken) setSessionToken(result.sessionToken);
    return result;
  } catch (e) {
    console.error("Webhook error", e);
    return { error: e.message };
  }
}

// UI helpers
function setResult(elementId, message, isError = false) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    el.style.color = isError ? "#ff6b6b" : "#4caf50";
  }
}

// Register form handling
const registerForm = document.getElementById("register_form");
if (registerForm) {
  registerForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      username: registerForm.username.value.trim(),
      email: registerForm.email.value.trim(),
      password: registerForm.password.value
    };
    const result = await sendAction("register", data);
    if (result.success) {
      setResult("registerResult", "✅ Registered successfully!");
    } else {
      setResult("registerResult", result.error || "Registration failed", true);
    }
  });
}

// Login form handling
const loginForm = document.getElementById("login_form");
if (loginForm) {
  loginForm.addEventListener("submit", async e => {
    e.preventDefault();
    const data = {
      username: loginForm.username.value.trim(),
      password: loginForm.password.value
    };
    const result = await sendAction("login", data);
    if (result.success) {
      setResult("loginResult", "✅ Logged in!");
    } else {
      setResult("loginResult", result.error || "Login failed", true);
    }
  });
}

// Plan selection handling
document.querySelectorAll(".select_plan").forEach(btn => {
  btn.addEventListener("click", async () => {
    const plan = btn.closest(".plan_card").dataset.plan;
    const result = await sendAction("selectPlan", { plan });
    if (result.success) {
      setResult("planResult", `✅ Plan "${plan}" selected`);
    } else {
      setResult("planResult", result.error || "Plan selection failed", true);
    }
  });
});

// Dashboard – Save / Load project
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");
const dashboardResult = document.getElementById("dashboardResult");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    // Example payload – you can replace with real project data
    const projectData = {
      timestamp: Date.now(),
      dummy: "example project data"
    };
    const result = await sendAction("saveProject", projectData);
    if (result.success) {
      setResult("dashboardResult", "✅ Project saved", false);
    } else {
      setResult("dashboardResult", result.error || "Save failed", true);
    }
  });
}

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const result = await sendAction("loadProject");
    if (result.success && result.project) {
      dashboardResult.textContent = JSON.stringify(result.project, null, 2);
    } else {
      setResult("dashboardResult", result.error || "Load failed", true);
    }
  });
}

// Optional: Initialize UI – add background effects from CSS
function initBackground() {
  const body = document.body;
  // Grid background container
  const grid = document.createElement("div");
  grid.className = "grid-bg";
  body.appendChild(grid);

  // Orbs (glowing circles)
  for (let i = 0; i < 3; i++) {
    const orb = document.createElement("div");
    orb.className = "orb";
    body.appendChild(orb);
  }

  // Particles – create many tiny dots
  for (let i = 0; i < 50; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    p.style.left = Math.random() * 100 + "vw";
    p.style.top = Math.random() * 100 + "vh";
    p.style.animationDelay = Math.random() * 5 + "s";
    body.appendChild(p);
  }
}

// Run init on DOM ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initBackground);
} else {
  initBackground();
}

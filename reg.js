// WebCraft Pro - Frontend logic
// Webhook URL for all actions
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

/**
 * Generate or retrieve a persistent device identifier.
 * Stored in localStorage under the key "deviceId".
 */
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    if (crypto && crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      id = "dev-" + Math.random().toString(36).substring(2, 15);
    }
    localStorage.setItem("deviceId", id);
  }
  return id;
}

/**
 * Generic POST helper – sends an action with payload to the webhook.
 * Returns parsed JSON response.
 */
async function postToWebhook(action, payload = {}) {
  const body = { action, deviceId: getDeviceId(), ...payload };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    return { error: true, message: err.message };
  }
}

/** Utility to pretty‑print result objects into a target element. */
function showResult(targetId, data) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.textContent = JSON.stringify(data, null, 2);
}

/** ------------------------------------------------------------------ */
/** Registration handling */
const registerForm = document.getElementById("register_form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = registerForm.username.value.trim();
    const password = registerForm.password.value;
    const result = await postToWebhook("register", { username, password });
    if (result?.token) localStorage.setItem("sessionToken", result.token);
    showResult("registerResult", result);
  });
}

/** ------------------------------------------------------------------ */
/** Login handling */
const loginForm = document.getElementById("login_form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = loginForm.username.value.trim();
    const password = loginForm.password.value;
    const result = await postToWebhook("login", { username, password });
    if (result?.token) localStorage.setItem("sessionToken", result.token);
    showResult("loginResult", result);
  });
}

/** ------------------------------------------------------------------ */
/** Plan selection handling */
document.querySelectorAll(".select_plan").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const card = btn.closest(".plan_card");
    const plan = card?.dataset?.plan || "unknown";
    const result = await postToWebhook("selectPlan", { plan });
    showResult("planResult", result);
  });
});

/** ------------------------------------------------------------------ */
/** Dashboard – Save / Load project */
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const projectData = {
      timestamp: new Date().toISOString(),
      dummy: "example project data",
    };
    const result = await postToWebhook("saveProject", { projectData });
    showResult("dashboardResult", result);
  });
}

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const result = await postToWebhook("loadProject", {});
    showResult("dashboardResult", result);
  });
}

/** Initialise – ensure deviceId exists */
getDeviceId();

export { getDeviceId, postToWebhook, showResult };

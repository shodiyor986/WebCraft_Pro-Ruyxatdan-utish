// WebCraft Pro - Frontend Logic
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Ensure a unique device identifier
if (!localStorage.getItem("deviceId")) {
  const deviceId = crypto.randomUUID();
  localStorage.setItem("deviceId", deviceId);
}
const getDeviceId = () => localStorage.getItem("deviceId");

/**
 * Generic POST helper to the webhook.
 * @param {string} action - Action name (register, login, selectPlan, saveProject, loadProject)
 * @param {object} payload - Additional data to send
 * @returns {Promise<object>} Parsed JSON response
 */
async function postToWebhook(action, payload = {}) {
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
  if (!response.ok) {
    throw new Error(`Webhook error: ${response.status}`);
  }
  return response.json();
}

/** Utility to show formatted JSON in a <pre> element */
function showResult(elementId, data) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.textContent = JSON.stringify(data, null, 2);
}

/** Registration handling */
const registrationForm = document.getElementById("registrationForm");
if (registrationForm) {
  registrationForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    try {
      const resp = await postToWebhook("register", { username, password });
      showResult("regResult", resp);
    } catch (err) {
      showResult("regResult", { error: err.message });
    }
  });
}

/** Login handling */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    try {
      const resp = await postToWebhook("login", { username, password });
      showResult("loginResult", resp);
    } catch (err) {
      showResult("loginResult", { error: err.message });
    }
  });
}

/** Plan selection handling */
const planCards = document.querySelectorAll(".plan-card");
planCards.forEach((card) => {
  card.addEventListener("click", async () => {
    const plan = card.dataset.plan;
    try {
      const resp = await postToWebhook("selectPlan", { plan });
      showResult("planResult", resp);
    } catch (err) {
      showResult("planResult", { error: err.message });
    }
  });
});

/** Dashboard project saving */
const saveBtn = document.getElementById("saveProjectBtn");
const loadBtn = document.getElementById("loadProjectBtn");
const dashboard = document.getElementById("dashboard");

if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const content = dashboard.innerHTML;
    try {
      const resp = await postToWebhook("saveProject", { content });
      showResult("projectResult", resp);
    } catch (err) {
      showResult("projectResult", { error: err.message });
    }
  });
}

if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    try {
      const resp = await postToWebhook("loadProject");
      // Expecting {content: "..."}
      if (resp.content !== undefined) {
        dashboard.innerHTML = resp.content;
      }
      showResult("projectResult", resp);
    } catch (err) {
      showResult("projectResult", { error: err.message });
    }
  });
}

// Export for debugging (optional)
window.WebCraft = { postToWebhook, showResult };

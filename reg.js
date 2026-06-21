const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Ensure a unique device identifier
if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceId', crypto.randomUUID());
}

/**
 * Helper to POST data to the webhook.
 * @param {string} action - The action name (register, login, etc.)
 * @param {object} payload - Additional data to send.
 * @returns {Promise<object>} Parsed JSON response.
 */
async function postToWebhook(action, payload = {}) {
  const body = {
    action,
    deviceId: localStorage.getItem('deviceId'),
    ...payload,
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

/** Display formatted JSON in a <pre> element */
function showResult(elementId, data) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = JSON.stringify(data, null, 2);
  }
}

// Registration
const registrationForm = document.getElementById('registrationForm');
if (registrationForm) {
  registrationForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    try {
      const result = await postToWebhook('register', { username, password });
      showResult('regResult', result);
    } catch (err) {
      showResult('regResult', { error: err.message });
    }
  });
}

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    try {
      const result = await postToWebhook('login', { username, password });
      if (!result.error && result.sessionToken) {
        localStorage.setItem('sessionToken', result.sessionToken);
      }
      showResult('loginResult', result);
    } catch (err) {
      showResult('loginResult', { error: err.message });
    }
  });
}

// Plan selection – expects elements with data-plan attribute inside #planContainer
const planContainer = document.getElementById('planContainer');
if (planContainer) {
  planContainer.addEventListener('click', async e => {
    const plan = e.target?.dataset?.plan;
    if (!plan) return;
    try {
      const result = await postToWebhook('choosePlan', { plan });
      showResult('planResult', result);
    } catch (err) {
      showResult('planResult', { error: err.message });
    }
  });
}

// Save project – sends current dashboard HTML
const saveBtn = document.getElementById('saveProjectBtn');
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    const dashboard = document.getElementById('dashboard');
    const data = dashboard ? dashboard.innerHTML : '';
    try {
      const result = await postToWebhook('saveProject', { data });
      showResult('projectResult', result);
    } catch (err) {
      showResult('projectResult', { error: err.message });
    }
  });
}

// Load project – expects webhook to return { data: "<html>..." }
const loadBtn = document.getElementById('loadProjectBtn');
if (loadBtn) {
  loadBtn.addEventListener('click', async () => {
    try {
      const result = await postToWebhook('loadProject', {});
      if (result.data) {
        const dashboard = document.getElementById('dashboard');
        if (dashboard) dashboard.innerHTML = result.data;
      }
      showResult('projectResult', result);
    } catch (err) {
      showResult('projectResult', { error: err.message });
    }
  });
}

// Optional: add some floating orbs/particles for visual flair (generated via CSS classes)
function createOrbs(count = 5) {
  const body = document.body;
  for (let i = 0; i < count; i++) {
    const orb = document.createElement('div');
    orb.className = 'orb';
    orb.style.left = `${Math.random() * 100}%`;
    orb.style.top = `${Math.random() * 100}%`;
    body.appendChild(orb);
  }
}
createOrbs();

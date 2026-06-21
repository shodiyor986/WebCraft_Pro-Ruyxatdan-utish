Ly8gUmVnaXN0ZXIsTG9naW4sUGxhbiBhbmQgRGFzaGJvYXJkIGZvcm0gZmx1Z3Mgd2l0aCBXaW5kb3NrIHBvc2l0aW9uCg
const WEBHOOK_URL = 'https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run';

// Generate or retrieve a persistent device ID
function getDeviceId() {
  let id = localStorage.getItem('wc_device_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('wc_device_id', id);
  }
  return id;
}

// Simple UI helper for toast messages
function showMessage(msg, type = 'info') {
  const box = document.getElementById('msg-box');
  box.textContent = msg;
  box.style.background = type === 'error' ? 'rgba(255,0,0,0.8)' : 'rgba(0,0,0,0.8)';
  box.style.display = 'block';
  setTimeout(() => (box.style.display = 'none'), 3000);
}

// Store session data (username & token) in localStorage
function setSession(user, token) {
  localStorage.setItem('wc_session', JSON.stringify({ user, token }));
}

function getSession() {
  const data = localStorage.getItem('wc_session');
  return data ? JSON.parse(data) : null;
}

function clearSession() {
  localStorage.removeItem('wc_session');
}

// Generic POST helper to the webhook
async function postToWebhook(action, payload) {
  const body = {
    action,
    deviceId: getDeviceId(),
    ...payload,
  };
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Server error');
    return data;
  } catch (e) {
    throw e;
  }
}

// Form handlers -----------------------------------------------------------
async function handleRegister(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value;
  if (!username || !password) return showMessage('All fields required', 'error');
  try {
    const data = await postToWebhook('register', { username, password });
    setSession(data.username || username, data.token);
    showMessage('Registered successfully');
    switchTab('dashboard');
    document.getElementById('user-name').textContent = username;
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const username = e.target.username.value.trim();
  const password = e.target.password.value;
  if (!username || !password) return showMessage('All fields required', 'error');
  try {
    const data = await postToWebhook('login', { username, password });
    setSession(data.username || username, data.token);
    showMessage('Login successful');
    switchTab('dashboard');
    document.getElementById('user-name').textContent = username;
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function handlePlan(e) {
  e.preventDefault();
  const plan = e.target.plan.value;
  const session = getSession();
  if (!session) return showMessage('Please login first', 'error');
  try {
    const data = await postToWebhook('choose_plan', { plan, token: session.token });
    showMessage(`Plan "${plan}" selected`);
    switchTab('dashboard');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// Dashboard utilities ----------------------------------------------------
function switchTab(targetId) {
  // Hide all forms/sections
  document.querySelectorAll('.auth-form, .auth-form.active, .tabs .tab-btn').forEach(el => {
    el.classList.remove('active');
  });
  // Activate tab button
  const btn = document.querySelector(`.tab-btn[data-target="${targetId}"]`);
  if (btn) btn.classList.add('active');
  // Show target form/section
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.target));
  });
}

function initLogout() {
  const btn = document.getElementById('logout-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      clearSession();
      showMessage('Logged out');
      switchTab('login-form');
    });
  }
}

// Project save / load -----------------------------------------------------
async function handleSaveProject(e) {
  e.preventDefault();
  const name = e.target.project_name.value.trim();
  const data = e.target.project_data.value;
  const session = getSession();
  if (!session) return showMessage('Login required', 'error');
  try {
    await postToWebhook('save_project', { name, data, token: session.token });
    showMessage('Project saved');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

async function handleLoadProject(e) {
  e.preventDefault();
  const name = e.target.project_name.value.trim();
  const session = getSession();
  if (!session) return showMessage('Login required', 'error');
  try {
    const resp = await postToWebhook('load_project', { name, token: session.token });
    // Assuming backend returns {data: '...'}
    document.getElementById('project_data').value = resp.data || '';
    showMessage('Project loaded');
  } catch (err) {
    showMessage(err.message, 'error');
  }
}

// Init ---------------------------------------------------------------
function init() {
  // Attach form listeners
  const regForm = document.getElementById('register-form');
  if (regForm) regForm.addEventListener('submit', handleRegister);
  const loginForm = document.getElementById('login-form');
  if (loginForm) loginForm.addEventListener('submit', handleLogin);
  const planForm = document.getElementById('plan-form');
  if (planForm) planForm.addEventListener('submit', handlePlan);

  // Dashboard additional forms (if they exist in the future)
  const saveForm = document.getElementById('save-project-form');
  if (saveForm) saveForm.addEventListener('submit', handleSaveProject);
  const loadForm = document.getElementById('load-project-form');
  if (loadForm) loadForm.addEventListener('submit', handleLoadProject);

  initTabs();
  initLogout();

  // Auto‑login if session exists
  const sess = getSession();
  if (sess) {
    document.getElementById('user-name').textContent = sess.user || '';
    switchTab('dashboard');
  } else {
    switchTab('login-form');
  }
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

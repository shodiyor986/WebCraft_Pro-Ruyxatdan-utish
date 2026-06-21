// reg.js - WebCraft Pro Frontend Logic

// Utility: generate UUID v4 for device ID
function generateUUID() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

// Ensure a device ID exists
if (!localStorage.getItem('deviceId')) {
  localStorage.setItem('deviceId', generateUUID());
}
const deviceId = localStorage.getItem('deviceId');
const webhookUrl = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// UI Helpers
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');
const responseArea = document.getElementById('responseArea');

function showPanel(targetId) {
  panels.forEach(p => {
    if (p.id === targetId) {
      p.classList.remove('hidden');
      p.classList.add('active');
    } else {
      p.classList.add('hidden');
      p.classList.remove('active');
    }
  });
  tabs.forEach(t => {
    if (t.dataset.target === targetId) {
      t.classList.add('active');
    } else {
      t.classList.remove('active');
    }
  });
}

// Tab click handling
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    showPanel(tab.dataset.target);
  });
});

// Initial view
showPanel('register');

// Generic POST helper
async function postToWebhook(action, payload) {
  const body = {
    action,
    deviceId,
    ...payload,
  };
  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function displayResponse(result) {
  responseArea.classList.remove('hidden');
  responseArea.textContent = JSON.stringify(result, null, 2);
}

// Register Form
const registerForm = document.getElementById('registerForm');
if (registerForm) {
  registerForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const payload = {
      username: formData.get('username'),
      email: formData.get('email'),
      password: formData.get('password'),
    };
    const result = await postToWebhook('register', payload);
    if (result.success) {
      // Assume backend returns a token
      if (result.data.token) {
        localStorage.setItem('sessionToken', result.data.token);
      }
    }
    displayResponse(result);
  });
}

// Login Form
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    };
    const result = await postToWebhook('login', payload);
    if (result.success && result.data.token) {
      localStorage.setItem('sessionToken', result.data.token);
      // After login, go to dashboard
      showPanel('dashboard');
    }
    displayResponse(result);
  });
}

// Plan selection
document.querySelectorAll('.choose-plan').forEach(btn => {
  btn.addEventListener('click', async () => {
    const plan = btn.dataset.plan;
    const token = localStorage.getItem('sessionToken') || '';
    const result = await postToWebhook('select_plan', { plan, token });
    displayResponse(result);
  });
});

// Dashboard actions
const projectList = document.getElementById('projectList');
const saveBtn = document.getElementById('saveProject');
const loadBtn = document.getElementById('loadProject');

function renderProjects(projects) {
  projectList.innerHTML = '';
  projects.forEach(p => {
    const li = document.createElement('li');
    li.textContent = p.name;
    projectList.appendChild(li);
  });
}

// Save Project (dummy payload)
if (saveBtn) {
  saveBtn.addEventListener('click', async () => {
    const token = localStorage.getItem('sessionToken') || '';
    const payload = {
      name: 'My Project ' + new Date().toISOString(),
      data: { /* could include editor state */ },
    };
    const result = await postToWebhook('save_project', { token, project: payload });
    displayResponse(result);
    // Refresh list if success
    if (result.success) {
      loadProjects();
    }
  });
}

// Load Projects
async function loadProjects() {
  const token = localStorage.getItem('sessionToken') || '';
  const result = await postToWebhook('list_projects', { token });
  if (result.success && Array.isArray(result.data.projects)) {
    renderProjects(result.data.projects);
  }
  displayResponse(result);
}

if (loadBtn) {
  loadBtn.addEventListener('click', loadProjects);
}

// Auto-load projects when dashboard becomes visible
const observer = new MutationObserver(mutations => {
  mutations.forEach(m => {
    if (m.target.classList.contains('active') && m.target.id === 'dashboard') {
      loadProjects();
    }
  });
});
observer.observe(document.getElementById('dashboard'), { attributes: true, attributeFilter: ['class'] });

// Global error handling for fetch
window.addEventListener('unhandledrejection', e => {
  console.error('Unhandled promise rejection:', e.reason);
});

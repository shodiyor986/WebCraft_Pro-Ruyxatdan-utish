// WebCraft Pro – Front‑end logic for registration, login, plans, and dashboard
// ---------------------------------------------------------------
// All actions are sent to a single webhook endpoint. The endpoint
// receives a JSON payload and returns a JSON response. The response
// may contain a new session token which we store in localStorage.
// ---------------------------------------------------------------

const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// -----------------------------------------------------------------
// Helper: persistent device identifier
// -----------------------------------------------------------------
function getDeviceId() {
  let id = localStorage.getItem("wc_device_id");
  if (!id) {
    // crypto.randomUUID() is supported in all modern browsers
    id = crypto.randomUUID();
    localStorage.setItem("wc_device_id", id);
  }
  return id;
}

// -----------------------------------------------------------------
// Session handling – simple token stored in localStorage
// -----------------------------------------------------------------
function setSession(token) {
  if (token) localStorage.setItem("wc_session", token);
}
function getSession() {
  return localStorage.getItem("wc_session") || null;
}

// -----------------------------------------------------------------
// Generic POST helper – sends action name + payload to the webhook
// -----------------------------------------------------------------
async function postAction(action, payload = {}) {
  const body = {
    action,
    deviceId: getDeviceId(),
    session: getSession(),
    ...payload,
  };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (data.session) setSession(data.session);
    return data;
  } catch (err) {
    return { error: err.message };
  }
}

// -----------------------------------------------------------------
// UI feedback – a tiny message box that lives at the top of the page
// -----------------------------------------------------------------
function showMessage(msg, type = "info") {
  let box = document.getElementById("message-box");
  if (!box) {
    box = document.createElement("div");
    box.id = "message-box";
    box.style.position = "fixed";
    box.style.top = "0";
    box.style.left = "0";
    box.style.right = "0";
    box.style.padding = "0.75rem";
    box.style.textAlign = "center";
    box.style.zIndex = "1000";
    box.style.fontWeight = "600";
    document.body.appendChild(box);
  }
  box.textContent = msg;
  box.style.background = type === "error" ? "rgba(255,107,107,0.9)" : "rgba(0,255,204,0.9)";
  box.style.color = "#111";
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 5000);
}

// -----------------------------------------------------------------
// Navigation – show/hide sections based on tab click
// -----------------------------------------------------------------
function switchSection(target) {
  document.querySelectorAll(".section").forEach((el) => (el.style.display = "none"));
  const section = document.getElementById(`${target}-section`);
  if (section) section.style.display = "block";
  // update active tab styling
  document.querySelectorAll("nav .tabs a").forEach((a) => a.classList.toggle("active", a.dataset.target === target);
}

document.querySelectorAll("nav .tabs a").forEach((a) => {
  a.addEventListener("click", (e) => {
    e.preventDefault();
    const target = a.dataset.target;
    switchSection(target);
  });
});

// -----------------------------------------------------------------
// Registration form handling
// -----------------------------------------------------------------
const registerForm = document.getElementById("register-form");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    if (!username || !password) {
      showMessage("Both fields are required", "error");
      return;
    }
    const result = await postAction("register", { username, password });
    if (result.error) showMessage(result.error, "error");
    else showMessage("Registration successful – you can now log in.");
  });
}

// -----------------------------------------------------------------
// Login form handling
// -----------------------------------------------------------------
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    if (!username || !password) {
      showMessage("Both fields are required", "error");
      return;
    }
    const result = await postAction("login", { username, password });
    if (result.error) showMessage(result.error, "error");
    else if (result.session) {
      setSession(result.session);
      showMessage("Login successful – loading dashboard…");
      switchSection("dashboard");
    } else {
      showMessage("Unexpected response from server", "error");
    }
  });
}

// -----------------------------------------------------------------
// Plan selection – buttons with data-plan attribute
// -----------------------------------------------------------------
document.querySelectorAll("[data-target='plan']").forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    const plan = e.currentTarget.dataset.plan;
    const result = await postAction("choosePlan", { plan });
    if (result.error) showMessage(result.error, "error");
    else showMessage(`Plan "${plan}" selected.`);
  });
});

// -----------------------------------------------------------------
// Code editor – use CodeMirror if available, otherwise plain textarea
// -----------------------------------------------------------------
let editor = null;
if (window.CodeMirror) {
  const txt = document.getElementById("code-editor");
  if (txt) {
    editor = CodeMirror.fromTextArea(txt, {
      lineNumbers: true,
      mode: "javascript",
      theme: "material-darker",
    });
  }
}
if (!editor) {
  const txt = document.getElementById("code-editor");
  editor = {
    getValue: () => (txt ? txt.value : ""),
    setValue: (val) => { if (txt) txt.value = val; },
  };
}

// -----------------------------------------------------------------
// Project save – expects #project-title and #save-project-btn
// -----------------------------------------------------------------
const saveBtn = document.getElementById("save-project-btn");
if (saveBtn) {
  saveBtn.addEventListener("click", async () => {
    const title = document.getElementById("project-title")?.value?.trim();
    if (!title) {
      showMessage("Project title is required", "error");
      return;
    }
    const code = editor.getValue();
    const result = await postAction("saveProject", { title, code });
    if (result.error) showMessage(result.error, "error");
    else showMessage("Project saved successfully.");
  });
}

// -----------------------------------------------------------------
// Project load – expects #project-id and #load-project-btn
// -----------------------------------------------------------------
const loadBtn = document.getElementById("load-project-btn");
if (loadBtn) {
  loadBtn.addEventListener("click", async () => {
    const id = document.getElementById("project-id")?.value?.trim();
    if (!id) {
      showMessage("Project ID is required", "error");
      return;
    }
    const result = await postAction("loadProject", { id });
    if (result.error) showMessage(result.error, "error");
    else if (result.project) {
      const { title, code } = result.project;
      document.getElementById("project-title").value = title || "";
      editor.setValue(code || "");
      showMessage("Project loaded.");
    } else {
      showMessage("Project not found", "error");
    }
  });
}

// -----------------------------------------------------------------
// Visual flair – create floating particles & glowing orbs (CSS classes defined in reg.css)
// -----------------------------------------------------------------
(function createVisuals() {
  const container = document.body;
  const create = (cls) => {
    const el = document.createElement("div");
    el.className = cls;
    el.style.left = Math.random() * 100 + "%";
    el.style.top = Math.random() * 100 + "%";
    container.appendChild(el);
    return el;
  };
  // particles
  for (let i = 0; i < 30; i++) create("particle");
  // glowing orbs
  for (let i = 0; i < 5; i++) create("orb");
})();

// End of reg.js – all listeners are now active.

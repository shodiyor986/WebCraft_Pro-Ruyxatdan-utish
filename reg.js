// reg.js - WebCraft Pro Frontend Logic
// Webhook endpoint
const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

// Utility: generate or retrieve device ID
function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// Utility: send data to webhook
async function postToWebhook(action, payload) {
  const body = {
    deviceId: getDeviceId(),
    action,
    ...payload,
  };
  try {
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { success: true, data };
  } catch (e) {
    console.error("Webhook error", e);
    return { success: false, error: e };
  }
}

// Session handling
function setSession(email) {
  localStorage.setItem("sessionUser", email);
  document.getElementById("userEmail").textContent = email;
  document.getElementById("dashboard").classList.remove("hidden");
  document.getElementById("register").classList.add("hidden");
  document.getElementById("login").classList.add("hidden");
  document.getElementById("plans").classList.add("hidden");
}

function clearSession() {
  localStorage.removeItem("sessionUser");
  document.getElementById("dashboard").classList.add("hidden");
  document.getElementById("register").classList.remove("hidden");
  document.getElementById("login").classList.remove("hidden");
  document.getElementById("plans").classList.remove("hidden");
}

function initSession() {
  const email = localStorage.getItem("sessionUser");
  if (email) setSession(email);
}

// Form Handlers
document.addEventListener("DOMContentLoaded", () => {
  initSession();

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const planButtons = document.querySelectorAll(".select-plan");
  const projectForm = document.getElementById("projectForm");
  const logoutBtn = document.getElementById("logoutBtn");

  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(registerForm);
    const payload = { email: formData.get("email"), password: formData.get("password") };
    const result = await postToWebhook("register", payload);
    const respEl = document.getElementById("registerResponse");
    if (result.success && result.data?.status === "ok") {
      respEl.textContent = "Ro'yxatdan muvaffaqiyatli o'tildi!";
      setSession(payload.email);
    } else {
      respEl.textContent = "Xatolik: " + (result.data?.message || result.error);
    }
  });

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const payload = { email: formData.get("email"), password: formData.get("password") };
    const result = await postToWebhook("login", payload);
    const respEl = document.getElementById("loginResponse");
    if (result.success && result.data?.status === "ok") {
      respEl.textContent = "Kirish muvaffaqiyatli!";
      setSession(payload.email);
    } else {
      respEl.textContent = "Xatolik: " + (result.data?.message || result.error);
    }
  });

  planButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      const email = localStorage.getItem("sessionUser");
      const result = await postToWebhook("select_plan", { email, plan });
      const respEl = document.getElementById("planResponse");
      if (result.success && result.data?.status === "ok") {
        respEl.textContent = `Plan "${plan}" tanlandi.`;
      } else {
        respEl.textContent = "Xatolik: " + (result.data?.message || result.error);
      }
    });
  });

  projectForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(projectForm);
    const payload = {
      email: localStorage.getItem("sessionUser"),
      title: formData.get("title"),
      content: formData.get("content"),
    };
    const result = await postToWebhook("save_project", payload);
    const respEl = document.getElementById("projectResponse");
    if (result.success && result.data?.status === "ok") {
      respEl.textContent = "Loyiha saqlandi.";
      loadProjects();
    } else {
      respEl.textContent = "Xatolik: " + (result.data?.message || result.error);
    }
  });

  logoutBtn?.addEventListener("click", () => {
    clearSession();
  });

  // Load existing projects on dashboard load
  async function loadProjects() {
    const email = localStorage.getItem("sessionUser");
    const result = await postToWebhook("list_projects", { email });
    const listEl = document.getElementById("projectList");
    listEl.innerHTML = "";
    if (result.success && Array.isArray(result.data?.projects)) {
      result.data.projects.forEach((p) => {
        const div = document.createElement("div");
        div.className = "project-item card glass";
        div.innerHTML = `<h4>${p.title}</h4><p>${p.content}</p>`;
        listEl.appendChild(div);
      });
    } else {
      listEl.textContent = "Loyihalar topilmadi.";
    }
  }

  if (localStorage.getItem("sessionUser")) loadProjects();
});

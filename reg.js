// reg.js - WebCraft Pro Frontend Logic
// Updated on 2026-06-21

const WEBHOOK_URL = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

async function postToWebhook(action, payload) {
  const body = { deviceId: getDeviceId(), action, ...payload };
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await response.json();
    return { success: true, data: json };
  } catch (err) {
    console.error("Webhook error:", err);
    return { success: false, error: err };
  }
}

function setSession(email) {
  localStorage.setItem("sessionUser", email);
  document.getElementById("userEmail").textContent = email;
  toggleSections({ dashboard: true });
}

function clearSession() {
  localStorage.removeItem("sessionUser");
  toggleSections({ dashboard: false });
}

function initSession() {
  const email = localStorage.getItem("sessionUser");
  if (email) setSession(email);
}

function toggleSections({ dashboard }) {
  const hide = (id) => document.getElementById(id).classList.add("hidden");
  const show = (id) => document.getElementById(id).classList.remove("hidden");
  if (dashboard) {
    hide("register");
    hide("login");
    hide("plans");
    show("dashboard");
  } else {
    show("register");
    show("login");
    show("plans");
    hide("dashboard");
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  initSession();

  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const planButtons = document.querySelectorAll(".select-plan");
  const projectForm = document.getElementById("projectForm");
  const logoutBtn = document.getElementById("logoutBtn");

  // Register
  registerForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(registerForm));
    const res = await postToWebhook("register", { email, password });
    const out = document.getElementById("registerResponse");
    if (res.success && res.data?.status === "ok") {
      out.textContent = "Ro‘yxatdan muvaffaqiyatli o‘tkazildi!";
      setSession(email);
    } else {
      out.textContent = "Xatolik: " + (res.data?.message || res.error);
    }
  });

  // Login
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { email, password } = Object.fromEntries(new FormData(loginForm));
    const res = await postToWebhook("login", { email, password });
    const out = document.getElementById("loginResponse");
    if (res.success && res.data?.status === "ok") {
      out.textContent = "Kirish muvaffaqiyatli!";
      setSession(email);
    } else {
      out.textContent = "Xatolik: " + (res.data?.message || res.error);
    }
  });

  // Plan selection
  planButtons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const plan = btn.dataset.plan;
      const email = localStorage.getItem("sessionUser");
      const res = await postToWebhook("select_plan", { email, plan });
      const out = document.getElementById("planResponse");
      if (res.success && res.data?.status === "ok") {
        out.textContent = `Plan "${plan}" tanlandi.`;
      } else {
        out.textContent = "Xatolik: " + (res.data?.message || res.error);
      }
    });
  });

  // Save project
  projectForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const { title, content } = Object.fromEntries(new FormData(projectForm));
    const email = localStorage.getItem("sessionUser");
    const res = await postToWebhook("save_project", { email, title, content });
    const out = document.getElementById("projectResponse");
    if (res.success && res.data?.status === "ok") {
      out.textContent = "Loyiha saqlandi.";
      projectForm.reset();
      loadProjects();
    } else {
      out.textContent = "Xatolik: " + (res.data?.message || res.error);
    }
  });

  // Logout
  logoutBtn?.addEventListener("click", clearSession);

  if (localStorage.getItem("sessionUser")) loadProjects();
});

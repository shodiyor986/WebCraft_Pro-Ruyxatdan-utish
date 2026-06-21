// reg.js - WebCraft Pro front‑end logic
(() => {
  const webhook = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

  // Utility: generate UUID v4
  const genUUID = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
    );
  };

  // Device ID
  let deviceId = localStorage.getItem("wc_device_id");
  if (!deviceId) {
    deviceId = genUUID();
    localStorage.setItem("wc_device_id", deviceId);
  }

  // Session handling
  const setSession = (user) => {
    localStorage.setItem("wc_session", JSON.stringify(user));
    updateUI(user);
  };
  const getSession = () => {
    const s = localStorage.getItem("wc_session");
    return s ? JSON.parse(s) : null;
  };
  const clearSession = () => {
    localStorage.removeItem("wc_session");
    updateUI(null);
  };

  // UI updates based on session
  const updateUI = (user) => {
    const dashboard = document.getElementById("dashboard");
    const authSection = document.getElementById("auth-section");
    if (user) {
      if (dashboard) dashboard.style.display = "block";
      if (authSection) authSection.style.display = "none";
      const welcome = document.getElementById("welcome");
      if (welcome) welcome.textContent = `Welcome, ${user.username}`;
    } else {
      if (dashboard) dashboard.style.display = "none";
      if (authSection) authSection.style.display = "block";
    }
  };

  // Generic request sender
  const send = async (action, payload) => {
    const body = { action, deviceId, ...payload };
    try {
      const resp = await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      return await resp.json();
    } catch (e) {
      return { error: true, message: e.message };
    }
  };

  // Form handlers
  const handleRegister = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    const result = await send("register", { username, password });
    if (result.success) {
      setSession({ username, token: result.token });
      alert("Registration successful!");
    } else {
      alert(result.message || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const username = e.target.username.value.trim();
    const password = e.target.password.value;
    const result = await send("login", { username, password });
    if (result.success) {
      setSession({ username, token: result.token });
      alert("Login successful!");
    } else {
      alert(result.message || "Login failed");
    }
  };

  const handlePlan = async (e) => {
    e.preventDefault();
    const plan = e.target.plan.value;
    const session = getSession();
    if (!session) { alert("Please login first"); return; }
    const result = await send("choose_plan", { plan, token: session.token });
    if (result.success) {
      alert(`Plan ${plan} selected`);
    } else {
      alert(result.message || "Failed to select plan");
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const name = e.target.project_name.value.trim();
    const data = e.target.project_data.value;
    const session = getSession();
    if (!session) { alert("Login required"); return; }
    const result = await send("save_project", { name, data, token: session.token });
    alert(result.message || "Project saved");
  };

  const handleLoadProject = async (e) => {
    e.preventDefault();
    const name = e.target.project_name.value.trim();
    const session = getSession();
    if (!session) { alert("Login required"); return; }
    const result = await send("load_project", { name, token: session.token });
    if (result.success) {
      const textarea = document.getElementById("project_data");
      if (textarea) textarea.value = result.data;
    } else {
      alert(result.message || "Failed to load project");
    }
  };

  // Attach listeners after DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.getElementById("register_form");
    const loginForm = document.getElementById("login_form");
    const planForm = document.getElementById("plan_form");
    const saveForm = document.getElementById("save_project_form");
    const loadForm = document.getElementById("load_project_form");
    const logoutBtn = document.getElementById("logout_btn");

    if (regForm) regForm.addEventListener("submit", handleRegister);
    if (loginForm) loginForm.addEventListener("submit", handleLogin);
    if (planForm) planForm.addEventListener("submit", handlePlan);
    if (saveForm) saveForm.addEventListener("submit", handleSaveProject);
    if (loadForm) loadForm.addEventListener("submit", handleLoadProject);
    if (logoutBtn) logoutBtn.addEventListener("click", clearSession);

    // Initial UI state
    updateUI(getSession());
  });
})();
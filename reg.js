// reg.js - WebCraft Pro front‑end logic
(() => {
  const webhook = "https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";

  // Utility: generate UUID v4
  const genUUID = () => {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,
      (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c/4).toString(16)
    );
  };

  // Device ID – persistent per browser
  let deviceId = localStorage.getItem("wc_device_id");
  if (!deviceId) {
    deviceId = genUUID();
    localStorage.setItem("wc_device_id", deviceId);
  }

  // Session handling – stored in localStorage
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

  // UI updates based on authentication state
  const updateUI = (user) => {
    const dash = document.getElementById("dashboard");
    const auth = document.getElementById("auth-section");
    if (user) {
      dash && (dash.style.display = "block");
      auth && (auth.style.display = "none");
      const welcome = document.getElementById("welcome");
      welcome && (welcome.textContent = `Welcome, ${user.username}`);
    } else {
      dash && (dash.style.display = "none");
      auth && (auth.style.display = "block");
    }
  };

  // Generic sender – POST to the webhook with deviceId
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

  // ==== Form handlers ==== //
  const handleRegister = async (e) => {
    e.preventDefault();
    const { username, password } = e.target;
    const result = await send("register", { username: username.value.trim(), password: password.value });
    if (result.success) {
      setSession({ username: username.value.trim(), token: result.token });
      alert("Registration successful!");
    } else {
      alert(result.message || "Registration failed");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { username, password } = e.target;
    const result = await send("login", { username: username.value.trim(), password: password.value });
    if (result.success) {
      setSession({ username: username.value.trim(), token: result.token });
      alert("Login successful!");
    } else {
      alert(result.message || "Login failed");
    }
  };

  const handlePlan = async (e) => {
    e.preventDefault();
    const plan = e.target.plan.value;
    const sess = getSession();
    if (!sess) return alert("Please log in first");
    const result = await send("choose_plan", { plan, token: sess.token });
    alert(result.message || (result.success ? `Plan ${plan} selected` : "Plan selection failed"));
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    const { project_name, project_data } = e.target;
    const sess = getSession();
    if (!sess) return alert("Login required");
    const result = await send("save_project", { name: project_name.value.trim(), data: project_data.value, token: sess.token });
    alert(result.message || "Project saved");
  };

  const handleLoadProject = async (e) => {
    e.preventDefault();
    const { project_name } = e.target;
    const sess = getSession();
    if (!sess) return alert("Login required");
    const result = await send("load_project", { name: project_name.value.trim(), token: sess.token });
    if (result.success) {
      const area = document.getElementById("project_data");
      if (area) area.value = result.data;
    }
    alert(result.message || (result.success ? "Project loaded" : "Load failed"));
  };

  // ==== Event listeners ==== //
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("register_form")?.addEventListener("submit", handleRegister);
    document.getElementById("login_form")?.addEventListener("submit", handleLogin);
    document.getElementById("plan_form")?.addEventListener("submit", handlePlan);
    document.getElementById("save_project_form")?.addEventListener("submit", handleSaveProject);
    document.getElementById("load_project_form")?.addEventListener("submit", handleLoadProject);
    document.getElementById("logout_btn")?.addEventListener("click", clearSession);
    // Initialise UI based on stored session
    updateUI(getSession());
  });
})();
const webhook="https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run";
if(!localStorage.deviceId)localStorage.deviceId=crypto.randomUUID();
function post(a,d){return fetch(webhook,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Object.assign({action:a,deviceId:localStorage.deviceId},d))}).then(r=>r.json());}
function show(id,r){const e=document.getElementById(id);if(e)e.textContent=JSON.stringify(r,null,2);}
document.getElementById("registrationForm")?.addEventListener("submit",e=>{e.preventDefault();post("register",{username:e.target.username.value,password:e.target.password.value}).then(r=>show("regResult",r));});
document.getElementById("loginForm")?.addEventListener("submit",e=>{e.preventDefault();post("login",{username:e.target.username.value,password:e.target.password.value}).then(r=>{if(!r.error)localStorage.sessionToken=r.sessionToken;show("loginResult",r);});});
document.getElementById("planContainer")?.addEventListener("click",e=>{if(e.target.dataset.plan)post("choosePlan",{plan:e.target.dataset.plan}).then(r=>show("planResult",r));});
document.getElementById("saveProjectBtn")?.addEventListener("click",()=>{post("saveProject",{data:document.getElementById("dashboard").innerHTML}).then(r=>show("projectResult",r));});
document.getElementById("loadProjectBtn")?.addEventListener("click",()=>{post("loadProject",{}).then(r=>{if(r.data)document.getElementById("dashboard").innerHTML=r.data;show("projectResult",r);});});
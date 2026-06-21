(function(){
  const webhook='https://b519bdd3-f226-4505-97af-912dd1c5bcb4.noclick.run';
  const genUUID=()=>{return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g,c=> (c^crypto.getRandomValues(new Uint8Array(1))[0]&15>>c/4).toString(16));};
  let deviceId=localStorage.getItem('wc_device_id');
  if(!deviceId){deviceId=genUUID();localStorage.setItem('wc_device_id',deviceId);}

  const setSession=user=>{localStorage.setItem('wc_session',JSON.stringify(user));updateUI(user);};
  const getSession=()=>{const s=localStorage.getItem('wc_session');return s?JSON.parse(s):null;};
  const clearSession=()=>{localStorage.removeItem('wc_session');updateUI(null);};

  const showMessage=(msg,type='info')=>{const box=document.getElementById('msg-box');if(!box)return;box.textContent=msg;box.style.display='block';box.style.background=type==='error'?'rgba(200,0,0,0.8)':'rgba(0,0,0,0.7)';setTimeout(()=>{box.style.display='none';},4000);};

  const updateUI=user=>{const dash=document.getElementById('dashboard');const auth=document.getElementById('auth-section');if(user){dash.style.display='block';auth.style.display='none';document.getElementById('welcome').textContent=`Xush kelibsiz, ${user.username}`;}else{dash.style.display='none';auth.style.display='block';}};

  const send=async(action,payload)=>{const body={action,deviceId,...payload};try{const r=await fetch(webhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});return await r.json();}catch(e){return {error:true,message:e.message};}};

  const handleRegister=async e=>{e.preventDefault();const {username,password}=e.target;const res=await send('register',{username:username.value.trim(),password:password.value});if(res.success){setSession({username:username.value.trim(),token:res.token});showMessage('Ro\'yxatdan\'otish muvaffaqiyatli!');}else{showMessage(res.message||'Ro\'yxatdan\'otishda xato','error');}};
  const handleLogin=async e=>{e.preventDefault();const {username,password}=e.target;const res=await send('login',{username:username.value.trim(),password:password.value});if(res.success){setSession({username:username.value.trim(),token:res.token});showMessage('Kirish muvaffaqiyatli!');}else{showMessage(res.message||'Kirishda xato','error');}};
  const handlePlan=async e=>{e.preventDefault();const plan=e.target.plan.value;const sess=getSession();if(!sess){showMessage('Avval login qiling','error');return;}const res=await send('choose_plan',{plan,token:sess.token});if(res.success){showMessage(`Reja "${plan}" tanlandi`);}else{showMessage(res.message||'Reja tanlashda xato','error');}};
  const handleSaveProject=async e=>{e.preventDefault();const {project_name,project_data}=e.target;const sess=getSession();if(!sess){showMessage('Login kerak','error');return;}const res=await send('save_project',{name:project_name.value.trim(),data:project_data.value,token:sess.token});if(res.success){showMessage('Loyiha saqlandi');}else{showMessage(res.message||'Saqlashda xato','error');}};
  const handleLoadProject=async e=>{e.preventDefault();const {project_name}=e.target;const sess=getSession();if(!sess){showMessage('Login kerak','error');return;}const res=await send('load_project',{name:project_name.value.trim(),token:sess.token});if(res.success){document.getElementById('project_data').value=res.data;showMessage('Loyiha yuklandi');}else{showMessage(res.message||'Yuklashda xato','error');}};

  const initTabs=()=>{document.querySelectorAll('.tab-btn').forEach(btn=>{btn.addEventListener('click',()=>{const target=btn.dataset.target;document.querySelectorAll('.auth-form').forEach(f=>f.hidden=true);document.getElementById(target).hidden=false;document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');});});};

  document.addEventListener('DOMContentLoaded',()=>{initTabs();
    document.getElementById('register-form')?.addEventListener('submit',handleRegister);
    document.getElementById('login-form')?.addEventListener('submit',handleLogin);
    document.getElementById('plan-form')?.addEventListener('submit',handlePlan);
    document.getElementById('save_project_form')?.addEventListener('submit',handleSaveProject);
    document.getElementById('load_project_form')?.addEventListener('submit',handleLoadProject);
    document.getElementById('logout_btn')?.addEventListener('click',clearSession);
    updateUI(getSession());
  });
})();
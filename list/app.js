// list2do — optimized, export/import removed, debounced save & search
(function(){
  const STORAGE_KEY = 'list2do_data_v2';
  // load initial data safely
  let data;
  try { data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { categories: [], meta: { xp:0, streak:0, lastComplete:null, history: {} } }; }
  catch(e){ data = { categories: [], meta: { xp:0, streak:0, lastComplete:null, history: {} } }; }

  // DOM refs (cached)
  const categoriesSlider = document.getElementById('categoriesSlider');
  const sliderDots = document.getElementById('sliderDots');
  const totalCategoriesEl = document.getElementById('totalCategories');
  const totalTasksEl = document.getElementById('totalTasks');
  const pendingTasksEl = document.getElementById('pendingTasks');
  const streakEl = document.getElementById('streak');
  const xpEl = document.getElementById('xp');
  const addCategoryBtn = document.getElementById('addCategoryBtn');
  const newCategoryInput = document.getElementById('newCategory');
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsModal = document.getElementById('settingsModal');
  const closeSettings = document.getElementById('closeSettings');
  const taskModal = document.getElementById('taskModal');
  const closeTaskModal = document.getElementById('closeTaskModal');
  const saveTaskBtn = document.getElementById('saveTaskBtn');
  const deleteTaskBtn = document.getElementById('deleteTaskBtn');
  const searchInput = document.getElementById('searchInput');
  const filterSelect = document.getElementById('filterSelect');
  const sortSelect = document.getElementById('sortSelect');
  const btnTemplates = document.getElementById('btnTemplates');
  const btnAddQuick = document.getElementById('btnAddQuick');
  const resetBtn = document.getElementById('resetBtn');
  const statsBtn = document.getElementById('statsBtn');

  let currentEdit = { catIndex: null, taskIndex: null };
  let saveTimeout = null;

  // Debounce util
  function debounce(fn, wait=180){
    let t = null;
    return function(...args){
      clearTimeout(t);
      t = setTimeout(()=> fn.apply(this,args), wait);
    };
  }

  // Save (debounced writes to localStorage to reduce I/O)
  function _doSave(){
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e){
      console.warn('Save failed:', e);
    }
    render(); // ensure UI updated after eventual save
    saveTimeout = null;
  }
  function save(){
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(_doSave, 120);
  }

  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function todayStr(){ return new Date().toISOString().split('T')[0]; }

  // XP & streak
  function addXP(amount){
    data.meta.xp = (data.meta.xp||0) + (amount||5);
  }
  function updateStreakOnComplete(){
    const today = todayStr();
    if (data.meta.lastComplete === today) return;
    if (!data.meta.lastComplete) data.meta.streak = 1;
    else {
      const lastDate = new Date(data.meta.lastComplete);
      lastDate.setDate(lastDate.getDate()+1);
      const next = lastDate.toISOString().split('T')[0];
      data.meta.streak = (next === today) ? (data.meta.streak||0) + 1 : 1;
    }
    data.meta.lastComplete = today;
    data.meta.history = data.meta.history || {};
    data.meta.history[today] = (data.meta.history[today] || 0) + 1;
  }

  // CRUD
  function addCategory(name){
    if (!name || !name.trim()) return;
    data.categories.push({ id: uid(), name: name.trim().slice(0,40), tasks: [] });
    save();
    setTimeout(()=> scrollToCategory(data.categories.length-1), 80);
  }
  function deleteCategory(idx){ if (!confirm('Hapus kategori?')) return; data.categories.splice(idx,1); save(); }
  function addTask(catIndex, taskObj){
    const cat = data.categories[catIndex];
    if (!cat) return;
    const task = Object.assign({ id: uid(), name:'', desc:'', done:false, createdAt:new Date().toISOString(), due:null, priority:'medium', tags:[], recurring:'none', xp:5 }, taskObj || {});
    cat.tasks.push(task);
    save();
  }
  function editTask(catIndex, taskIndex, updates){
    const t = data.categories[catIndex].tasks[taskIndex];
    Object.assign(t, updates);
    save();
  }
  function deleteTask(catIndex, taskIndex){ if(!confirm('Hapus tugas?')) return; data.categories[catIndex].tasks.splice(taskIndex,1); save(); }

  function toggleTask(catIndex, taskIndex){
    const t = data.categories[catIndex].tasks[taskIndex];
    t.done = !t.done;
    if (t.done){
      addXP(t.xp||5);
      updateStreakOnComplete();
      scheduleRecurring(t, catIndex);
      showLocalNotification('Tugas selesai', t.name);
    }
    save();
  }

  // Recurring (simple)
  function scheduleRecurring(task, catIndex){
    if (!task.recurring || task.recurring === 'none') return;
    const map = { daily:1, weekly:7, monthly:30 };
    const days = map[task.recurring] || 0;
    if (!days) return;
    const base = task.due ? new Date(task.due) : new Date();
    base.setDate(base.getDate() + days);
    const next = Object.assign({}, task, { id: uid(), done:false, due: base.toISOString().split('T')[0], createdAt: new Date().toISOString() });
    data.categories[catIndex].tasks.push(next);
  }

  // Render (kept efficient by mapping once, minimal DOM queries)
  function render(){
    // stats
    const totalCategories = data.categories.length;
    const totalTasks = data.categories.reduce((s,c)=>s+c.tasks.length,0);
    const pending = data.categories.reduce((s,c)=>s+c.tasks.filter(t=>!t.done).length,0);
    totalCategoriesEl.textContent = totalCategories;
    totalTasksEl.textContent = totalTasks;
    pendingTasksEl.textContent = pending;
    streakEl.textContent = data.meta.streak || 0;
    xpEl.textContent = data.meta.xp || 0;

    // categories content
    if (!data.categories.length){
      categoriesSlider.innerHTML = `<div class="category-card empty"><div class="empty-state"><i class="fas fa-clipboard-list"></i><div>Belum ada kategori. Tambah untuk mulai.</div></div></div>`;
      sliderDots.innerHTML = '';
      return;
    }

    const q = (searchInput.value || '').trim().toLowerCase();
    const sortMode = sortSelect.value;
    const filterMode = filterSelect.value;

    // build HTML for all categories (string building is fast enough here)
    const html = data.categories.map((cat, ci) => {
      const tasksFiltered = cat.tasks.filter(t => {
        if (filterMode === 'done' && !t.done) return false;
        if (filterMode === 'todo' && t.done) return false;
        if (q){
          const hay = (t.name+' '+(t.tags||[]).join(' ')+ ' ' + (t.desc||'')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      // sort visible tasks if needed
      if (sortMode === 'name') tasksFiltered.sort((a,b)=> a.name.localeCompare(b.name));
      if (sortMode === 'date') tasksFiltered.sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
      if (sortMode === 'priority') tasksFiltered.sort((a,b)=> ['high','medium','low'].indexOf(a.priority) - ['high','medium','low'].indexOf(b.priority));

      const tasksHtml = tasksFiltered.length ? tasksFiltered.map(t => `
        <div class="task ${t.done? 'done':''}" data-cat="${ci}" data-task="${t.id}">
          <i class="fas fa-grip-vertical task-handle"></i>
          <input type="checkbox" class="task-checkbox" ${t.done? 'checked':''} data-action="toggle" data-cat="${ci}" data-task-id="${t.id}">
          <div class="task-content">
            <div class="task-name">${escapeHtml(t.name)}</div>
            <div class="task-meta">${t.due? 'Due: '+t.due+' · ' : ''}${t.priority} · ${ (t.tags||[]).slice(0,3).join(', ') }</div>
          </div>
          <div class="task-actions">
            <button class="task-action-btn" data-action="edit" data-cat="${ci}" data-task-id="${t.id}"><i class="fas fa-edit"></i></button>
            <button class="task-action-btn" data-action="delete" data-cat="${ci}" data-task-id="${t.id}"><i class="fas fa-trash"></i></button>
          </div>
        </div>`).join('') : `<div class="empty-state"><i class="fas fa-tasks"></i><div>Belum ada tugas.</div></div>`;

      return `
        <div class="category-card" data-cat-index="${ci}">
          <div class="category-header"><div class="category-title"><i class="fas fa-folder"></i> ${escapeHtml(cat.name)}</div>
          <div class="category-actions"><button data-action="delete-cat" data-cat="${ci}"><i class="fas fa-trash"></i></button></div></div>
          <div class="tasks-container" id="tasks-${ci}">${tasksHtml}
            <button class="add-task-btn" data-action="add-task" data-cat="${ci}"><i class="fas fa-plus"></i> Tambah Tugas</button>
          </div>
        </div>`;
    }).join('');

    categoriesSlider.innerHTML = html;

    // dots
    sliderDots.innerHTML = data.categories.map((_,i)=>`<div class="slider-dot ${i===0? 'active':''}" data-dot="${i}"></div>`).join('');

  // events delegation (single listener)
  document.body.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]');
    if (!action) return;
    const act = action.getAttribute('data-action');

    if (act === 'add-task'){
      const ci = Number(action.dataset.cat);
      openTaskModal({ mode:'add', catIndex:ci });
    } else if (act === 'toggle'){
      const catIndex = Number(action.dataset.cat);
      const taskId = action.dataset.taskId;
      const cat = data.categories[catIndex];
      const tIndex = cat.tasks.findIndex(t=>t.id===taskId);
      if (tIndex>=0) toggleTask(catIndex, tIndex);
    } else if (act === 'edit'){
      const ci = Number(action.dataset.cat);
      const id = action.dataset.taskId;
      const cat = data.categories[ci];
      const tIndex = cat.tasks.findIndex(t=>t.id===id);
      if (tIndex>=0) openTaskModal({ mode:'edit', catIndex:ci, taskIndex:tIndex });
    } else if (act === 'delete'){
      const ci = Number(action.dataset.cat);
      const id = action.dataset.taskId;
      const cat = data.categories[ci];
      const tIndex = cat.tasks.findIndex(t=>t.id===id);
      if (tIndex>=0) deleteTask(ci,tIndex);
    } else if (act === 'delete-cat'){
      deleteCategory(Number(action.dataset.cat));
    }
  });

  // modal open/close and saving
  function openTaskModal({mode, catIndex, taskIndex}){
    currentEdit.catIndex = catIndex;
    currentEdit.taskIndex = taskIndex ?? null;
    document.getElementById('taskModalTitle').textContent = mode==='edit'? 'Edit Tugas' : 'Tambah Tugas';
    document.getElementById('taskTitle').value = '';
    document.getElementById('taskDesc').value = '';
    document.getElementById('taskPriority').value = 'medium';
    document.getElementById('taskTags').value = '';
    document.getElementById('taskDue').value = '';
    document.getElementById('taskRecurring').value = 'none';
    deleteTaskBtn.style.display = 'none';

    if (mode==='edit'){
      const task = data.categories[catIndex].tasks[taskIndex];
      document.getElementById('taskTitle').value = task.name;
      document.getElementById('taskDesc').value = task.desc || '';
      document.getElementById('taskPriority').value = task.priority || 'medium';
      document.getElementById('taskTags').value = (task.tags||[]).join(', ');
      document.getElementById('taskDue').value = task.due || '';
      document.getElementById('taskRecurring').value = task.recurring || 'none';
      deleteTaskBtn.style.display = 'inline-block';
      deleteTaskBtn.onclick = ()=> deleteTask(catIndex, taskIndex);
    }
    taskModal.classList.remove('hidden');
  }

  closeTaskModal.addEventListener('click', ()=> taskModal.classList.add('hidden'));
  closeSettings.addEventListener('click', ()=> settingsModal.classList.add('hidden'));
  settingsBtn.addEventListener('click', ()=> { settingsModal.classList.remove('hidden'); applySettings(); });

  saveTaskBtn.addEventListener('click', ()=> {
    const title = document.getElementById('taskTitle').value.trim();
    if (!title) return alert('Judul tugas kosong');
    const obj = {
      name: title,
      desc: document.getElementById('taskDesc').value.trim(),
      priority: document.getElementById('taskPriority').value,
      tags: document.getElementById('taskTags').value.split(',').map(s=>s.trim()).filter(Boolean),
      due: document.getElementById('taskDue').value || null,
      recurring: document.getElementById('taskRecurring').value,
    };
    if (currentEdit.taskIndex==null){
      addTask(currentEdit.catIndex, obj);
    } else {
      editTask(currentEdit.catIndex, currentEdit.taskIndex, obj);
    }
    taskModal.classList.add('hidden');
  });

  addCategoryBtn.addEventListener('click', ()=> {
    addCategory(newCategoryInput.value);
    newCategoryInput.value='';
  });
  newCategoryInput.addEventListener('keydown', (e)=> { if (e.key==='Enter') addCategoryBtn.click(); });

  // Templates quick add
  btnTemplates.addEventListener('click', ()=> {
    const tpl = prompt('Pilih template: 1=Belanja,2=Perjalanan,3=Belajar\nKetik angka:');
    if (!tpl) return;
    const name = tpl==='1'? 'Belanja' : tpl==='2'? 'Perjalanan' : 'Belajar';
    const items = tpl==='1'? ['Beras','Telur','Susu','Gula'] : tpl==='2'? ['Packing','Tiket','Hotel','Checklist kendaraan'] : ['Baca modul','Latihan soal','Istirahat'];
    data.categories.push({ id: uid(), name, tasks: items.map(it=>({ id: uid(), name: it, done:false, createdAt:new Date().toISOString(), xp:5 })) });
    save();
  });

  // quick add button (bottom nav) -> open new category input
  btnAddQuick.addEventListener('click', ()=> { newCategoryInput.focus(); });

  // reset
  resetBtn.addEventListener('click', ()=> { if(confirm('Reset semua data?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } });

// move task up/down
function moveTask(catIndex, taskId, dir){
  const tasks = data.categories[catIndex].tasks;
  const i = tasks.findIndex(t => t.id===taskId);
  if (i<0) return;
  const j = dir==='up'? i-1 : i+1;
  if (j<0 || j>=tasks.length) return;
  [tasks[i], tasks[j]] = [tasks[j], tasks[i]];
  save();
}

// delegation tambahan
if (act === 'up') moveTask(Number(action.dataset.cat), action.dataset.taskId, 'up');
if (act === 'down') moveTask(Number(action.dataset.cat), action.dataset.taskId, 'down');

// buka modal statistik
statsBtn.addEventListener('click', ()=> {
  const history = data.meta.history || {};
  let text = `Kategori: ${data.categories.length}<br>
  Total tugas: ${data.categories.reduce((s,c)=>s+c.tasks.length,0)}<br>
  Belum selesai: ${data.categories.reduce((s,c)=>s+c.tasks.filter(t=>!t.done).length,0)}<br>`;
  document.getElementById('statsText').innerHTML = text;

  renderHeatmap(history);
  document.getElementById('statsModal').classList.remove('hidden');
});
document.getElementById('closeStats').addEventListener('click', ()=> document.getElementById('statsModal').classList.add('hidden'));

// heatmap renderer
function renderHeatmap(history){
  const container = document.getElementById('heatmap');
  container.innerHTML='';
  const days = 70; // 10 minggu terakhir
  for(let i=days-1;i>=0;i--){
    const d = new Date(); d.setDate(d.getDate()-i);
    const key = d.toISOString().split('T')[0];
    const val = history[key]||0;
    const level = val>=5?4:val>=3?3:val>=1?2:0;
    const cell = document.createElement('div');
    cell.className='heatmap-cell level-'+level;
    cell.title = key+': '+val+' selesai';
    container.appendChild(cell);
  }
}

  // search/filter/sort: debounce render
  const debouncedRender = debounce(render, 160);
  [searchInput, filterSelect, sortSelect].forEach(el=>el.addEventListener('input', debouncedRender));

  // helpers
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // notifications (local)
  async function ensureNotifications(){
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission !== 'denied') {
      const p = await Notification.requestPermission();
      return p === 'granted';
    }
    return false;
  }
  async function showLocalNotification(title, body){
    if (!await ensureNotifications()) return;
    if (navigator.serviceWorker && navigator.serviceWorker.controller){
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return reg.showNotification(title, { body, icon: './icon-192.png', tag: 'list2do' });
    }
    try { new Notification(title, { body }); } catch(e){ console.warn('Notification failed', e); }
  }

  // reminders (checks due today)
  function checkReminders(){
    const today = todayStr();
    data.categories.forEach(cat => cat.tasks.forEach(t => {
      if (t.due && !t.done && t.due === today) showLocalNotification('Tugas jatuh tempo', t.name);
    }));
  }

  // statistics quick view
  statsBtn.addEventListener('click', ()=> {
    const history = data.meta.history || {};
    let text = `Kategori: ${data.categories.length}\nTotal tugas: ${data.categories.reduce((s,c)=>s+c.tasks.length,0)}\nBelum selesai: ${data.categories.reduce((s,c)=>s+c.tasks.filter(t=>!t.done).length,0)}\n\nKontribusi harian:\n`;
    const keys = Object.keys(history).sort().slice(-14);
    keys.forEach(k=> text += `${k}: ${history[k]} selesai\n`);
    alert(text);
  });

  // sw registration (if present)
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').then(()=> console.log('SW registered')).catch(()=> console.warn('SW failed'));
  }

  window.addEventListener('load', ()=> { checkReminders(); });
  document.addEventListener('visibilitychange', ()=> { if (document.visibilityState === 'visible') checkReminders(); });

  // expose minimal debug API
  window.__list2do = { data, save, addCategory, addTask, toggleTask };

  // settings apply
  function applySettings(){
    const theme = localStorage.getItem('list2do_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const accent = localStorage.getItem('list2do_accent') || 'blue';
    document.documentElement.setAttribute('data-accent', accent);
    document.querySelectorAll('.theme-btn').forEach(b=> b.classList.toggle('active', b.dataset.theme===theme));
    document.querySelectorAll('.accent-btn').forEach(b=> b.classList.toggle('active', b.dataset.accent===accent));
  }
  document.querySelectorAll('.theme-btn').forEach(b=> b.addEventListener('click', ()=> { localStorage.setItem('list2do_theme', b.dataset.theme); applySettings(); }));
  document.querySelectorAll('.accent-btn').forEach(b=> b.addEventListener('click', ()=> { localStorage.setItem('list2do_accent', b.dataset.accent); applySettings(); }));
  applySettings();

  // helper to open add task modal via delegated click for add-task buttons
  document.addEventListener('click', (e)=> { const el = e.target.closest('[data-action="add-task"]'); if (el) { const ci = Number(el.dataset.cat); openTaskModal({mode:'add', catIndex: ci}); } });

  // initial render
  render();

})();
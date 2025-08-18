// Simple PWA + offline-first list app
(function(){
  // Data model stored in localStorage under key 'list2do_data_v2'
  const STORAGE_KEY = 'list2do_data_v2';
  let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || { categories: [], meta: { xp:0, streak:0, lastComplete:null, history: {} } };

  // DOM refs
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
  const importFile = document.getElementById('importFile');
  const btnExport = document.getElementById('btnExport');
  const btnImport = document.getElementById('btnImport');
  const btnTemplates = document.getElementById('btnTemplates');
  const exportBtn = document.getElementById('exportBtn');
  const resetBtn = document.getElementById('resetBtn');
  const statsBtn = document.getElementById('statsBtn');

  let currentEdit = { catIndex: null, taskIndex: null };

  // Helpers
  function save(){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    render();
  }
  function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,7); }
  function todayStr(){ return new Date().toISOString().split('T')[0]; }

  // Stats & XP/Streak logic
  function addXP(amount){
    data.meta.xp = (data.meta.xp || 0) + amount;
  }
  function updateStreakOnComplete(){
    const today = todayStr();
    const last = data.meta.lastComplete;
    if (last === today) return;
    if (!last) { data.meta.streak = 1; }
    else {
      const lastDate = new Date(last);
      const nextDate = new Date(lastDate); nextDate.setDate(lastDate.getDate()+1);
      if (nextDate.toISOString().split('T')[0] === today) data.meta.streak = (data.meta.streak||0)+1;
      else data.meta.streak = 1;
    }
    data.meta.lastComplete = today;
    // history for heatmap
    data.meta.history = data.meta.history || {};
    data.meta.history[today] = (data.meta.history[today] || 0) + 1;
  }

  // CRUD Category/Task
  function addCategory(name){
    if (!name) return alert('Nama kategori kosong');
    data.categories.push({ id: uid(), name: name.trim().slice(0,40), tasks: [] });
    save();
    setTimeout(()=> scrollToCategory(data.categories.length-1), 80);
  }
  function deleteCategory(idx){ if (!confirm('Hapus kategori?')) return; data.categories.splice(idx,1); save(); }
  function addTask(catIndex, taskObj){
    const cat = data.categories[catIndex];
    if(!cat) return;
    const task = Object.assign({ id: uid(), name:'', desc:'', done:false, createdAt: new Date().toISOString(), due:null, priority:'medium', tags:[], recurring:'none', xp:5 }, taskObj || {});
    cat.tasks.push(task);
    save();
  }
  function editTask(catIndex, taskIndex, updates){
    const task = data.categories[catIndex].tasks[taskIndex];
    Object.assign(task, updates);
    save();
  }
  function deleteTask(catIndex, taskIndex){ if(!confirm('Hapus tugas?')) return; data.categories[catIndex].tasks.splice(taskIndex,1); save(); }

  function toggleTask(catIndex, taskIndex){
    const task = data.categories[catIndex].tasks[taskIndex];
    task.done = !task.done;
    if (task.done) { addXP(task.xp || 5); updateStreakOnComplete(); scheduleRecurring(task, catIndex); showLocalNotification('Tugas selesai', task.name); }
    save();
  }

  // Recurring handling: when task completed and has recurring, create next instance
  function scheduleRecurring(task, catIndex){
    if (!task.recurring || task.recurring === 'none') return;
    const map = { daily:1, weekly:7, monthly:30 };
    const days = map[task.recurring] || 0;
    if (days<=0) return;
    const dueDate = task.due ? new Date(task.due) : new Date();
    dueDate.setDate(dueDate.getDate() + days);
    const next = Object.assign({}, task, { id: uid(), done:false, due: dueDate.toISOString().split('T')[0], createdAt: new Date().toISOString() });
    data.categories[catIndex].tasks.push(next);
  }

  // Rendering
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

    // categories
    if (data.categories.length === 0){
      categoriesSlider.innerHTML = `<div class="category-card empty"><div class="empty-state"><i class="fas fa-clipboard-list"></i><div>Belum ada kategori. Tambah untuk mulai.</div></div></div>`;
      sliderDots.innerHTML = '';
      return;
    }
    const q = searchInput.value.trim().toLowerCase();
    // build cards
    categoriesSlider.innerHTML = data.categories.map((cat,ci)=>{
      const tasksFiltered = cat.tasks.filter((t)=>{
        if (filterSelect.value === 'done' && !t.done) return false;
        if (filterSelect.value === 'todo' && t.done) return false;
        if (q && !(t.name.toLowerCase().includes(q) || (t.tags||[]).join(',').toLowerCase().includes(q) || (t.desc||'').toLowerCase().includes(q))) return false;
        return true;
      });
      // sort if requested
      if (sortSelect.value === 'name') tasksFiltered.sort((a,b)=>a.name.localeCompare(b.name));
      if (sortSelect.value === 'date') tasksFiltered.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
      if (sortSelect.value === 'priority') tasksFiltered.sort((a,b)=> ['high','medium','low'].indexOf(a.priority) - ['high','medium','low'].indexOf(b.priority));
      const tasksHtml = tasksFiltered.length ? tasksFiltered.map((t,ti)=>`
        <div class="task ${t.done? 'done':''}" data-cat="${ci}" data-task="${t.id}">
          <i class="fas fa-grip-vertical task-handle"></i>
          <input type="checkbox" class="task-checkbox" ${t.done? 'checked':''} data-action="toggle" data-cat="${ci}" data-task-index="${ci}_${t.id}">
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
    // init sortable
    initSortable();
    // render dots
    renderDots();
  }

  function renderDots(){
    sliderDots.innerHTML = data.categories.map((_,i)=>`<div class="slider-dot ${i===0? 'active':''}" data-dot="${i}"></div>`).join('');
  }

  function scrollToCategory(idx){
    const card = categoriesSlider.children[idx];
    if (card) card.scrollIntoView({behavior:'smooth',inline:'center'});
  }

  // Events delegation
  document.body.addEventListener('click', (e)=>{
    const action = e.target.closest('[data-action]');
    if (action){
      const act = action.getAttribute('data-action');
      if (act === 'add-task'){
        const ci = Number(action.dataset.cat);
        openTaskModal({ mode:'add', catIndex:ci });
      } else if (act === 'toggle'){
        const [ci, id] = action.dataset.taskIndex.split('_');
        const catIndex = Number(ci);
        const cat = data.categories[catIndex];
        const tIndex = cat.tasks.findIndex(t=>t.id===id);
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
    }
  });

  // UI: open task modal
  function openTaskModal({mode, catIndex, taskIndex}){
    currentEdit.catIndex = catIndex;
    currentEdit.taskIndex = taskIndex ?? null;
    document.getElementById('taskModalTitle').textContent = mode==='edit'? 'Edit Tugas' : 'Tambah Tugas';
    // reset fields
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

  // Import/Export
  btnExport.addEventListener('click', ()=> exportData());
  exportBtn.addEventListener('click', ()=> exportData());
  btnImport.addEventListener('click', ()=> importFile.click());
  importFile.addEventListener('change', (e)=> {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader(); reader.onload = (ev)=> {
      try { const obj = JSON.parse(ev.target.result); data = obj; save(); alert('Import berhasil'); } catch(err){ alert('File tidak valid'); }
    }; reader.readAsText(f);
  });

  function exportData(){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'list2do_backup.json'; a.click(); URL.revokeObjectURL(url);
  }

  resetBtn.addEventListener('click', ()=> { if(confirm('Reset semua data?')){ localStorage.removeItem(STORAGE_KEY); location.reload(); } });

  // Templates
  btnTemplates.addEventListener('click', ()=> {
    const tpl = prompt('Pilih template: 1=Belanja,2=Perjalanan,3=Belajar\nKetik angka:');
    if (!tpl) return;
    const name = tpl==='1'? 'Belanja' : tpl==='2'? 'Perjalanan' : 'Belajar';
    const items = tpl==='1'? ['Beras','Telur','Susu','Gula'] : tpl==='2'? ['Packing','Tiket','Hotel','Checklist kendaraan'] : ['Baca modul','Latihan soal','Istirahat'];
    data.categories.push({ id: uid(), name, tasks: items.map(it=>({ id: uid(), name: it, done:false, createdAt:new Date().toISOString(), xp:5 })) });
    save();
  });

  // Search, filter, sort events
  [searchInput, filterSelect, sortSelect].forEach(el=>el.addEventListener('input', ()=> render()));

  // Sortable init per category container
  function initSortable(){
    data.categories.forEach((cat, index)=>{
      const container = document.getElementById('tasks-'+index);
      if (!container) return;
      if (container._sortable) container._sortable.destroy();
      container._sortable = new Sortable(container, { group: 'tasks', handle: '.task-handle', draggable: '.task', animation: 180, onEnd(evt){
        const oldIndex = evt.oldIndex, newIndex = evt.newIndex;
        const visibleTasks = Array.from(container.querySelectorAll('.task')).map(el=> el.getAttribute('data-task'));
        // reorder underlying tasks array by visible order (visibleTasks contains ids)
        const allTasks = data.categories[index].tasks;
        const newOrder = visibleTasks.map(id=> allTasks.find(t=>t.id===id)).filter(Boolean);
        data.categories[index].tasks = newOrder.concat(allTasks.filter(t=> !visibleTasks.includes(t.id)));
        save();
      }});
    });
  }

  // misc UI utilities
  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }

  // notification helpers (local only)
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
    // if service worker registered use it
    if (navigator.serviceWorker && navigator.serviceWorker.controller){
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) return reg.showNotification(title, { body, icon: './icon-192.png', tag: 'list2do' });
    }
    try { new Notification(title, { body }); } catch(e){ console.warn('Notification failed', e); }
  }

  // reminder checker: checks tasks with due dates and not done, and shows notification if due today or overdue
  function checkReminders(){
    const today = todayStr();
    data.categories.forEach((cat, ci)=>{
      cat.tasks.forEach((t, ti)=>{
        if (t.due && !t.done){
          if (t.due === today){
            showLocalNotification('Tugas jatuh tempo: '+t.name, 'Hari ini');
          }
        }
      });
    });
  }

  // Stats modal button
  statsBtn.addEventListener('click', ()=> {
    const history = data.meta.history || {};
    let text = `Kategori: ${data.categories.length}\nTotal tugas: ${data.categories.reduce((s,c)=>s+c.tasks.length,0)}\nBelum selesai: ${data.categories.reduce((s,c)=>s+c.tasks.filter(t=>!t.done).length,0)}\n\nKontribusi harian:\n`;
    const keys = Object.keys(history).sort().slice(-14);
    keys.forEach(k=> text += `${k}: ${history[k]} selesai\n`);
    alert(text);
  });

  // initial render and register service worker
  render();

  // service worker registration
  if ('serviceWorker' in navigator){
    navigator.serviceWorker.register('./service-worker.js').then(()=> console.log('SW registered')).catch(()=> console.warn('SW failed'));
  }

  // on load, check reminders
  window.addEventListener('load', ()=> { checkReminders(); });
  // visibility change check reminders and save frequently
  document.addEventListener('visibilitychange', ()=> { if (document.visibilityState === 'visible') checkReminders(); });

  // expose some functions to console for debugging
  window.__list2do = { data, save, addCategory, addTask, toggleTask, exportData };

  // settings apply
  function applySettings(){
    const theme = localStorage.getItem('list2do_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(b=> b.classList.toggle('active', b.dataset.theme===theme));
    const accent = localStorage.getItem('list2do_accent') || 'blue';
    document.documentElement.setAttribute('data-accent', accent);
    document.querySelectorAll('.accent-btn').forEach(b=> b.classList.toggle('active', b.dataset.accent===accent));
  }
  document.querySelectorAll('.theme-btn').forEach(b=> b.addEventListener('click', ()=> { localStorage.setItem('list2do_theme', b.dataset.theme); applySettings(); }));
  document.querySelectorAll('.accent-btn').forEach(b=> b.addEventListener('click', ()=> { localStorage.setItem('list2do_accent', b.dataset.accent); applySettings(); }));
  applySettings();

  // small helper: show task modal for category when clicking add task btn (delegated earlier)
  document.addEventListener('click', (e)=> { if (e.target && e.target.closest && e.target.closest('[data-action="add-task"]')) { const ci = Number(e.target.closest('[data-action="add-task"]').dataset.cat); openTaskModal({mode:'add', catIndex: ci}); } });

  // utility to scroll to first card on load
  if (data.categories.length) setTimeout(()=> { const el = document.querySelector('.category-card'); if (el) el.scrollIntoView({behavior:'smooth', inline:'center'}); }, 120);

})();
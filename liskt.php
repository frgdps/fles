<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0">
    <title>List2Do++ | Aplikasi To-Do List Modern</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <style>
        :root {
            --primary: #007aff;
            --primary-dark: #0052cc;
            --secondary: #61dafb;
            --success: #2ecc71;
            --danger: #e74c3c;
            --light: #f7f7f7;
            --dark: #222;
            --gray: #bbb;
            --card-bg: #ffffffcc;
            --shadow: 0 4px 16px rgba(0,0,0,0.10);
            --transition: .22s cubic-bezier(.4,0,.2,1);
        }
        html, body {
            height: 100%;
            margin: 0;
            background: linear-gradient(120deg, #007aff 0%, #61dafb 100%);
            font-family: 'Segoe UI', 'Roboto', Arial, sans-serif;
            -webkit-tap-highlight-color: transparent;
        }
        body {
            min-height: 100vh;
            box-sizing: border-box;
            color: #222;
        }
        .container {
            max-width: 100vw;
            min-height: 100dvh;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            background: transparent;
        }
        header {
            text-align: center;
            padding: 26px 10px 12px;
            color: #fff;
            background: transparent;
        }
        .logo {
            font-size: 2.7rem;
            margin-bottom: 2px;
            color: #fff;
            text-shadow: 0 1.5px 4px #0052cc22;
        }
        h1 {
            font-size: 2rem;
            margin-bottom: 2px;
            font-weight: 800;
            letter-spacing: .03em;
        }
        .subtitle {
            font-size: 1.07rem;
            opacity: 0.88;
            margin: 0 auto;
            color: #e7e7e7;
            max-width: 92vw;
            margin-bottom: 10px;
        }

        .statbar {
            display: flex;
            gap: 4vw;
            justify-content: center;
            margin: 0 0 14px;
            flex-wrap: wrap;
        }
        .stat-card {
            background: var(--card-bg);
            padding: 7px 18px;
            border-radius: 12px;
            min-width: 90px;
            text-align: center;
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .stat-card i {
            font-size: 1.2rem;
            margin-bottom: 4px;
            color: var(--primary);
        }
        .stat-value {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--primary-dark);
        }
        .stat-label {
            color: var(--gray);
            font-size: .9rem;
            margin-bottom: 0;
        }

        .app-container {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 18px;
            padding: 0 0 10vw;
        }

        .add-section {
            width: 100%;
            background: var(--card-bg);
            padding: 13px 7vw 11px 7vw;
            display: flex;
            gap: 8px;
            align-items: center;
            border-radius: 17px;
            margin: 0 auto;
            box-shadow: var(--shadow);
        }
        .add-section input {
            flex: 1;
            padding: 13px 15px;
            border-radius: 9px;
            font-size: 1.08rem;
            border: 1.5px solid #e3e8f0;
            transition: var(--transition);
            background: #fff;
        }
        .add-section input:focus {
            outline: 1.5px solid var(--primary);
            background: #f4faff;
        }
        .btn {
            padding: 12px 18px;
            border: none;
            font-size: 1rem;
            border-radius: 9px;
            font-weight: 600;
            cursor: pointer;
            background: var(--primary);
            color: #fff;
            transition: var(--transition);
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 2px 7px #007aff22;
        }
        .btn:active { background: var(--primary-dark); }
        .btn-sm { padding: 7px 12px; font-size: .92rem; }
        .btn-danger { background: var(--danger); }
        .btn-danger:active { background: #b93c2b; }
        .btn-success { background: var(--success); }
        .btn-success:active { background: #218c5b; }
        .btn-add-task {
            background: #fff;
            color: var(--primary);
            border: 2px dashed var(--primary);
            width: 100%;
            padding: 12px;
            margin-top: 8px;
            font-weight: 600;
            border-radius: 9px;
        }
        .btn-add-task:active {
            background: #e3f1fb;
        }

        .categories-container {
            display: flex;
            flex-direction: column;
            gap: 18px;
            width: 100%;
            margin: 0 auto;
            padding: 0 3vw;
        }
        .category {
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: var(--shadow);
            transition: var(--transition);
            animation: slideUp .42s;
        }
        .category-header {
            background: var(--primary);
            color: #fff;
            padding: 13px 12px 13px 15px;
            display: flex;
            align-items: center;
            border-radius: 16px 16px 0 0;
            justify-content: space-between;
            min-height: 42px;
        }
        .category-title {
            font-size: 1.13rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .category-actions {
            display: flex;
            gap: 8px;
        }

        .tasks-container {
            padding: 8px 3vw 4px 3vw;
            background: #fff9;
            border-radius: 0 0 14px 14px;
            min-height: 25px;
        }
        .task {
            display: flex;
            align-items: center;
            padding: 11px 0 11px 0;
            border-bottom: 1px solid #eee;
            transition: var(--transition);
            font-size: 1.03rem;
            cursor: grab;
        }
        .task:last-child { border-bottom: none; }
        .task-checkbox {
            width: 22px;
            height: 22px;
            margin-right: 14px;
            accent-color: var(--success);
        }
        .task-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
        }
        .task-name {
            font-size: 1.04rem;
            margin-bottom: 3px;
            word-break: break-word;
        }
        .task-date {
            font-size: 0.8rem;
            color: var(--gray);
        }
        .task.done .task-name {
            text-decoration: line-through;
            color: var(--gray);
        }
        .task-actions {
            display: flex;
            gap: 8px;
        }
        .task-action-btn {
            background: none;
            border: none;
            color: var(--gray);
            cursor: pointer;
            font-size: 1.1rem;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }
        .task-action-btn:active {
            background: #f1f2f7;
            color: var(--dark);
        }
        .task-handle {
            cursor: grab;
            margin-right: 8px;
            color: var(--gray);
            font-size: 1.2rem;
            transition: var(--transition);
        }
        .task-handle:active { color: var(--dark); }
        .empty-state {
            text-align: center;
            color: var(--gray);
            padding: 18px 0 5px;
        }
        .empty-state i {
            font-size: 2.5rem;
            margin-bottom: 8px;
            opacity: .37;
        }
        .empty-state p {
            font-size: 1.02rem;
            margin-bottom: 6px;
        }
        .sort-dropdown {
            position: relative;
            display: inline-block;
        }
        .sort-btn {
            background: none;
            border: none;
            color: #fff;
            opacity: .75;
            cursor: pointer;
            font-size: 1rem;
            padding: 2px 6px;
            margin-left: 3px;
            border-radius: 7px;
            transition: var(--transition);
        }
        .sort-btn:active, .sort-btn:focus { background: #0052cc44; opacity: 1;}
        .sort-options {
            display: none;
            position: absolute;
            background: #fff;
            min-width: 130px;
            box-shadow: 0 8px 16px #0002;
            z-index: 4;
            border-radius: 6px;
            overflow: hidden;
            left: 0;
            top: 110%;
        }
        .sort-options button {
            width: 100%;
            padding: 8px 13px;
            text-align: left;
            border: none;
            background: none;
            cursor: pointer;
            color: var(--dark);
            font-size: .98rem;
            transition: var(--transition);
        }
        .sort-options button:active { background: #eaf4ff; }
        .sort-dropdown:focus-within .sort-options,
        .sort-dropdown:hover .sort-options
        { display: block; }

        footer {
            text-align: center;
            padding: 17px 0 19px;
            color: rgba(255,255,255,0.85);
            font-size: .99rem;
            background: transparent;
            margin-top: 0;
        }

        /* Animations */
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(24px);}
            to { opacity: 1; transform: translateY(0);}
        }
        @keyframes taskComplete {
            0% { transform: scale(1);}
            50% { transform: scale(1.05);}
            100% { transform: scale(1);}
        }

        /* Drag classes */
        .category-ghost { opacity: 0.5; background: #f7faff !important; border: 2px dashed var(--primary);}
        .category-chosen { background: #e8f0fe;}
        .task-ghost { opacity: 0.55; background: #e8f6ff !important; border: 2px dashed var(--primary);}
        .task-chosen { background: #f0f9ff;}
        /* Touch: Hide scrollbars on mobile */
        ::-webkit-scrollbar { width: 0; height: 0; background: transparent;}
        /* Responsive design */
        @media (max-width: 900px) {
            .container { max-width: 100vw; }
        }
        @media (max-width: 600px) {
            .container { padding: 0; }
            .categories-container, .add-section { padding-left: 0; padding-right: 0;}
            .add-section { padding: 12px 3vw 10px 3vw;}
            .tasks-container { padding-left: 2vw; padding-right: 2vw;}
        }
        @media (max-width: 430px) {
            h1 { font-size: 1.3rem;}
            .logo { font-size: 1.7rem;}
            .category-title { font-size: 1rem;}
            .stat-value { font-size: 1.01rem;}
            .category-header { font-size: .98rem;}
            .add-section input { font-size: .98rem;}
            .stat-card { min-width: 74px; padding: 7px 9px;}
        }
        @media (max-width: 390px) {
            .add-section { flex-direction: column; gap: 7px;}
            .add-section input, .add-section button { width: 100%;}
        }
        /* iOS style: full screen, sticky input, and safe-area */
        @media (max-width: 700px) {
            .container { min-height: 100dvh; }
        }
        .bottom-spacer { height: 14vw; }
        .sticky-add-section {
            position: sticky;
            top: 0; left: 0; right: 0;
            z-index: 8;
            box-shadow: 0 4px 16px #007aff12;
            background: #f9fcfecc;
            margin-bottom: 6px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo">
                <i class="fas fa-tasks"></i>
            </div>
            <h1>List2Do<span style="color: var(--secondary)">++</span></h1>
            <div class="subtitle">To-Do List modern, kategori, offline-ready, super mobile friendly</div>
        </header>

        <div class="statbar">
            <div class="stat-card">
                <i class="fas fa-clipboard-list"></i>
                <div class="stat-value" id="pendingTasks">0</div>
                <div class="stat-label">Belum Selesai</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-layer-group"></i>
                <div class="stat-value" id="totalCategories">0</div>
                <div class="stat-label">Kategori</div>
            </div>
            <div class="stat-card">
                <i class="fas fa-list-check"></i>
                <div class="stat-value" id="totalTasks">0</div>
                <div class="stat-label">Total Tugas</div>
            </div>
        </div>

        <div class="app-container">
            <div class="add-section sticky-add-section">
                <input type="text" id="newCategory" placeholder="Tambah kategori baru..." autocomplete="off" maxlength="32">
                <button class="btn" onclick="addCategory()">
                    <i class="fas fa-plus"></i>
                </button>
            </div>

            <div id="categories" class="categories-container">
                <!-- Kategori akan di-render di sini -->
            </div>
        </div>
        <div class="bottom-spacer"></div>
        <footer>
            <p>&copy; 2025 List2Do++ | Flessan | Offline-ready PWA</p>
        </footer>
    </div>
    <script>
        let data = JSON.parse(localStorage.getItem('list2do_data')) || [];
        function calculateStats() {
            const totalCategories = data.length;
            let totalTasks = 0, pendingTasks = 0;
            data.forEach(category => {
                totalTasks += category.tasks.length;
                pendingTasks += category.tasks.filter(task => !task.done).length;
            });
            document.getElementById('totalCategories').textContent = totalCategories;
            document.getElementById('totalTasks').textContent = totalTasks;
            document.getElementById('pendingTasks').textContent = pendingTasks;
        }
        function saveData() {
            localStorage.setItem('list2do_data', JSON.stringify(data));
            calculateStats();
        }
        function addCategory() {
            const nameInput = document.getElementById('newCategory');
            const name = nameInput.value.trim().slice(0,32);
            if (!name) { nameInput.focus(); nameInput.classList.add('shake'); setTimeout(()=>nameInput.classList.remove('shake'), 400); return; }
            data.push({ name, tasks: [] });
            saveData();
            nameInput.value = '';
            renderCategories();
        }
        function deleteCategory(index) {
            if (confirm(`Hapus kategori "${data[index].name}" beserta tugasnya?`)) {
                data.splice(index, 1);
                saveData();
                renderCategories();
            }
        }
        function addTask(catIndex) {
            const taskName = prompt("Nama tugas baru:");
            if (!taskName) return;
            data[catIndex].tasks.push({
                name: taskName.trim().slice(0,120),
                done: false,
                createdAt: new Date().toISOString().split('T')[0]
            });
            saveData();
            renderCategories();
        }
        function editTask(catIndex, taskIndex) {
            const newName = prompt("Edit nama tugas:", data[catIndex].tasks[taskIndex].name);
            if (newName !== null) {
                data[catIndex].tasks[taskIndex].name = newName.trim().slice(0,120);
                saveData();
                renderCategories();
            }
        }
        function deleteTask(catIndex, taskIndex) {
            if (confirm("Hapus tugas ini?")) {
                data[catIndex].tasks.splice(taskIndex, 1);
                saveData();
                renderCategories();
            }
        }
        function toggleTask(catIndex, taskIndex) {
            data[catIndex].tasks[taskIndex].done = !data[catIndex].tasks[taskIndex].done;
            saveData();
            renderCategories();
            if (data[catIndex].tasks[taskIndex].done) {
                const taskElement = document.querySelector(`.task[data-cat="${catIndex}"][data-task="${taskIndex}"]`);
                if (taskElement) {
                    taskElement.style.animation = "taskComplete .45s";
                    setTimeout(() => { taskElement.style.animation = ""; }, 450);
                }
            }
        }
        function sortTasks(catIndex, sortBy) {
            switch(sortBy) {
                case 'name':
                    data[catIndex].tasks.sort((a,b) => a.name.localeCompare(b.name)); break;
                case 'date':
                    data[catIndex].tasks.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
                case 'completed':
                    data[catIndex].tasks.sort((a,b) => a.done - b.done); break;
            }
            saveData();
            renderCategories();
        }
        function renderCategories() {
            const container = document.getElementById('categories');
            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>Belum ada kategori</p>
                        <p>Tambah kategori baru untuk memulai!</p>
                    </div>
                `;
                calculateStats();
                return;
            }
            container.innerHTML = '';
            data.forEach((category, catIndex) => {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'category';
                categoryElement.innerHTML = `
                    <div class="category-header">
                        <div class="category-title">
                            <i class="fas fa-folder"></i>
                            <span style="max-width: 120px; overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;">${category.name}</span>
                            <div class="sort-dropdown" tabindex="0">
                                <button class="sort-btn" aria-label="Urutkan"><i class="fas fa-sort"></i></button>
                                <div class="sort-options">
                                    <button onclick="sortTasks(${catIndex}, 'name')">Sortir Nama</button>
                                    <button onclick="sortTasks(${catIndex}, 'date')">Sortir Tanggal</button>
                                    <button onclick="sortTasks(${catIndex}, 'completed')">Sortir Selesai</button>
                                </div>
                            </div>
                        </div>
                        <div class="category-actions">
                            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${catIndex})" title="Hapus kategori">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tasks-container">
                        ${category.tasks.length > 0 ? 
                        category.tasks.map((task, taskIndex) => `
                            <div class="task ${task.done ? 'done' : ''}" data-cat="${catIndex}" data-task="${taskIndex}">
                                <i class="fas fa-grip-vertical task-handle"></i>
                                <input type="checkbox" class="task-checkbox" ${task.done ? 'checked' : ''} 
                                       onclick="toggleTask(${catIndex}, ${taskIndex})">
                                <div class="task-content">
                                    <div class="task-name">${task.name}</div>
                                    <div class="task-date">Dibuat: ${task.createdAt}</div>
                                </div>
                                <div class="task-actions">
                                    <button class="task-action-btn" onclick="editTask(${catIndex}, ${taskIndex})" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="task-action-btn" onclick="deleteTask(${catIndex}, ${taskIndex})" title="Hapus">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') :
                        `<div class="empty-state" style="padding: 11px 0 7px;">
                            <i class="fas fa-tasks"></i>
                            <p>Belum ada tugas</p>
                        </div>`
                        }
                        <button class="btn btn-add-task" onclick="addTask(${catIndex})">
                            <i class="fas fa-plus"></i> Tambah Tugas
                        </button>
                    </div>
                `;
                container.appendChild(categoryElement);
            });
            calculateStats();
            setTimeout(initSortable, 0);
        }
        function initSortable() {
            if (window.Sortable) {
                const catEl = document.getElementById('categories');
                if (!catEl.sortableInstance) {
                    catEl.sortableInstance = new Sortable(catEl, {
                        animation: 150,
                        handle: '.category-header',
                        ghostClass: 'category-ghost',
                        chosenClass: 'category-chosen',
                        onEnd: function(evt) {
                            if (evt.oldIndex === evt.newIndex) return;
                            const movedItem = data[evt.oldIndex];
                            data.splice(evt.oldIndex, 1);
                            data.splice(evt.newIndex, 0, movedItem);
                            saveData();
                        }
                    });
                }
                document.querySelectorAll('.tasks-container').forEach((container, catIndex) => {
                    if (container.sortableInstance) { container.sortableInstance.destroy(); }
                    container.sortableInstance = new Sortable(container, {
                        animation: 150,
                        handle: '.task-handle',
                        ghostClass: 'task-ghost',
                        chosenClass: 'task-chosen',
                        draggable: '.task',
                        filter: '.btn-add-task,.empty-state',
                        onEnd: function(evt) {
                            const tasksEls = Array.from(container.children).filter(el => el.classList.contains('task'));
                            if (evt.oldIndex === evt.newIndex) return;
                            if (evt.oldIndex < 0 || evt.oldIndex >= tasksEls.length || evt.newIndex < 0 || evt.newIndex >= tasksEls.length) return;
                            const moved = data[catIndex].tasks[evt.oldIndex];
                            data[catIndex].tasks.splice(evt.oldIndex, 1);
                            data[catIndex].tasks.splice(evt.newIndex, 0, moved);
                            saveData();
                        }
                    });
                });
            }
        }
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => { console.log('ServiceWorker registered:', registration); })
                    .catch(error => { console.log('ServiceWorker registration failed:', error); });
            });
        }
        document.getElementById('newCategory').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addCategory();
        });
        window.addEventListener('DOMContentLoaded', renderCategories);
    </script>
</body>
</html>

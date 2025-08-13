<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>List2Do++ | Aplikasi To-Do List Modern</title>
    <link rel="manifest" href="manifest.json">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <!-- Tambahkan SortableJS setelah Font Awesome -->
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
    <style>
        :root {
            --primary: #4361ee;
            --primary-dark: #3a0ca3;
            --secondary: #4cc9f0;
            --success: #2ecc71;
            --warning: #f39c12;
            --danger: #e74c3c;
            --light: #f8f9fa;
            --dark: #2c3e50;
            --gray: #95a5a6;
            --card-bg: rgba(255, 255, 255, 0.9);
            --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
            padding: 20px;
            line-height: 1.6;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        header {
            text-align: center;
            padding: 20px 0 30px;
            color: white;
            animation: fadeIn 1s ease;
        }

        .logo {
            font-size: 3rem;
            margin-bottom: 10px;
            color: white;
            text-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 700;
        }

        .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto;
        }

        .stats {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0 30px;
            flex-wrap: wrap;
        }

        .stat-card {
            background: var(--card-bg);
            padding: 15px 25px;
            border-radius: 12px;
            text-align: center;
            box-shadow: var(--shadow);
            min-width: 140px;
        }

        .stat-card i {
            font-size: 2rem;
            margin-bottom: 10px;
            color: var(--primary);
        }

        .stat-value {
            font-size: 1.8rem;
            font-weight: bold;
            color: var(--primary-dark);
        }

        .stat-label {
            color: var(--gray);
            font-size: 0.9rem;
        }

        .app-container {
            display: flex;
            flex-direction: column;
            gap: 25px;
        }

        .add-section {
            background: var(--card-bg);
            padding: 20px;
            border-radius: 16px;
            box-shadow: var(--shadow);
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
        }

        .add-section input {
            flex: 1;
            padding: 14px 20px;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            font-size: 1rem;
            transition: var(--transition);
            min-width: 200px;
        }

        .add-section input:focus {
            outline: none;
            border-color: var(--primary);
            box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.2);
        }

        .btn {
            padding: 14px 25px;
            border: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1rem;
            cursor: pointer;
            transition: var(--transition);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-primary {
            background: var(--primary);
            color: white;
            box-shadow: 0 4px 15px rgba(67, 97, 238, 0.4);
        }

        .btn-primary:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }

        .btn-sm {
            padding: 8px 15px;
            font-size: 0.9rem;
        }

        .btn-success {
            background: var(--success);
            color: white;
        }

        .btn-danger {
            background: var(--danger);
            color: white;
        }

        .categories-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 25px;
        }

        /* --- Tambahan Drag & Drop --- */
        .category {
            background: var(--card-bg);
            border-radius: 16px;
            box-shadow: var(--shadow);
            overflow: hidden;
            transition: var(--transition);
            animation: slideUp 0.5s ease;
            cursor: grab;
            user-select: none;
        }
        .category:active {
            cursor: grabbing;
        }
        .category-ghost {
            opacity: 0.5;
            background: var(--light);
            border: 2px dashed var(--primary);
        }
        .category-chosen {
            background: rgba(67, 97, 238, 0.1);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        .category:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0, 0, 0, 0.15);
        }

        .category-header {
            background: var(--primary);
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: grab;
            user-select: none;
        }

        .category-title {
            font-size: 1.3rem;
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
            padding: 20px;
        }

        .task {
            display: flex;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #eee;
            transition: var(--transition);
            cursor: move;
        }

        .task:last-child {
            border-bottom: none;
        }

        .task:hover {
            background: rgba(236, 240, 241, 0.5);
            border-radius: 8px;
            padding: 12px 10px;
        }

        .task-checkbox {
            width: 22px;
            height: 22px;
            margin-right: 15px;
            cursor: pointer;
            accent-color: var(--success);
        }

        .task-content {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .task-name {
            font-size: 1.05rem;
            margin-bottom: 5px;
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
            font-size: 1rem;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: var(--transition);
        }

        .task-action-btn:hover {
            background: #f0f0f0;
            color: var(--dark);
        }

        .add-task-btn {
            margin-top: 15px;
            width: 100%;
            background: rgba(52, 152, 219, 0.1);
            color: var(--primary);
            border: 2px dashed var(--primary);
            padding: 12px;
        }

        .add-task-btn:hover {
            background: rgba(52, 152, 219, 0.2);
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: var(--gray);
        }

        .empty-state i {
            font-size: 4rem;
            margin-bottom: 20px;
            opacity: 0.3;
        }

        .empty-state p {
            font-size: 1.1rem;
            margin-bottom: 20px;
        }

        /* --- Drag handle & ghost for task --- */
        .task-handle {
            cursor: move;
            margin-right: 10px;
            color: var(--gray);
            transition: var(--transition);
            font-size: 1.2rem;
        }
        .task-handle:hover {
            color: var(--dark);
        }
        .task-ghost {
            opacity: 0.5;
            background: var(--light);
            border: 2px dashed var(--primary);
        }
        .task-chosen {
            background: rgba(67, 97, 238, 0.1);
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }

        /* --- Dropdown sorting --- */
        .sort-dropdown {
            position: relative;
            display: inline-block;
            margin-left: 10px;
        }

        .sort-btn {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 0.9rem;
            padding: 5px;
            opacity: 0.7;
            transition: var(--transition);
        }

        .sort-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }

        .sort-options {
            display: none;
            position: absolute;
            background: white;
            min-width: 160px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.2);
            z-index: 1;
            border-radius: 8px;
            overflow: hidden;
            left: 0;
            top: 100%;
        }

        .sort-options button {
            width: 100%;
            padding: 10px 15px;
            text-align: left;
            border: none;
            background: none;
            cursor: pointer;
            transition: var(--transition);
            color: var(--dark);
            font-size: 1rem;
        }

        .sort-options button:hover {
            background: #f5f5f5;
        }

        .sort-dropdown:hover .sort-options {
            display: block;
        }

        footer {
            text-align: center;
            padding: 30px 0 20px;
            color: rgba(255, 255, 255, 0.7);
            font-size: 0.9rem;
            margin-top: 20px;
        }

        /* Animations */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideUp {
            from { 
                opacity: 0;
                transform: translateY(30px);
            }
            to { 
                opacity: 1;
                transform: translateY(0);
            }
        }

        @keyframes taskComplete {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }

        /* Responsive design */
        @media (max-width: 768px) {
            .stats {
                flex-direction: column;
                align-items: center;
            }
            
            .stat-card {
                width: 100%;
                max-width: 300px;
            }
            
            .add-section {
                flex-direction: column;
            }
            
            .add-section input, .add-section button {
                width: 100%;
            }
        }

        @media (max-width: 480px) {
            h1 {
                font-size: 2rem;
            }
            
            .logo {
                font-size: 2.5rem;
            }
            
            .category-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .category-actions {
                align-self: flex-end;
            }
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
            <p class="subtitle">Aplikasi manajemen tugas modern dengan kategori, offline-ready, dan fitur lengkap</p>
            
            <div class="stats">
                <div class="stat-card">
                    <i class="fas fa-clipboard-list"></i>
                    <div class="stat-value" id="pendingTasks">0</div>
                    <div class="stat-label">Belum Selesai</div>
                </div>
            </div>
        </header>

        <div class="app-container">
            <div class="add-section">
                <input type="text" id="newCategory" placeholder="Masukkan nama kategori baru...">
                <button class="btn btn-primary" onclick="addCategory()">
                    <i class="fas fa-plus"></i> Tambah Kategori
                </button>
            </div>

            <div id="categories" class="categories-container">
                <!-- Kategori akan di-render di sini -->
            </div>
            <div class="stats">
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

        <footer>
            <p>&copy; 2025 List2Do++ | Flessan | Offline-ready PWA</p>
        </footer>
    </div>

    <script>
        // Data aplikasi
        let data = JSON.parse(localStorage.getItem('list2do_data')) || [];
        
        // Fungsi untuk menghitung statistik
        function calculateStats() {
            const totalCategories = data.length;
            let totalTasks = 0;
            let pendingTasks = 0;
            
            data.forEach(category => {
                totalTasks += category.tasks.length;
                pendingTasks += category.tasks.filter(task => !task.done).length;
            });
            
            document.getElementById('totalCategories').textContent = totalCategories;
            document.getElementById('totalTasks').textContent = totalTasks;
            document.getElementById('pendingTasks').textContent = pendingTasks;
        }
        
        // Fungsi untuk menyimpan data ke localStorage
        function saveData() {
            localStorage.setItem('list2do_data', JSON.stringify(data));
            calculateStats();
        }
        
        // Fungsi untuk menambahkan kategori baru
        function addCategory() {
            const nameInput = document.getElementById('newCategory');
            const name = nameInput.value.trim();
            
            if (!name) {
                alert('Nama kategori tidak boleh kosong!');
                return;
            }
            
            data.push({
                name: name,
                tasks: []
            });
            
            saveData();
            nameInput.value = '';
            renderCategories();
        }
        
        // Fungsi untuk menghapus kategori
        function deleteCategory(index) {
            if (confirm(`Hapus kategori "${data[index].name}" dan semua tugas di dalamnya?`)) {
                data.splice(index, 1);
                saveData();
                renderCategories();
            }
        }
        
        // Fungsi untuk menambahkan tugas baru
        function addTask(catIndex) {
            const taskName = prompt("Nama tugas baru:");
            if (!taskName) return;
            
            const newTask = {
                name: taskName,
                done: false,
                createdAt: new Date().toISOString().split('T')[0] // Format YYYY-MM-DD
            };
            
            data[catIndex].tasks.push(newTask);
            saveData();
            renderCategories();
        }
        
        // Fungsi untuk mengedit tugas
        function editTask(catIndex, taskIndex) {
            const newName = prompt("Edit nama tugas:", data[catIndex].tasks[taskIndex].name);
            if (newName !== null) {
                data[catIndex].tasks[taskIndex].name = newName.trim();
                saveData();
                renderCategories();
            }
        }
        
        // Fungsi untuk menghapus tugas
        function deleteTask(catIndex, taskIndex) {
            if (confirm("Hapus tugas ini?")) {
                data[catIndex].tasks.splice(taskIndex, 1);
                saveData();
                renderCategories();
            }
        }
        
        // Fungsi untuk menandai tugas selesai/belum selesai
        function toggleTask(catIndex, taskIndex) {
            data[catIndex].tasks[taskIndex].done = !data[catIndex].tasks[taskIndex].done;
            saveData();
            renderCategories();
            
            // Animasi ketika tugas diselesaikan
            if (data[catIndex].tasks[taskIndex].done) {
                const taskElement = document.querySelector(`.task[data-cat="${catIndex}"][data-task="${taskIndex}"]`);
                if (taskElement) {
                    taskElement.style.animation = "taskComplete 0.5s ease";
                    setTimeout(() => {
                        taskElement.style.animation = "";
                    }, 500);
                }
            }
        }

        // Fungsi sorting task dalam kategori
        function sortTasks(catIndex, sortBy) {
            switch(sortBy) {
                case 'name':
                    data[catIndex].tasks.sort((a, b) => a.name.localeCompare(b.name));
                    break;
                case 'date':
                    data[catIndex].tasks.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                    break;
                case 'completed':
                    data[catIndex].tasks.sort((a, b) => a.done - b.done);
                    break;
            }
            saveData();
            renderCategories();
        }

        // Fungsi untuk merender semua kategori
        function renderCategories() {
            const container = document.getElementById('categories');
            
            if (data.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <p>Belum ada kategori tugas</p>
                        <p>Tambahkan kategori baru untuk memulai</p>
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
                            ${category.name}
                            <div class="sort-dropdown">
                                <button class="sort-btn"><i class="fas fa-sort"></i></button>
                                <div class="sort-options">
                                    <button onclick="sortTasks(${catIndex}, 'name')">Sort by Name</button>
                                    <button onclick="sortTasks(${catIndex}, 'date')">Sort by Date</button>
                                    <button onclick="sortTasks(${catIndex}, 'completed')">Sort by Completed</button>
                                </div>
                            </div>
                        </div>
                        <div class="category-actions">
                            <button class="btn btn-sm btn-danger" onclick="deleteCategory(${catIndex})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="tasks-container">
                        ${
                            category.tasks.length > 0 ? 
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
                                        <button class="task-action-btn" onclick="editTask(${catIndex}, ${taskIndex})">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="task-action-btn" onclick="deleteTask(${catIndex}, ${taskIndex})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('') : 
                            `<div class="empty-state" style="padding: 20px 0;">
                                <i class="fas fa-tasks"></i>
                                <p>Belum ada tugas dalam kategori ini</p>
                            </div>`
                        }
                        <button class="btn add-task-btn" onclick="addTask(${catIndex})">
                            <i class="fas fa-plus"></i> Tambah Tugas
                        </button>
                    </div>
                `;
                
                container.appendChild(categoryElement);
            });
            
            calculateStats();

            // Setelah render, inisialisasi drag & drop
            setTimeout(initSortable, 0);
        }

        // --- Drag & Drop: inisialisasi SortableJS ---
        function initSortable() {
            // Drag & drop kategori
            if (window.Sortable) {
                if (!document.getElementById('categories').sortableInstance) {
                    document.getElementById('categories').sortableInstance = new Sortable(document.getElementById('categories'), {
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
                // Drag & drop task di setiap kategori
                document.querySelectorAll('.tasks-container').forEach((container, catIndex) => {
                    // Hindari double init
                    if (container.sortableInstance) {
                        container.sortableInstance.destroy();
                    }
                    container.sortableInstance = new Sortable(container, {
                        animation: 150,
                        handle: '.task-handle',
                        ghostClass: 'task-ghost',
                        chosenClass: 'task-chosen',
                        draggable: '.task',
                        filter: '.add-task-btn,.empty-state',
                        onEnd: function(evt) {
                            if (evt.oldIndex === evt.newIndex) return;
                            // Hitung hanya pada elemen .task
                            const tasksEls = Array.from(container.children).filter(el => el.classList.contains('task'));
                            if (evt.oldIndex < 0 || evt.oldIndex >= tasksEls.length || evt.newIndex < 0 || evt.newIndex >= tasksEls.length) return;
                            const movedTask = data[catIndex].tasks[evt.oldIndex];
                            data[catIndex].tasks.splice(evt.oldIndex, 1);
                            data[catIndex].tasks.splice(evt.newIndex, 0, movedTask);
                            saveData();
                        }
                    });
                });
            }
        }
        
        // Inisialisasi PWA
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('service-worker.js')
                    .then(registration => {
                        console.log('ServiceWorker registered:', registration);
                    })
                    .catch(error => {
                        console.log('ServiceWorker registration failed:', error);
                    });
            });
        }
        
        // Event listener untuk input enter
        document.getElementById('newCategory').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addCategory();
            }
        });
        
        // Render aplikasi saat pertama kali dimuat
        renderCategories();
    </script>
</body>
</html>

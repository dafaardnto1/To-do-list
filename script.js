// ============================================
// AMBIL ELEMEN DOM
// ============================================
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const deadlineDate = document.getElementById('deadlineDate');
const deadlineTime = document.getElementById('deadlineTime');
const addBtn = document.getElementById('addBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const totalTasksSpan = document.getElementById('totalTasks');
const completedTasksSpan = document.getElementById('completedTasks');
const filterAll = document.getElementById('filterAll');
const filterActive = document.getElementById('filterActive');
const filterCompleted = document.getElementById('filterCompleted');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// ============================================
// STATE
// ============================================
let tasks = [];
let currentFilter = 'all'; // 'all', 'active', 'completed'

// ============================================
// INIT FLATPICKR (DATE PICKER)
// ============================================
flatpickr(deadlineDate, {
    locale: 'id',
    minDate: 'today',
    dateFormat: 'd M Y',
    defaultDate: new Date(Date.now() + 86400000), // besok
});

flatpickr(deadlineTime, {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i',
    defaultDate: '17:00',
    time_24hr: true
});

// ============================================
// LOAD DATA DARI LOCALSTORAGE
// ============================================
function loadTasks() {
    const savedTasks = localStorage.getItem('premiumTasks');
    if (savedTasks) {
        tasks = JSON.parse(savedTasks);
    }
    renderTasks();
}

// ============================================
// SIMPAN KE LOCALSTORAGE
// ============================================
function saveTasks() {
    localStorage.setItem('premiumTasks', JSON.stringify(tasks));
}

// ============================================
// TAMBAH TUGAS (DENGAN DEADLINE)
// ============================================
function addTask() {
    const taskText = taskInput.value.trim();
    
    if (!taskText) {
        alert('Masukkan nama tugas!');
        return;
    }
    
    // Format deadline
    const dateStr = deadlineDate.value || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = deadlineTime.value || '17:00';
    
    // Parse tanggal untuk sorting
    const [day, month, year] = dateStr.split(' ');
    const monthMap = { 'Jan':0, 'Feb':1, 'Mar':2, 'Apr':3, 'Mei':4, 'Jun':5, 'Jul':6, 'Agu':7, 'Sep':8, 'Okt':9, 'Nov':10, 'Des':11 };
    const deadlineDateObj = new Date(year, monthMap[month], parseInt(day));
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        priority: prioritySelect.value,
        completed: false,
        createdAt: new Date().toLocaleDateString('id-ID', {
            day: 'numeric', month: 'short', year: 'numeric'
        }),
        deadlineDate: dateStr,
        deadlineTime: timeStr,
        deadlineTimestamp: deadlineDateObj.getTime(), // buat sorting
        hasDeadline: true
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    
    // Reset form
    taskInput.value = '';
    taskInput.focus();
}

// ============================================
// CEK STATUS DEADLINE
// ============================================
function getDeadlineStatus(deadlineTimestamp) {
    const now = new Date().getTime();
    const diffDays = Math.ceil((deadlineTimestamp - now) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { class: 'deadline-urgent', text: 'Terlewat' };
    if (diffDays === 0) return { class: 'deadline-urgent', text: 'Hari ini' };
    if (diffDays === 1) return { class: 'deadline-warning', text: 'Besok' };
    if (diffDays <= 3) return { class: 'deadline-warning', text: `${diffDays} hari lagi` };
    return { class: 'deadline-ok', text: `${diffDays} hari lagi` };
}

// ============================================
// TOGGLE STATUS TUGAS
// ============================================
function toggleTask(id) {
    tasks = tasks.map(task => {
        if (task.id === id) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    saveTasks();
    renderTasks();
}

// ============================================
// HAPUS TUGAS
// ============================================
function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    renderTasks();
}

// ============================================
// HAPUS SEMUA YANG SUDAH SELESAI
// ============================================
function clearCompleted() {
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    renderTasks();
}

// ============================================
// FILTER TUGAS
// ============================================
function getFilteredTasks() {
    let filtered = tasks;
    
    // Filter berdasarkan status
    switch(currentFilter) {
        case 'active':
            filtered = tasks.filter(task => !task.completed);
            break;
        case 'completed':
            filtered = tasks.filter(task => task.completed);
            break;
    }
    
    // Sort by deadline (yang paling mepet duluan)
    return filtered.sort((a, b) => {
        // Yang ga punya deadline ditaruh di bawah
        if (!a.deadlineTimestamp) return 1;
        if (!b.deadlineTimestamp) return -1;
        return a.deadlineTimestamp - b.deadlineTimestamp;
    });
}

// ============================================
// RENDER TUGAS KE HTML
// ============================================
function renderTasks() {
    const filteredTasks = getFilteredTasks();
    
    // Update empty state
    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
        taskList.innerHTML = '';
    } else {
        emptyState.classList.add('hidden');
        
        taskList.innerHTML = filteredTasks.map(task => {
            const deadlineStatus = task.deadlineTimestamp ? getDeadlineStatus(task.deadlineTimestamp) : null;
            
            return `
            <div class="task-item flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:border-purple-500/30 transition group">
                <div class="flex items-center gap-4 flex-1">
                    <input type="checkbox" 
                           class="task-checkbox" 
                           ${task.completed ? 'checked' : ''}
                           data-id="${task.id}">
                    
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-1">
                            <span class="${task.completed ? 'line-through text-gray-500' : 'text-white'} font-medium">
                                ${task.text}
                            </span>
                            <span class="priority-${task.priority} text-xs px-2 py-0.5 rounded-full">
                                ${task.priority}
                            </span>
                        </div>
                        
                        <div class="flex flex-wrap items-center gap-3 text-xs">
                            <span class="text-gray-600">
                                <i class="far fa-calendar-alt mr-1"></i> Dibuat: ${task.createdAt}
                            </span>
                            
                            ${task.deadlineDate ? `
                            <span class="${deadlineStatus?.class}">
                                <i class="far fa-clock mr-1"></i> Deadline: ${task.deadlineDate} ${task.deadlineTime} (${deadlineStatus?.text})
                            </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <button class="delete-btn text-gray-500 hover:text-red-400 transition ml-2" data-id="${task.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `}).join('');
        
        // Attach event listeners
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                toggleTask(id);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.delete-btn').dataset.id);
                deleteTask(id);
            });
        });
    }
    
    // Update stats
    updateStats();
    updateFilterButtons();
}

// ============================================
// UPDATE STATISTIK
// ============================================
function updateStats() {
    totalTasksSpan.textContent = tasks.length;
    completedTasksSpan.textContent = tasks.filter(t => t.completed).length;
}

// ============================================
// UPDATE FILTER BUTTONS
// ============================================
function updateFilterButtons() {
    [filterAll, filterActive, filterCompleted].forEach(btn => {
        btn.classList.remove('active', 'bg-purple-500/15', 'text-purple-400');
    });
    
    switch(currentFilter) {
        case 'all':
            filterAll.classList.add('active', 'bg-purple-500/15', 'text-purple-400');
            break;
        case 'active':
            filterActive.classList.add('active', 'bg-purple-500/15', 'text-purple-400');
            break;
        case 'completed':
            filterCompleted.classList.add('active', 'bg-purple-500/15', 'text-purple-400');
            break;
    }
}

// ============================================
// SETUP FILTER EVENT LISTENERS
// ============================================
filterAll.addEventListener('click', () => {
    currentFilter = 'all';
    renderTasks();
});

filterActive.addEventListener('click', () => {
    currentFilter = 'active';
    renderTasks();
});

filterCompleted.addEventListener('click', () => {
    currentFilter = 'completed';
    renderTasks();
});

// ============================================
// EVENT LISTENERS
// ============================================
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

clearCompletedBtn.addEventListener('click', clearCompleted);

// ============================================
// INITIAL LOAD
// ============================================
loadTasks();
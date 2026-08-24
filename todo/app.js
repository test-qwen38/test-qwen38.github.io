// ===== STATE =====
let currentFilter = 'all';

// ===== ELEMENTS =====
const taskInput = document.getElementById('taskInput');
const btnAdd = document.getElementById('btnAdd');
const taskList = document.getElementById('taskList');
const footer = document.getElementById('footer');
const footerInfo = document.getElementById('footerInfo');
const btnClear = document.getElementById('btnClear');
const prioritySelect = document.getElementById('prioritySelect');
const activeCount = document.getElementById('activeCount');
const doneCount = document.getElementById('doneCount');
const dateDisplay = document.getElementById('dateDisplay');
const filterBtns = document.querySelectorAll('.filter-btn');

// ===== DATE DISPLAY =====
const now = new Date();
const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
dateDisplay.textContent = now.toLocaleDateString('ru-RU', options);

// ===== RENDER =====
function render() {
    const filtered = TaskService.filterBy(currentFilter);

    taskList.innerHTML = '';

    if (filtered.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        const msgs = {
            all: ['📋', 'Задач пока нет'],
            active: ['🎉', 'Все задачи выполнены!'],
            completed: ['🔍', 'Нет выполненных задач']
        };
        const [icon, text] = msgs[currentFilter];
        empty.innerHTML = `<div class="icon">${icon}</div><p>${text}</p>`;
        taskList.appendChild(empty);
    } else {
        filtered.forEach(task => {
            const el = document.createElement('div');
            el.className = `task-item${task.completed ? ' completed' : ''}`;
            el.dataset.id = task.id;
            el.dataset.priority = task.priority;

            const dateStr = new Date(task.createdAt).toLocaleTimeString('ru-RU', {
                hour: '2-digit', minute: '2-digit'
            });

            el.innerHTML = `
                <div class="checkbox${task.completed ? ' checked' : ''}" data-action="toggle"></div>
                <span class="task-text">${escapeHtml(task.text)}</span>
                <span class="task-date">${dateStr}</span>
                <button class="btn-delete" data-action="delete" title="Удалить">✕</button>
            `;

            taskList.appendChild(el);
        });
    }

    const active = TaskService.countActive();
    const done = TaskService.countCompleted();
    activeCount.textContent = active;
    doneCount.textContent = done;

    footer.style.display = (active + done) > 0 ? 'flex' : 'none';
    btnClear.style.display = done > 0 ? 'block' : 'none';
}

// ===== ESCAPE HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== ADD TASK =====
function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        taskInput.style.borderColor = 'var(--danger)';
        taskInput.style.boxShadow = '0 0 0 4px var(--danger-glow)';
        setTimeout(() => {
            taskInput.style.borderColor = '';
            taskInput.style.boxShadow = '';
        }, 800);
        return;
    }

    TaskService.add(text, prioritySelect.value);
    taskInput.value = '';
    render();
    taskInput.focus();
}

// ===== EVENTS =====
btnAdd.addEventListener('click', addTask);

taskInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') addTask();
});

// Delegated events on task list
taskList.addEventListener('click', e => {
    const item = e.target.closest('.task-item');
    if (!item) return;

    const id = item.dataset.id;
    const action = e.target.dataset.action;

    if (action === 'toggle') {
        TaskService.toggle(id);
        render();
    }

    if (action === 'delete') {
        item.classList.add('removing');
        setTimeout(() => {
            TaskService.remove(id);
            render();
        }, 350);
    }
});

// Double-click to edit
taskList.addEventListener('dblclick', e => {
    const textEl = e.target.closest('.task-text');
    if (!textEl) return;

    const item = textEl.closest('.task-item');
    const id = item.dataset.id;
    const tasks = TaskService.getAll();
    const task = tasks.find(t => t.id === id);
    if (!task || task.completed) return;

    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    input.className = 'task-text editing';

    textEl.replaceWith(input);
    input.focus();
    input.select();

    const finishEdit = () => {
        const newText = input.value.trim();
        if (newText) {
            TaskService.editText(id, newText);
        }
        render();
    };

    input.addEventListener('blur', finishEdit);
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur();
        if (e.key === 'Escape') {
            input.value = task.text;
            input.blur();
        }
    });
});

// Filters
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        render();
    });
});

// Clear completed
btnClear.addEventListener('click', () => {
    TaskService.clearCompleted();
    render();
});

// ===== INIT =====
render();

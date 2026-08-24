const TaskService = (() => {
    let tasks = StorageAdapter.getAll();

    const generateId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    return {
        getAll() {
            return tasks;
        },

        add(text, priority) {
            tasks.unshift({
                id: generateId(),
                text,
                completed: false,
                priority,
                createdAt: Date.now()
            });
            StorageAdapter.save(tasks);
        },

        toggle(id) {
            const task = tasks.find(t => t.id === id);
            if (task) {
                task.completed = !task.completed;
                StorageAdapter.save(tasks);
            }
        },

        remove(id) {
            tasks = tasks.filter(t => t.id !== id);
            StorageAdapter.save(tasks);
        },

        editText(id, newText) {
            const task = tasks.find(t => t.id === id);
            if (task && newText.trim()) {
                task.text = newText.trim();
                StorageAdapter.save(tasks);
            }
        },

        clearCompleted() {
            tasks = tasks.filter(t => !t.completed);
            StorageAdapter.save(tasks);
        },

        filterBy(filter) {
            if (filter === 'active') return tasks.filter(t => !t.completed);
            if (filter === 'completed') return tasks.filter(t => t.completed);
            return [...tasks];
        },

        countActive() {
            return tasks.filter(t => !t.completed).length;
        },

        countCompleted() {
            return tasks.filter(t => t.completed).length;
        }
    };
})();

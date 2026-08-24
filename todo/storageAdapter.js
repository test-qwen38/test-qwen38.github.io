const StorageAdapter = (() => {
    const KEY = 'tasks';

    return {
        getAll() {
            const data = localStorage.getItem(KEY);
            return data ? JSON.parse(data) : [];
        },

        save(tasks) {
            localStorage.setItem(KEY, JSON.stringify(tasks));
        }
    };
})();

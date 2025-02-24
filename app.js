document.addEventListener('DOMContentLoaded', () => {
    // Инициализация состояния
    let state = {
        tasks: JSON.parse(localStorage.getItem('tasks')) || [],
        groups: JSON.parse(localStorage.getItem('groups')) || ['Работа', 'Дом'],
        currentDate: new Date(),
        theme: localStorage.getItem('theme') || 'light',
        autoTheme: localStorage.getItem('autoTheme') === 'true',
        view: localStorage.getItem('view') || 'day'
    };

    // Инициализация выбора даты и времени
    flatpickr("#date-picker", {
        dateFormat: "Y-m-d",
        defaultDate: state.currentDate
    });

    flatpickr("#time-picker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true
    });

    // Обработка темы
    function updateTheme() {
        if (state.autoTheme) {
            const hour = new Date().getHours();
            state.theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
        }
        document.body.className = `${state.theme}-theme`;
        localStorage.setItem('theme', state.theme);
    }

    // Обработчики меню
    document.getElementById('menu-button').addEventListener('click', () => {
        document.getElementById('side-menu').classList.add('open');
    });

    document.getElementById('close-menu').addEventListener('click', () => {
        document.getElementById('side-menu').classList.remove('open');
    });

    // Переключение темы
    document.getElementById('theme-toggle').addEventListener('change', (e) => {
        state.theme = e.target.checked ? 'dark' : 'light';
        updateTheme();
    });

    document.getElementById('auto-theme-toggle').addEventListener('change', (e) => {
        state.autoTheme = e.target.checked;
        localStorage.setItem('autoTheme', state.autoTheme);
        if (state.autoTheme) updateTheme();
    });

    // Навигация по датам
    document.querySelectorAll('.date-buttons button').forEach(button => {
        button.addEventListener('click', () => {
            const date = button.dataset.date;
            const today = new Date();
            
            switch(date) {
                case 'yesterday':
                    state.currentDate = new Date(today.setDate(today.getDate() - 1));
                    break;
                case 'today':
                    state.currentDate = new Date();
                    break;
                case 'tomorrow':
                    state.currentDate = new Date(today.setDate(today.getDate() + 1));
                    break;
            }
            renderTasks();
        });
    });

    // Обработка задач
    function addTask(task, time, group) {
        state.tasks.push({
            text: task,
            time: time,
            group: group,
            date: state.currentDate.toISOString().split('T')[0],
            completed: false
        });
        localStorage.setItem('tasks', JSON.stringify(state.tasks));
        renderTasks();
        updateStatistics();
    }

    function renderTasks() {
        const timeline = document.getElementById('timeline');
        timeline.innerHTML = '';

        const currentDateTasks = state.tasks.filter(task => 
            task.date === state.currentDate.toISOString().split('T')[0]
        );

        // Группировка по времени
        const timeSlots = {};
        currentDateTasks.forEach(task => {
            const hour = task.time ? task.time.split(':')[0] : 'Без времени';
            if (!timeSlots[hour]) timeSlots[hour] = [];
            timeSlots[hour].push(task);
        });

        // Отображение временных слотов
        Object.keys(timeSlots).sort().forEach(hour => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'time-slot';
            slotDiv.innerHTML = `<h3>${hour === 'Без времени' ? hour : hour + ':00'}</h3>`;

            timeSlots[hour].forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.className = 'task-item';
                taskDiv.innerHTML = `
                    <span>${task.text}</span>
                    <div>
                        ${task.group ? `<span class="group-tag">${task.group}</span>` : ''}
                        <button onclick="completeTask('${task.id}')">✓</button>
                        <button onclick="deleteTask('${task.id}')">×</button>
                    </div>
                `;
                slotDiv.appendChild(taskDiv);
            });

            timeline.appendChild(slotDiv);
        });
    }

    // Статистика
    function updateStatistics() {
        const ctx = document.getElementById('stats-chart').getContext('2d');
        const groupCounts = {};
        
        state.tasks.forEach(task => {
            if (task.group) {
                groupCounts[task.group] = (groupCounts[task.group] || 0) + 1;
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(groupCounts),
                datasets: [{
                    label: 'Задачи по группам',
                    data: Object.values(groupCounts),
                    backgroundColor: '#2d5a30'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Инициализация
    updateTheme();
    renderTasks();
    updateStatistics();

    // Автоматическое обновление темы
    if (state.autoTheme) {
        setInterval(updateTheme, 60000); // Проверка каждую минуту
    }
});

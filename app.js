// Глобальные переменные
let apps = [];
let filteredApps = [];
let currentCategory = 'All';
let editMode = false;
let longPressTimer = null;
let selectedAppForDelete = null;

// Предустановленные приложения
const defaultApps = [
    {
        name: "",
        url: "",
        icon: "",
        category: "",
        description: "",
        id: "",
        addedDate: Date.now()
    }
];

const categories = ["All", "Games", "Finance", "Utilities", "Shopping", "Business", "Marketplace", "Social"];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeTelegramWebApp();
    loadApps();
    initializeEventListeners();
    renderCategories();
    filterAndRenderApps();
    updateStatusTime();
    
    // Обновляем время каждую минуту
    setInterval(updateStatusTime, 60000);
});

// Инициализация Telegram WebApp
function initializeTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Расширяем окно на весь экран
        tg.expand();
        
        // Устанавливаем цвета темы
        if (tg.themeParams) {
            document.documentElement.style.setProperty('--tg-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-hint-color', tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-button-color', tg.themeParams.button_color || '#0088cc');
        }
        
        // Включаем haptic feedback
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Загрузка приложений
function loadApps() {
    try {
        const savedApps = localStorage.getItem('miniAppsLauncher');
        if (savedApps) {
            const parsedApps = JSON.parse(savedApps);
            // Объединяем сохраненные приложения с предустановленными
            const existingIds = parsedApps.map(app => app.id);
            const newDefaultApps = defaultApps.filter(app => !existingIds.includes(app.id));
            apps = [...parsedApps, ...newDefaultApps];
        } else {
            apps = [...defaultApps];
        }
    } catch (error) {
        console.error('Ошибка загрузки приложений:', error);
        apps = [...defaultApps];
    }
    
    filteredApps = [...apps];
    saveApps();
}

// Сохранение приложений
function saveApps() {
    try {
        localStorage.setItem('miniAppsLauncher', JSON.stringify(apps));
    } catch (error) {
        console.error('Ошибка сохранения приложений:', error);
    }
}

// Инициализация обработчиков событий
function initializeEventListeners() {
    // Кнопка добавления приложения
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    
    // Поиск
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Модальное окно
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeAddModal);
    }
    
    const cancelAdd = document.getElementById('cancel-add');
    if (cancelAdd) {
        cancelAdd.addEventListener('click', closeAddModal);
    }
    
    const addAppForm = document.getElementById('add-app-form');
    if (addAppForm) {
        addAppForm.addEventListener('submit', handleAddApp);
    }
    
    // Закрытие модального окна по клику на backdrop
    const modalBackdrop = document.querySelector('.modal-backdrop');
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeAddModal);
    }
    
    // Контекстное меню
    const deleteAppBtn = document.getElementById('delete-app');
    if (deleteAppBtn) {
        deleteAppBtn.addEventListener('click', handleDeleteApp);
    }
    
    const editAppBtn = document.getElementById('edit-app');
    if (editAppBtn) {
        editAppBtn.addEventListener('click', handleEditApp);
    }
    
    const cancelMenu = document.getElementById('cancel-menu');
    if (cancelMenu) {
        cancelMenu.addEventListener('click', closeContextMenu);
    }
    
    const contextBackdrop = document.querySelector('.context-menu-backdrop');
    if (contextBackdrop) {
        contextBackdrop.addEventListener('click', closeContextMenu);
    }
}

// Рендеринг категорий
function renderCategories() {
    const categoriesContainer = document.getElementById('categories');
    if (!categoriesContainer) return;
    
    categoriesContainer.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('button');
        categoryElement.className = `category-item ${category === currentCategory ? 'active' : ''}`;
        categoryElement.textContent = getCategoryName(category);
        categoryElement.addEventListener('click', () => selectCategory(category));
        categoriesContainer.appendChild(categoryElement);
    });
}

// Получение русского названия категории
function getCategoryName(category) {
    const categoryNames = {
        'All': 'Все',
        'Games': 'Игры',
        'Finance': 'Финансы',
        'Utilities': 'Утилиты',
        'Shopping': 'Покупки',
        'Business': 'Бизнес',
        'Marketplace': 'Маркетплейс',
        'Social': 'Социальное'
    };
    return categoryNames[category] || category;
}

// Выбор категории
function selectCategory(category) {
    currentCategory = category;
    renderCategories();
    filterAndRenderApps();
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.selectionChanged();
    }
}

// Поиск приложений
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    filterAndRenderApps(searchTerm);
}

// Фильтрация и рендеринг приложений
function filterAndRenderApps(searchTerm = '') {
    let filtered = [...apps];
    
    // Фильтр по категории
    if (currentCategory !== 'All') {
        filtered = filtered.filter(app => app.category === currentCategory);
    }
    
    // Фильтр по поиску
    if (searchTerm) {
        filtered = filtered.filter(app => 
            app.name.toLowerCase().includes(searchTerm) ||
            (app.description && app.description.toLowerCase().includes(searchTerm))
        );
    }
    
    filteredApps = filtered;
    renderApps();
}

// Рендеринг приложений
function renderApps() {
    const appsGrid = document.getElementById('apps-grid');
    if (!appsGrid) return;
    
    appsGrid.innerHTML = '';
    
    if (filteredApps.length === 0) {
        renderEmptyState(appsGrid);
        return;
    }
    
    filteredApps.forEach((app, index) => {
        const appElement = createAppElement(app, index);
        appsGrid.appendChild(appElement);
    });
}

// Создание элемента приложения
function createAppElement(app, index) {
    const appElement = document.createElement('div');
    appElement.className = `app-icon ${editMode ? 'edit-mode' : ''}`;
    appElement.dataset.appId = app.id;
    
    const iconBgClass = `bg-${(index % 8) + 1}`;
    
    appElement.innerHTML = `
        <div class="app-icon-image ${iconBgClass}">
            ${isEmoji(app.icon) ? app.icon : `<img src="${app.icon}" alt="${app.name}" onerror="this.parentElement.innerHTML='📱'">`}
            <div class="delete-indicator">×</div>
        </div>
        <span class="app-icon-name">${app.name}</span>
    `;
    
    // Обработчики событий для клика
    appElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAppClick(e, app);
    });
    
    // Touch events для длинного нажатия
    let touchStartTime = 0;
    let longPressTriggered = false;
    
    appElement.addEventListener('touchstart', (e) => {
        if (editMode) return;
        touchStartTime = Date.now();
        longPressTriggered = false;
        
        longPressTimer = setTimeout(() => {
            longPressTriggered = true;
            selectedAppForDelete = app;
            enterEditMode();
            
            // Haptic feedback для длинного нажатия
            if (window.Telegram && window.Telegram.WebApp) {
                window.Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
            }
        }, 800);
    }, { passive: false });
    
    appElement.addEventListener('touchend', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        const touchDuration = Date.now() - touchStartTime;
        if (!longPressTriggered && touchDuration < 800) {
            // Короткое нажатие - открываем приложение
            handleAppClick(e, app);
        }
    }, { passive: false });
    
    appElement.addEventListener('touchcancel', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    // Mouse events для десктопа
    appElement.addEventListener('mousedown', (e) => {
        if (editMode) return;
        
        longPressTimer = setTimeout(() => {
            selectedAppForDelete = app;
            enterEditMode();
        }, 800);
    });
    
    appElement.addEventListener('mouseup', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    appElement.addEventListener('mouseleave', () => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    // Обработчик удаления
    const deleteBtn = appElement.querySelector('.delete-indicator');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            selectedAppForDelete = app;
            openContextMenu();
        });
    }
    
    return appElement;
}

// Проверка является ли строка emoji
function isEmoji(str) {
    if (!str) return false;
    const emojiRegex = /^[\u{1F300}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}₿💰🪙🌸⚡💎🛒📱🐹]+$/u;
    return emojiRegex.test(str);
}

// Обработка клика по приложению
function handleAppClick(event, app) {
    if (editMode) {
        return;
    }
    
    event.preventDefault();
    event.stopPropagation();
    
    console.log('Открываем приложение:', app.name, app.url);
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
    }
    
    // Открываем приложение
    try {
        window.open(app.url, '_blank', 'noopener,noreferrer');
    } catch (error) {
        console.error('Ошибка при открытии приложения:', error);
        // Fallback
        window.location.href = app.url;
    }
}

// Вход в режим редактирования
function enterEditMode() {
    editMode = true;
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.classList.add('edit-mode', 'shake');
    });
    
    // Показываем кнопку "Готово" в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.MainButton.setText('Готово');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(exitEditMode);
    }
}

// Выход из режима редактирования
function exitEditMode() {
    editMode = false;
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.classList.remove('edit-mode', 'shake');
    });
    
    // Скрываем кнопку в Telegram
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.MainButton.hide();
    }
}

// Рендеринг пустого состояния
function renderEmptyState(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
        <div class="empty-state-icon">📱</div>
        <div class="empty-state-message">Приложения не найдены</div>
        <div class="empty-state-description">Попробуйте изменить поисковый запрос или категорию</div>
    `;
    container.appendChild(emptyState);
}

// Открытие модального окна добавления
function openAddModal() {
    const modal = document.getElementById('add-app-modal');
    if (modal) {
        modal.classList.remove('hidden');
        const nameInput = document.getElementById('app-name');
        if (nameInput) {
            nameInput.focus();
        }
        
        // Haptic feedback
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    }
}

// Закрытие модального окна добавления
function closeAddModal() {
    const modal = document.getElementById('add-app-modal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('add-app-form');
        if (form) {
            form.reset();
        }
    }
}

// Обработка добавления приложения
function handleAddApp(event) {
    event.preventDefault();
    
    const name = document.getElementById('app-name').value.trim();
    const url = document.getElementById('app-url').value.trim();
    const icon = document.getElementById('app-icon').value.trim() || '📱';
    const category = document.getElementById('app-category').value;
    const description = document.getElementById('app-description').value.trim();
    
    if (!name || !url) {
        alert('Пожалуйста, заполните название и URL приложения');
        return;
    }
    
    const newApp = {
        id: Date.now().toString(),
        name,
        url,
        icon,
        category,
        description,
        addedDate: Date.now()
    };
    
    apps.push(newApp);
    saveApps();
    filterAndRenderApps();
    closeAddModal();
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
    // Показываем уведомление
    showNotification('Приложение добавлено!', 'success');
}

// Открытие контекстного меню
function openContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.classList.remove('hidden');
    }
}

// Закрытие контекстного меню
function closeContextMenu() {
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.classList.add('hidden');
    }
    selectedAppForDelete = null;
}

// Обработка удаления приложения
function handleDeleteApp() {
    if (!selectedAppForDelete) return;
    
    apps = apps.filter(app => app.id !== selectedAppForDelete.id);
    saveApps();
    filterAndRenderApps();
    closeContextMenu();
    exitEditMode();
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('warning');
    }
    
    showNotification('Приложение удалено', 'info');
}

// Обработка редактирования приложения
function handleEditApp() {
    if (!selectedAppForDelete) return;
    
    // Заполняем форму данными приложения
    document.getElementById('app-name').value = selectedAppForDelete.name;
    document.getElementById('app-url').value = selectedAppForDelete.url;
    document.getElementById('app-icon').value = selectedAppForDelete.icon;
    document.getElementById('app-category').value = selectedAppForDelete.category;
    document.getElementById('app-description').value = selectedAppForDelete.description || '';
    
    // Удаляем приложение и откроем модальное окно для добавления обновленной версии
    apps = apps.filter(app => app.id !== selectedAppForDelete.id);
    closeContextMenu();
    openAddModal();
}

// Показ уведомления
function showNotification(message, type = 'info') {
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification--${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface);
        color: var(--color-text);
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 9999;
        border: 1px solid var(--color-border);
    `;
    
    document.body.appendChild(notification);
    
    // Удаляем через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}

// Глобальные переменные
let apps = [];
let filteredApps = [];
let currentCategory = 'All';
let editMode = false;
let longPressTimer = null;
let selectedAppForDelete = null;
let currentTheme = 'light'; // По умолчанию светлая тема

// Пустой массив приложений по умолчанию
const defaultApps = [];

const categories = ["All", "Games", "Finance", "Utilities", "Shopping", "Business", "Marketplace", "Social"];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('Инициализация приложения...');
    initializeTelegramWebApp();
    loadTheme();
    loadApps();
    initializeEventListeners();
    renderCategories();
    filterAndRenderApps();
});

// Инициализация Telegram WebApp
function initializeTelegramWebApp() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        // Расширяем окно на весь экран
        tg.expand();
        
        // Включаем haptic feedback
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Загрузка темы
function loadTheme() {
    try {
        const savedTheme = localStorage.getItem('miniAppsTheme');
        currentTheme = savedTheme || 'light';
    } catch (error) {
        console.error('Ошибка загрузки темы:', error);
        currentTheme = 'light';
    }
    applyTheme();
}

// Применение темы
function applyTheme() {
    const html = document.documentElement;
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle?.querySelector('.theme-toggle-icon');
    
    html.setAttribute('data-color-scheme', currentTheme);
    
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'light' ? '🌙' : '☀️';
    }
    
    console.log('Применена тема:', currentTheme);
}

// Переключение темы
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    try {
        localStorage.setItem('miniAppsTheme', currentTheme);
    } catch (error) {
        console.error('Ошибка сохранения темы:', error);
    }
    
    applyTheme();
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    
    console.log('Тема переключена на:', currentTheme);
}

// Загрузка приложений
function loadApps() {
    try {
        const savedApps = localStorage.getItem('miniAppsLauncher');
        if (savedApps) {
            apps = JSON.parse(savedApps);
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
    console.log('Инициализация обработчиков событий...');
    
    // Переключатель темы
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        console.log('Найден переключатель темы');
        themeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клик по переключателю темы');
            toggleTheme();
        });
    }
    
    // Кнопка добавления приложения
    const addBtn = document.getElementById('add-btn');
    if (addBtn) {
        console.log('Найдена кнопка добавления');
        addBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Клик по кнопке добавления');
            openAddModal();
        });
        
        // Дополнительный обработчик через mousedown для надежности
        addBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
        });
        
        addBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Touch по кнопке добавления');
            openAddModal();
        }, { passive: false });
    }
    
    // Поиск
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        console.log('Найден элемент поиска');
        searchInput.addEventListener('input', handleSearch);
        searchInput.addEventListener('keyup', handleSearch);
        searchInput.addEventListener('change', handleSearch);
        
        // Фиксим проблему с отображением текста
        searchInput.style.color = 'var(--color-text)';
        searchInput.style.backgroundColor = 'var(--color-background)';
    }
    
    // Модальное окно
    setupModalEventListeners();
    
    // Контекстное меню
    setupContextMenuEventListeners();
    
    // Закрытие модального окна по клику на backdrop
    document.addEventListener('click', function(e) {
        const modal = document.getElementById('add-app-modal');
        const modalContent = document.querySelector('.modal-content');
        
        if (modal && !modal.classList.contains('hidden')) {
            if (e.target.classList.contains('modal-backdrop') || 
                (e.target === modal && !modalContent?.contains(e.target))) {
                closeAddModal();
            }
        }
    });
}

// Настройка обработчиков модального окна
function setupModalEventListeners() {
    const modalClose = document.getElementById('modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeAddModal();
        });
    }
    
    const cancelAdd = document.getElementById('cancel-add');
    if (cancelAdd) {
        cancelAdd.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closeAddModal();
        });
    }
    
    const addAppForm = document.getElementById('add-app-form');
    if (addAppForm) {
        addAppForm.addEventListener('submit', handleAddApp);
    }
}

// Настройка обработчиков контекстного меню
function setupContextMenuEventListeners() {
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
        categoryElement.type = 'button';
        
        categoryElement.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Выбрана категория:', category);
            selectCategory(category);
        });
        
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
    console.log('Поиск:', searchTerm);
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
    
    // Улучшенные обработчики длинного нажатия
    setupLongPressHandlers(appElement, app);
    
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

// Настройка обработчиков длинного нажатия
function setupLongPressHandlers(appElement, app) {
    let touchStartTime = 0;
    let longPressTriggered = false;
    let isMouseDown = false;
    
    // Touch события
    appElement.addEventListener('touchstart', (e) => {
        if (editMode) return;
        e.preventDefault();
        
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
        }, 600); // Уменьшили время до 600ms для лучшей отзывчивости
    }, { passive: false });
    
    appElement.addEventListener('touchend', (e) => {
        e.preventDefault();
        
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
        
        const touchDuration = Date.now() - touchStartTime;
        if (!longPressTriggered && touchDuration < 600) {
            // Короткое нажатие - открываем приложение
            handleAppClick(e, app);
        }
    }, { passive: false });
    
    appElement.addEventListener('touchcancel', (e) => {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    // Mouse события для десктопа
    appElement.addEventListener('mousedown', (e) => {
        if (editMode) return;
        
        isMouseDown = true;
        longPressTimer = setTimeout(() => {
            if (isMouseDown) {
                selectedAppForDelete = app;
                enterEditMode();
            }
        }, 600);
    });
    
    appElement.addEventListener('mouseup', (e) => {
        isMouseDown = false;
        
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
            
            // Если это был короткий клик, открываем приложение
            if (!editMode) {
                handleAppClick(e, app);
            }
        }
    });
    
    appElement.addEventListener('mouseleave', () => {
        isMouseDown = false;
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });
    
    // Обычный клик как fallback
    appElement.addEventListener('click', (e) => {
        if (!longPressTriggered && !editMode) {
            handleAppClick(e, app);
        }
    });
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
        window.location.href = app.url;
    }
}

// Вход в режим редактирования
function enterEditMode() {
    editMode = true;
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.classList.add('edit-mode', 'shake');
    });
    
    console.log('Вошли в режим редактирования');
}

// Выход из режима редактирования
function exitEditMode() {
    editMode = false;
    document.querySelectorAll('.app-icon').forEach(icon => {
        icon.classList.remove('edit-mode', 'shake');
    });
    
    console.log('Вышли из режима редактирования');
}

// Рендеринг пустого состояния
function renderEmptyState(container) {
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    
    if (apps.length === 0) {
        emptyState.innerHTML = `
            <div class="empty-state-icon">📱</div>
            <div class="empty-state-message">Нажмите "+" чтобы добавить первое приложение</div>
            <div class="empty-state-description">Создайте свою коллекцию mini apps</div>
        `;
    } else {
        emptyState.innerHTML = `
            <div class="empty-state-icon">🔍</div>
            <div class="empty-state-message">Приложения не найдены</div>
            <div class="empty-state-description">Попробуйте изменить поисковый запрос или категорию</div>
        `;
    }
    
    container.appendChild(emptyState);
}

// Открытие модального окна добавления
function openAddModal() {
    console.log('Открытие модального окна...');
    const modal = document.getElementById('add-app-modal');
    if (modal) {
        modal.classList.remove('hidden');
        console.log('Модальное окно открыто');
        
        // Фокус на первое поле
        setTimeout(() => {
            const nameInput = document.getElementById('app-name');
            if (nameInput) {
                nameInput.focus();
            }
        }, 100);
        
        // Haptic feedback
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
        }
    } else {
        console.error('Модальное окно не найдено');
    }
}

// Закрытие модального окна добавления
function closeAddModal() {
    console.log('Закрытие модального окна...');
    const modal = document.getElementById('add-app-modal');
    if (modal) {
        modal.classList.add('hidden');
        const form = document.getElementById('add-app-form');
        if (form) {
            form.reset();
        }
        console.log('Модальное окно закрыто');
    }
}

// Обработка добавления приложения
function handleAddApp(event) {
    event.preventDefault();
    console.log('Добавление приложения...');
    
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
    
    console.log('Приложение добавлено:', newApp);
    
    // Haptic feedback
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
    }
    
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
    exitEditMode();
}

// Обработка удаления приложения
function handleDeleteApp() {
    if (!selectedAppForDelete) return;
    
    apps = apps.filter(app => app.id !== selectedAppForDelete.id);
    saveApps();
    filterAndRenderApps();
    closeContextMenu();
    
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
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 3000);
}
// Конфигурация
const ITEMS_PER_PAGE = 48;
let allItems = [];
let filteredItems = [];
let currentPage = 1;
let currentView = 'grid'; // 'grid' или 'list'
let activeTags = [];

// DOM элементы
const itemsContainer = document.getElementById('itemsContainer');
const searchInput = document.getElementById('searchInput');
const tagsContainer = document.getElementById('tagsContainer');
const statsElement = document.getElementById('stats');
const paginationElement = document.getElementById('pagination');
const gridViewBtn = document.getElementById('gridViewBtn');
const listViewBtn = document.getElementById('listViewBtn');

// Загрузка данных из JSON
async function loadData() {
    try {
        const response = await fetch('data/items.json');
        allItems = await response.json();
        filteredItems = [...allItems];
        renderTagsFilter();
        renderStats();
        renderItems();
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
        itemsContainer.innerHTML = '<div class="loading">❌ Ошибка загрузки базы предметов</div>';
    }
}

// Рендер тегов для фильтрации
function renderTagsFilter() {
    const allTags = new Set();
    allItems.forEach(item => {
        item.tags?.forEach(tag => allTags.add(tag));
    });
    
    tagsContainer.innerHTML = '<span class="tag" data-tag="all">Все</span>';
    
    allTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.textContent = tag;
        tagElement.dataset.tag = tag;
        tagElement.onclick = () => toggleTag(tag);
        tagsContainer.appendChild(tagElement);
    });
    
    // Активируем "Все" по умолчанию
    document.querySelector('[data-tag="all"]')?.classList.add('active');
}

// Переключение тега
function toggleTag(tag) {
    const allBtn = document.querySelector('[data-tag="all"]');
    
    if (tag === 'all') {
        activeTags = [];
        allBtn.classList.add('active');
        document.querySelectorAll('.tag[data-tag]').forEach(btn => {
            if (btn !== allBtn) btn.classList.remove('active');
        });
    } else {
        allBtn.classList.remove('active');
        
        if (activeTags.includes(tag)) {
            activeTags = activeTags.filter(t => t !== tag);
        } else {
            activeTags.push(tag);
        }
        
        // Обновляем активные классы у тегов
        document.querySelectorAll('.tag').forEach(btn => {
            if (activeTags.includes(btn.dataset.tag)) {
                btn.classList.add('active');
            } else if (btn.dataset.tag !== 'all') {
                btn.classList.remove('active');
            }
        });
        
        // Если активных тегов нет, активируем "Все"
        if (activeTags.length === 0) {
            allBtn.classList.add('active');
        }
    }
    
    applyFilters();
}

// Применение всех фильтров
function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredItems = allItems.filter(item => {
        // Фильтр по названию
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm) || 
                              item.id.toString().includes(searchTerm);
        
        // Фильтр по тегам
        let matchesTags = true;
        if (activeTags.length > 0) {
            matchesTags = activeTags.every(tag => item.tags?.includes(tag));
        }
        
        return matchesSearch && matchesTags;
    });
    
    currentPage = 1;
    renderStats();
    renderItems();
}

// Рендер статистики
function renderStats() {
    statsElement.textContent = `📊 Всего предметов: ${allItems.length} | Показано: ${filteredItems.length}`;
}

// Рендер предметов
function renderItems() {
    if (!filteredItems.length) {
        itemsContainer.innerHTML = '<div class="loading">😿 Ничего не найдено</div>';
        paginationElement.innerHTML = '';
        return;
    }
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredItems.slice(start, end);
    
    itemsContainer.className = currentView === 'grid' ? 'items-grid' : 'items-list';
    
    itemsContainer.innerHTML = pageItems.map(item => `
        <div class="item-card ${currentView === 'list' ? 'list-view' : ''}">
            <div class="item-image">
                <img 
                    src="https://catwar.net/cw3/things/${item.id}.png" 
                    alt="${item.name || 'Предмет ' + item.id}"
                    loading="lazy"
                    onerror="this.src='https://via.placeholder.com/50?text=?'"
                >
            </div>
            <div class="item-info">
                <div class="item-name">${item.name || 'Без названия'}</div>
                <div class="item-id">ID: ${item.id}</div>
                ${item.tags?.length ? `
                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="tag-item">${tag}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    renderPagination();
}

// Пагинация
function renderPagination() {
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let pages = [];
    for (let i = 1; i <= Math.min(totalPages, 10); i++) {
        pages.push(i);
    }
    
    paginationElement.innerHTML = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>
        ${pages.map(page => `
            <button class="page-btn ${currentPage === page ? 'active' : ''}" onclick="changePage(${page})">${page}</button>
        `).join('')}
        ${totalPages > 10 ? '<span>...</span>' : ''}
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>
    `;
}

function changePage(page) {
    currentPage = page;
    renderItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Переключение вида
gridViewBtn.onclick = () => {
    currentView = 'grid';
    gridViewBtn.classList.add('active');
    listViewBtn.classList.remove('active');
    renderItems();
};

listViewBtn.onclick = () => {
    currentView = 'list';
    listViewBtn.classList.add('active');
    gridViewBtn.classList.remove('active');
    renderItems();
};

// Поиск с debounce
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
});

// Запуск
loadData();
// Конфигурация
const ITEMS_PER_PAGE = 48;
let allItems = [];
let filteredItems = [];
let currentPage = 1;
let currentView = 'grid';
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

// Рендер тегов
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
    
    document.querySelector('[data-tag="all"]')?.classList.add('active');
}

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
        
        document.querySelectorAll('.tag').forEach(btn => {
            if (activeTags.includes(btn.dataset.tag)) {
                btn.classList.add('active');
            } else if (btn.dataset.tag !== 'all') {
                btn.classList.remove('active');
            }
        });
        
        if (activeTags.length === 0) {
            allBtn.classList.add('active');
        }
    }
    
    applyFilters();
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    
    filteredItems = allItems.filter(item => {
        const matchesSearch = item.name?.toLowerCase().includes(searchTerm) || 
                              item.id.toString().includes(searchTerm);
        
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

function renderStats() {
    statsElement.textContent = `📊 Всего предметов: ${allItems.length} | Показано: ${filteredItems.length}`;
}

// ОСНОВНОЕ РЕШЕНИЕ: загружаем картинки через fetch с правильными заголовками
async function loadImageWithReferer(itemId, imgElement) {
    const imageUrl = `https://catwar.net/cw3/things/${itemId}.png`;
    
    try {
        // Пробуем загрузить через fetch с referer
        const response = await fetch(imageUrl, {
            headers: {
                'Referer': 'https://catwar.net/',
                'Origin': 'https://catwar.net',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            imgElement.src = url;
            imgElement.onload = () => URL.revokeObjectURL(url);
        } else {
            throw new Error('Image not found');
        }
    } catch (error) {
        console.log(`ID ${itemId}: ${error.message}`);
        imgElement.src = getPlaceholder(itemId);
    }
}

// Функция для создания изображения
function createItemImageElement(itemId, itemName) {
    const img = document.createElement('img');
    img.alt = itemName || `Предмет ${itemId}`;
    img.loading = 'lazy';
    img.style.width = '50px';
    img.style.height = '50px';
    
    // Показываем плейсхолдер пока грузится
    img.src = getPlaceholder(itemId);
    
    // Загружаем реальную картинку
    loadImageWithReferer(itemId, img);
    
    return img;
}

function getPlaceholder(itemId) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23888' font-size='12' font-family='monospace'%3E${itemId}%3C/text%3E%3C/svg%3E`;
}

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
    
    // Очищаем контейнер
    itemsContainer.innerHTML = '';
    
    // Добавляем каждый предмет с правильной загрузкой картинки
    pageItems.forEach(item => {
        const card = document.createElement('div');
        card.className = `item-card ${currentView === 'list' ? 'list-view' : ''}`;
        
        const imageDiv = document.createElement('div');
        imageDiv.className = 'item-image';
        
        const img = createItemImageElement(item.id, item.name);
        imageDiv.appendChild(img);
        
        const infoDiv = document.createElement('div');
        infoDiv.className = 'item-info';
        
        const nameDiv = document.createElement('div');
        nameDiv.className = 'item-name';
        nameDiv.textContent = item.name || 'Без названия';
        
        const idDiv = document.createElement('div');
        idDiv.className = 'item-id';
        idDiv.textContent = `ID: ${item.id}`;
        
        infoDiv.appendChild(nameDiv);
        infoDiv.appendChild(idDiv);
        
        if (item.tags?.length) {
            const tagsDiv = document.createElement('div');
            tagsDiv.className = 'item-tags';
            item.tags.forEach(tag => {
                const tagSpan = document.createElement('span');
                tagSpan.className = 'tag-item';
                tagSpan.textContent = tag;
                tagsDiv.appendChild(tagSpan);
            });
            infoDiv.appendChild(tagsDiv);
        }
        
        card.appendChild(imageDiv);
        card.appendChild(infoDiv);
        itemsContainer.appendChild(card);
    });
    
    renderPagination();
}

function renderPagination() {
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) {
        paginationElement.innerHTML = '';
        return;
    }
    
    let pages = [];
    let startPage = Math.max(1, currentPage - 4);
    let endPage = Math.min(totalPages, startPage + 9);
    
    if (endPage - startPage < 9) {
        startPage = Math.max(1, endPage - 9);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
    }
    
    paginationElement.innerHTML = `
        <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>
        ${pages.map(page => `
            <button class="page-btn ${currentPage === page ? 'active' : ''}" onclick="changePage(${page})">${page}</button>
        `).join('')}
        <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>
    `;
}

function changePage(page) {
    currentPage = page;
    renderItems();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

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

let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(applyFilters, 300);
});

loadData();

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
    statsElement.textContent = `всего ${allItems.length}, показывается ${filteredItems.length}`;
}

function getImageUrl(itemId) {
    const folderStart = Math.floor(itemId / 1000) * 1000;
    const folderEnd = folderStart + 999;
    return `images/${folderStart}-${folderEnd}/${itemId}.png`;
}

function getPlaceholder(itemId) {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 50 50'%3E%3Crect width='50' height='50' fill='%23e6d9cb'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23998877' font-size='12' font-family='monospace'%3E${itemId}%3C/text%3E%3C/svg%3E`;
}

function renderItems() {
    if (!filteredItems.length) {
        itemsContainer.innerHTML = '<div class="loading">Ничего подходящего на полочках не нашлось</div>';
        paginationElement.innerHTML = '';
        return;
    }
    
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = filteredItems.slice(start, end);
    
    itemsContainer.className = currentView === 'grid' ? 'items-grid' : 'items-list';
    
    itemsContainer.innerHTML = pageItems.map(item => {
        const imageUrl = getImageUrl(item.id);
        const fullImageUrl = `https://catwar.net/cw3/things/${item.id}.png`;
        
        return `
            <div class="item-card ${currentView === 'list' ? 'list-view' : ''}">
                <div class="item-image">
                    <a href="${fullImageUrl}" target="_blank" class="image-link" title="Открыть картинку в новой вкладке">
                        <img 
                            src="${imageUrl}"
                            alt="${escapeHtml(item.name) || 'Предмет ' + item.id}"
                            loading="lazy"
                            onerror="this.onerror=null; this.src='${getPlaceholder(item.id)}'"
                        >
                    </a>
                </div>
                <div class="item-info">
                    <div class="item-name">${escapeHtml(item.name) || 'Без названия'}</div>
                    <div class="item-id">ID: ${item.id}</div>
                    ${item.tags?.length ? `
                        <div class="item-tags">
                            ${item.tags.map(tag => `<span class="tag-item">${escapeHtml(tag)}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
    
    renderPagination();
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
        <div class="pagination-controls">
            <div class="pagination-buttons">
                <button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage(${currentPage - 1})">←</button>
                ${pages.map(page => `
                    <button class="page-btn ${currentPage === page ? 'active' : ''}" onclick="changePage(${page})">${page}</button>
                `).join('')}
                <button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage(${currentPage + 1})">→</button>
            </div>
            <div class="pagination-jump">
                <span>Страница</span>
                <input type="number" id="pageInput" min="1" max="${totalPages}" value="${currentPage}" class="page-input">
                <span>из ${totalPages}</span>
                <button class="page-btn jump-btn" onclick="jumpToPage()">Перейти</button>
            </div>
        </div>
    `;
    
    const pageInput = document.getElementById('pageInput');
    if (pageInput) {
        pageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                jumpToPage();
            }
        });
    }
}

function jumpToPage() {
    const pageInput = document.getElementById('pageInput');
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    let pageNum = parseInt(pageInput.value);
    
    if (isNaN(pageNum)) {
        pageNum = 1;
    }
    
    pageNum = Math.max(1, Math.min(pageNum, totalPages));
    changePage(pageNum);
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
// 分页设置
const PAGE_SIZE = 20;
let currentPage = 1;
let totalRecords = 0;
let filteredRecords = [];
let allRecords = []; // 存储所有记录

// DOM 元素
const tableBody = document.getElementById('recordsTableBody');
const searchInput = document.getElementById('searchInput');
const operationType = document.getElementById('operationType');
const dateFilter = document.getElementById('dateFilter');
const clearFilters = document.getElementById('clearFilters');
const pageInfo = document.getElementById('pageInfo');

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    await loadRecords();
    setupEventListeners();
});

// 设置事件监听器
function setupEventListeners() {
    searchInput.addEventListener('input', handleFilterChange);
    operationType.addEventListener('change', handleFilterChange);
    dateFilter.addEventListener('change', handleFilterChange);
    clearFilters.addEventListener('click', clearAllFilters);
}

// 加载记录
async function loadRecords() {
    try {
        // 通过background script获取记录总数
        const countResponse = await chrome.runtime.sendMessage({ action: 'getRecordsCount' });
        if (countResponse.error) {
            throw new Error(countResponse.error);
        }
        totalRecords = parseInt(countResponse.count) || 0;
        console.log('总记录数:', totalRecords);

        // 获取当前页的记录
        const response = await chrome.runtime.sendMessage({
            action: 'getRecords',
            page: currentPage,
            pageSize: PAGE_SIZE
        });

        if (response.error) {
            throw new Error(response.error);
        }
        if (!Array.isArray(response)) {
            throw new Error('返回的数据格式不正确');
        }
        // 数据已经在 content.js 中排序，这里直接使用
        filteredRecords = response;
        console.log('当前页记录数:', filteredRecords.length);
        updateTable();
        updatePagination();
    } catch (error) {
        console.error('加载记录失败:', error);
        const errorMessage = error.message || '未知错误';
        alert('加载记录失败: ' + errorMessage);
        // 清空表格
        tableBody.innerHTML = '';
        totalRecords = 0;
        updatePagination();
    }
}

// 处理筛选变化
async function handleFilterChange() {
    currentPage = 1;
    await loadRecords();
}

// 清除所有筛选
function clearAllFilters() {
    searchInput.value = '';
    operationType.value = '';
    dateFilter.value = '';
    handleFilterChange();
}

// 更新表格
function updateTable() {
    tableBody.innerHTML = '';

    filteredRecords.forEach(record => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(record.startTime)}</td>
            <td>${record.title}</td>
            <td>${record.author}</td>
            <td class="content-cell">${record.content || '-'}</td>
            <td>${record.commentCount}</td>
            <td>${record.myComment || '-'}</td>
            <td class="status-${record.status === 'success' ? 'success' : 'error'}">${record.status}</td>
            <td><button class="delete-btn" data-id="${record.postId}">删除</button></td>
        `;
        tableBody.appendChild(row);
    });

    // 为所有删除按钮添加事件监听器
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', handleDelete);
    });
}

// 处理删除操作
async function handleDelete(event) {
    const recordId = event.target.dataset.id;
    if (!confirm('确定要删除这条记录吗？')) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            action: 'deleteRecord',
            recordId: recordId
        });

        if (response.error) {
            throw new Error(response.error);
        }

        // 重新加载记录
        await loadRecords();
    } catch (error) {
        console.error('删除记录失败:', error);
        alert('删除记录失败: ' + error.message);
    }
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(totalRecords / PAGE_SIZE);
    console.log('总页数:', totalPages, '当前页:', currentPage);

    pageInfo.innerHTML = `
        <button id="prevPage" ${currentPage === 1 ? 'disabled' : ''}>上一页</button>
        <input type="number" id="pageInput" min="1" max="${totalPages}" value="${currentPage}" style="width: 60px; text-align: center;">
        <span>/ ${totalPages} 页</span>
        <button id="nextPage" ${currentPage === totalPages ? 'disabled' : ''}>下一页</button>
    `;

    // 重新绑定事件监听器
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadRecords();
        }
    });

    document.getElementById('nextPage').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadRecords();
        }
    });

    // 添加页码输入框事件监听
    const pageInput = document.getElementById('pageInput');
    pageInput.addEventListener('change', () => {
        const newPage = parseInt(pageInput.value);
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            loadRecords();
        } else {
            pageInput.value = currentPage;
        }
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
} 
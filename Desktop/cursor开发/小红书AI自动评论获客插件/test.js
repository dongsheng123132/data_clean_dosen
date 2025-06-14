// 创建一个专门的日志函数
function log(message) {
    console.log(message);
    // 同时在页面上显示日志
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
    }
}

log('Test script loaded');

// 测试点击事件
document.addEventListener('DOMContentLoaded', function () {
    log('DOM Content Loaded');

    // 测试标签页点击
    const tabs = document.querySelectorAll('.tab');
    log('Found ' + tabs.length + ' tabs');
    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            log('Tab clicked: ' + this.dataset.tab);
        });
    });

    // 测试按钮点击
    const buttons = document.querySelectorAll('button');
    log('Found ' + buttons.length + ' buttons');
    buttons.forEach(button => {
        button.addEventListener('click', function () {
            log('Button clicked: ' + this.id);
        });
    });

    // 测试折叠面板点击
    const sections = document.querySelectorAll('.section-title');
    log('Found ' + sections.length + ' sections');
    sections.forEach(title => {
        title.addEventListener('click', function () {
            log('Section clicked: ' + this.dataset.section);
        });
    });

    // 添加测试按钮
    var testBtn = document.createElement('button');
    testBtn.textContent = '测试按钮';
    testBtn.style.marginTop = '10px';
    testBtn.style.padding = '5px 10px';
    testBtn.onclick = function () {
        log('测试按钮被点击');
    };
    document.body.appendChild(testBtn);

    // 添加日志显示区域
    const logArea = document.createElement('div');
    logArea.id = 'logArea';
    logArea.style.marginTop = '10px';
    logArea.style.padding = '10px';
    logArea.style.backgroundColor = '#f5f5f5';
    logArea.style.borderRadius = '4px';
    logArea.style.maxHeight = '100px';
    logArea.style.overflowY = 'auto';
    document.body.appendChild(logArea);

    // 重写日志函数
    const originalLog = log;
    log = function (message) {
        originalLog(message);
        const logArea = document.getElementById('logArea');
        if (logArea) {
            const logEntry = document.createElement('div');
            logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
            logArea.appendChild(logEntry);
            logArea.scrollTop = logArea.scrollHeight;
        }
    };

    log('初始化完成');
});

console.log('测试脚本加载');

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM 加载完成');

    // 测试标签页切换
    const tabs = document.querySelectorAll('.tab');
    console.log('找到标签页数量:', tabs.length);
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            console.log('点击标签页:', tab.dataset.tab);
            // 移除所有标签页的active类
            tabs.forEach(t => t.classList.remove('active'));
            // 添加当前标签页的active类
            tab.classList.add('active');

            // 隐藏所有内容
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });

            // 显示对应内容
            const tabId = tab.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });

    // 测试折叠面板
    const sectionTitles = document.querySelectorAll('.section-title');
    console.log('找到折叠面板数量:', sectionTitles.length);
    sectionTitles.forEach(title => {
        title.addEventListener('click', () => {
            console.log('点击折叠面板:', title.dataset.section);
            const sectionId = title.dataset.section;
            const content = document.getElementById(sectionId);
            title.classList.toggle('collapsed');
            content.classList.toggle('collapsed');
        });
    });

    // 测试按钮点击
    const buttons = document.querySelectorAll('button');
    console.log('找到按钮数量:', buttons.length);
    buttons.forEach(button => {
        button.addEventListener('click', () => {
            console.log('点击按钮:', button.textContent);
        });
    });
}); 
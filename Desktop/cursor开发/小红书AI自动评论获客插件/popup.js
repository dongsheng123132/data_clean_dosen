import { handleStart, handleStop, handleLikeCurrent, handleCommentCurrent } from './popup-handlers.js';
import { getFormConfig, saveConfig, updateStatus, updateButtonState, setFormConfig, loadConfig } from './popup-utils.js';

// 使用相同的日志函数
function log(message) {
    console.log(message);
    const status = document.getElementById('status');
    if (status) {
        status.textContent = message;
    }
    const logArea = document.getElementById('logArea');
    if (logArea) {
        const logEntry = document.createElement('div');
        logEntry.textContent = new Date().toLocaleTimeString() + ': ' + message;
        logArea.appendChild(logEntry);
        logArea.scrollTop = logArea.scrollHeight;
    }
}

// 保存配置时检查AI相关字段
function validateConfig(config) {
    if (config.commentMode === 'ai') {
        if (!config.apiKey) {
            updateStatus('请填写API密钥');
            return false;
        }
        if (!config.aiModel) {
            updateStatus('请选择AI模型');
            return false;
        }
        if (!config.aiPrompt) {
            updateStatus('请填写AI提示词');
            return false;
        }
    }
    return true;
}

log('popup.js loading...');

// 基本的错误处理
window.addEventListener('error', function (e) {
    console.error('Script error:', e);
});

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    try {
        const module = await import('./popup-handlers.js');
        log('Module loaded successfully');
        const { handleStart, handleStop, handleLikeCurrent, handleCommentCurrent, handleInit } = module;

        // 标签页切换
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
                const tabContent = document.getElementById(`${tabId}-tab`);
                if (tabContent) {
                    tabContent.classList.add('active');
                }

                // 保存当前选中的tab
                chrome.storage.local.set({ 'lastSelectedTab': tabId });
            });
        });

        // 恢复上次选中的tab
        chrome.storage.local.get(['lastSelectedTab'], function (result) {
            if (result.lastSelectedTab) {
                const lastTab = document.querySelector(`.tab[data-tab="${result.lastSelectedTab}"]`);
                if (lastTab) {
                    lastTab.click();
                }
            }
        });

        // 折叠面板
        const sectionTitles = document.querySelectorAll('.section-title');
        console.log('找到折叠面板数量:', sectionTitles.length);
        sectionTitles.forEach(title => {
            title.addEventListener('click', () => {
                console.log('点击折叠面板:', title.dataset.section);
                const sectionId = title.dataset.section;
                const content = document.getElementById(sectionId);
                if (content) {
                    title.classList.toggle('collapsed');
                    content.classList.toggle('collapsed');
                }
            });
        });

        // 绑定按钮事件
        const likeStartBtn = document.getElementById('likeStartBtn');
        const likeStopBtn = document.getElementById('likeStopBtn');
        const likeCurrentBtn = document.getElementById('likeCurrentBtn');
        const commentStartBtn = document.getElementById('commentStartBtn');
        const commentStopBtn = document.getElementById('commentStopBtn');
        const commentCurrentBtn = document.getElementById('commentCurrentBtn');
        const viewRecordsBtn = document.getElementById('viewRecordsBtn');

        console.log('找到按钮:', {
            likeStartBtn: !!likeStartBtn,
            likeStopBtn: !!likeStopBtn,
            likeCurrentBtn: !!likeCurrentBtn,
            commentStartBtn: !!commentStartBtn,
            commentStopBtn: !!commentStopBtn,
            commentCurrentBtn: !!commentCurrentBtn,
            viewRecordsBtn: !!viewRecordsBtn
        });

        if (likeStartBtn) likeStartBtn.addEventListener('click', () => handleStart('like'));
        if (likeStopBtn) likeStopBtn.addEventListener('click', () => handleStop('like'));
        if (likeCurrentBtn) likeCurrentBtn.addEventListener('click', () => handleLikeCurrent());
        if (commentStartBtn) commentStartBtn.addEventListener('click', () => handleStart('comment'));
        if (commentStopBtn) commentStopBtn.addEventListener('click', () => handleStop('comment'));
        if (commentCurrentBtn) commentCurrentBtn.addEventListener('click', () => handleCommentCurrent());
        if (viewRecordsBtn) viewRecordsBtn.addEventListener('click', () => chrome.tabs.create({ url: 'records.html' }));

        // 监听评论内容变更
        const customComments = document.getElementById('customComments');
        if (customComments) {
            customComments.addEventListener('change', async function () {
                const config = getFormConfig();
                // 使用正则表达式分割，处理不同操作系统的换行符
                config.randomComments = this.value.split(/\r?\n/).filter(line => line.trim());
                console.log('更新评论内容:', config.randomComments); // 添加日志
                if (validateConfig(config)) {
                    await saveConfig(config);
                }
            });
        }

        // 监听评论模式变化
        const commentModeSelect = document.getElementById('commentMode');
        if (commentModeSelect) {
            commentModeSelect.addEventListener('change', function (e) {
                const aiConfig = document.getElementById('aiConfig');
                const aiConfigContent = document.getElementById('aiConfigContent');
                const customCommentsSection = document.getElementById('customCommentsSection');

                if (e.target.value === 'ai') {
                    aiConfig.style.display = 'block';
                    aiConfigContent.style.display = 'block';
                    if (customCommentsSection) {
                        customCommentsSection.style.display = 'none';
                    }
                } else {
                    aiConfig.style.display = 'none';
                    aiConfigContent.style.display = 'none';
                    if (customCommentsSection) {
                        customCommentsSection.style.display = 'block';
                    }
                }
            });
        }

        // 监听AI配置部分的折叠/展开
        const aiConfig = document.getElementById('aiConfig');
        if (aiConfig) {
            aiConfig.addEventListener('click', function () {
                const content = document.getElementById('aiConfigContent');
                this.classList.toggle('collapsed');
                content.classList.toggle('collapsed');
            });
        }

        // 初始化
        await handleInit();
        await initPopupUI();

        // 监听来自content script的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.type === 'status') {
                updateStatus(message.text);
            }
        });

    } catch (error) {
        log('Failed to load module: ' + error.message);
        console.error('Failed to load module:', error);
    }
});

// 历史关键词相关功能
function initKeywordHistory() {
    console.log('开始初始化历史关键词功能');
    const keywordInput = document.getElementById('keyword');
    const keywordHistory = document.getElementById('keywordHistory');
    const MAX_HISTORY = 10; // 最多保存10条历史记录

    if (!keywordInput || !keywordHistory) {
        console.error('找不到关键词输入框或历史记录容器');
        return;
    }

    console.log('找到输入框和历史记录容器，开始绑定事件');

    // 从存储中加载历史关键词
    chrome.storage.local.get(['keywordHistory'], function (result) {
        console.log('从存储中加载历史关键词:', result.keywordHistory);
        const history = result.keywordHistory || [];
        updateHistoryDisplay(history);
    });

    // 点击输入框时显示历史记录
    keywordInput.addEventListener('focus', function () {
        console.log('输入框获得焦点');
        chrome.storage.local.get(['keywordHistory'], function (result) {
            const history = result.keywordHistory || [];
            console.log('显示历史记录:', history);
            if (history.length > 0) {
                keywordHistory.classList.add('active');
            }
        });
    });

    // 点击其他地方时隐藏历史记录
    document.addEventListener('click', function (e) {
        if (!keywordInput.contains(e.target) && !keywordHistory.contains(e.target)) {
            console.log('点击其他地方，隐藏历史记录');
            keywordHistory.classList.remove('active');
        }
    });

    // 输入框失去焦点时保存关键词
    keywordInput.addEventListener('blur', function () {
        const keyword = keywordInput.value.trim();
        console.log('输入框失去焦点，当前关键词:', keyword);
        if (keyword) {
            saveKeywordToHistory(keyword);
        }
    });

    // 回车键保存关键词
    keywordInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            const keyword = keywordInput.value.trim();
            console.log('按下回车键，当前关键词:', keyword);
            if (keyword) {
                saveKeywordToHistory(keyword);
            }
        }
    });

    console.log('历史关键词功能初始化完成');
}

function saveKeywordToHistory(keyword) {
    console.log('开始保存关键词到历史记录:', keyword);
    if (!keyword) {
        console.log('关键词为空，不保存');
        return;
    }

    chrome.storage.local.get(['keywordHistory'], function (result) {
        console.log('从storage获取到的历史记录:', result.keywordHistory);
        let history = result.keywordHistory || [];
        // 移除已存在的相同关键词
        history = history.filter(item => item !== keyword);
        // 将新关键词添加到开头
        history.unshift(keyword);
        // 限制历史记录数量
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        console.log('准备保存的历史记录:', history);
        // 保存到存储
        chrome.storage.local.set({ keywordHistory: history }, function () {
            if (chrome.runtime.lastError) {
                console.error('保存关键词失败:', chrome.runtime.lastError);
                return;
            }
            console.log('关键词保存成功，当前历史记录:', history);
            updateHistoryDisplay(history);
        });
    });
}

function updateHistoryDisplay(history) {
    console.log('更新历史记录显示:', history);
    const keywordHistory = document.getElementById('keywordHistory');
    const keywordInput = document.getElementById('keyword');

    if (!keywordHistory || !keywordInput) {
        console.error('找不到历史记录容器或输入框');
        return;
    }

    // 清空现有内容
    keywordHistory.innerHTML = '';

    // 添加历史记录项
    history.forEach(keyword => {
        const item = document.createElement('div');
        item.className = 'keyword-history-item';
        item.textContent = keyword;
        item.addEventListener('click', function () {
            console.log('点击历史记录项:', keyword);
            keywordInput.value = keyword;
            keywordHistory.classList.remove('active');
            // 点击历史记录项时也保存关键词
            saveKeywordToHistory(keyword);
        });
        keywordHistory.appendChild(item);
    });
}

// 修改handleInit函数，确保在DOM加载完成后执行
async function initPopupUI() {
    console.log('开始初始化UI...');
    try {
        // 获取保存的配置
        const config = await loadConfig();
        console.log('获取到的配置:', config);

        // 设置表单值
        setFormConfig(config);

        // 初始化历史关键词功能
        console.log('准备初始化历史关键词功能');
        initKeywordHistory();
        console.log('历史关键词功能初始化完成');

        // 直接更新UI状态
        const commentModeSelect = document.getElementById('commentMode');
        const aiConfig = document.getElementById('aiConfig');
        const aiConfigContent = document.getElementById('aiConfigContent');
        const customCommentsSection = document.getElementById('customCommentsSection');

        if (commentModeSelect && aiConfig && aiConfigContent && customCommentsSection) {
            if (commentModeSelect.value === 'ai') {
                aiConfig.style.display = 'block';
                aiConfigContent.style.display = 'block';
                customCommentsSection.style.display = 'none';
            } else {
                aiConfig.style.display = 'none';
                aiConfigContent.style.display = 'none';
                customCommentsSection.style.display = 'block';
            }
        }

        // 更新状态
        updateStatus('就绪');
        console.log('UI初始化完成');
    } catch (error) {
        console.error('UI初始化失败:', error);
        updateStatus('UI初始化失败: ' + error.message);
    }
} 
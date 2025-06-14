import { UI_CONFIG } from './popup-config.js';
import { saveConfig, loadConfig, updateStatus, updateButtonState, getFormConfig, setFormConfig } from './popup-utils.js';

let isRunning = false;

// 开始按钮点击处理
export async function handleStart(type) {
    const keyword = document.getElementById('keyword').value.trim();
    if (!keyword) {
        updateStatus('请输入搜索关键词');
        //return;
    }

    // 保存关键词到历史记录
    chrome.storage.local.get(['keywordHistory'], function (result) {
        let history = result.keywordHistory || [];
        // 移除已存在的相同关键词
        history = history.filter(item => item !== keyword);
        // 将新关键词添加到开头
        history.unshift(keyword);
        // 限制历史记录数量
        if (history.length > 10) {
            history = history.slice(0, 10);
        }
        // 保存到存储
        chrome.storage.local.set({ keywordHistory: history }, function () {
            if (chrome.runtime.lastError) {
                console.error('保存关键词失败:', chrome.runtime.lastError);
                return;
            }
            console.log('关键词保存成功');
        });
    });

    const config = getFormConfig();
    await saveConfig(config);

    isRunning = true;
    updateButtonState(true, type);
    updateStatus('正在运行...');

    // 获取当前标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        updateStatus('未找到活动标签页');
        return;
    }

    // 发送消息到content script
    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'start',
            keyword,
            config,
            type
        });
    } catch (error) {
        console.error('发送消息失败:', error);
        updateStatus('发送消息失败：' + error.message);
    }
}

// 停止按钮点击处理
export async function handleStop(type) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        try {
            await chrome.tabs.sendMessage(tab.id, { action: 'stop' });
        } catch (error) {
            console.error('发送停止消息失败:', error);
            updateStatus('发送停止消息失败：' + error.message);
        }
    }

    isRunning = false;
    updateButtonState(false, type);
    updateStatus('已停止');
}

// 单篇点赞按钮点击处理
export async function handleLikeCurrent() {
    const config = getFormConfig();
    await saveConfig(config);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'likeCurrentPost',
                config
            });
        } catch (error) {
            console.error('发送点赞消息失败:', error);
            updateStatus('发送点赞消息失败：' + error.message);
        }
    }
}

// 单篇评论按钮点击处理
export async function handleCommentCurrent() {
    const config = getFormConfig();
    await saveConfig(config);

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
        updateStatus('未找到活动标签页');
        return;
    }

    // 检查是否在小红书网站
    if (!tab.url.includes('xiaohongshu.com')) {
        updateStatus('请在小红书网站使用此功能');
        return;
    }

    try {
        await chrome.tabs.sendMessage(tab.id, {
            action: 'commentCurrentPost',
            config
        });
    } catch (error) {
        console.error('发送评论消息失败:', error);
        updateStatus('发送评论消息失败：' + error.message);
    }
}

// 查看记录按钮点击处理
export async function handleViewRecords() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action: 'openRecords'
            });
        } catch (error) {
            console.error('发送消息失败:', error);
            updateStatus('发送消息失败：' + error.message);
        }
    }
}

// 初始化处理
export async function handleInit() {
    // 加载保存的配置
    const savedConfig = await loadConfig();
    if (savedConfig) {
        setFormConfig(savedConfig);
    } else {
        setFormConfig(UI_CONFIG.DEFAULT_CONFIG);
    }

    // 更新按钮状态
    updateButtonState(false, 'like');
    updateButtonState(false, 'comment');
    updateStatus('就绪');
}

// 监听来自content script的消息
export function handleMessage(message) {
    if (message.type === 'status') {
        updateStatus(message.text);
    }
} 
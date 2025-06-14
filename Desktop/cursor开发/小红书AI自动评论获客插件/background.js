// 监听扩展安装或更新
chrome.runtime.onInstalled.addListener(() => {
    console.log('小红书自动点赞助手已安装');
});

// 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('Background received message:', message);
    if (message.type === 'status') {
        // 转发状态消息到 popup
        chrome.runtime.sendMessage(message);
    }
    if (message.action === 'getRecordsCount') {
        // 获取所有小红书标签页
        chrome.tabs.query({ url: "*://*.xiaohongshu.com/*" }, async (tabs) => {
            if (tabs.length > 0) {
                try {
                    // 使用第一个找到的小红书标签页
                    const response = await chrome.tabs.sendMessage(tabs[0].id, { action: 'getRecordsCount' });
                    sendResponse({ count: response.count });
                } catch (error) {
                    console.error('获取记录总数失败:', error);
                    sendResponse({ error: error.message });
                }
            } else {
                sendResponse({ error: '未找到小红书标签页，请先打开小红书网站' });
            }
        });
        return true; // 保持消息通道开放
    }
    if (message.action === 'getRecords') {
        // 获取所有小红书标签页
        chrome.tabs.query({ url: "*://*.xiaohongshu.com/*" }, async (tabs) => {
            if (tabs.length > 0) {
                try {
                    // 使用第一个找到的小红书标签页
                    const records = await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'getRecords',
                        page: message.page,
                        pageSize: message.pageSize
                    });
                    sendResponse(records);
                } catch (error) {
                    console.error('获取记录失败:', error);
                    sendResponse({ error: error.message });
                }
            } else {
                sendResponse({ error: '未找到小红书标签页，请先打开小红书网站' });
            }
        });
        return true; // 保持消息通道开放
    }
    if (message.action === 'deleteRecord') {
        // 获取所有小红书标签页
        chrome.tabs.query({ url: "*://*.xiaohongshu.com/*" }, async (tabs) => {
            if (tabs.length > 0) {
                try {
                    // 使用第一个找到的小红书标签页
                    const result = await chrome.tabs.sendMessage(tabs[0].id, {
                        action: 'deleteRecord',
                        recordId: message.recordId
                    });
                    sendResponse(result);
                } catch (error) {
                    console.error('删除记录失败:', error);
                    sendResponse({ error: error.message });
                }
            } else {
                sendResponse({ error: '未找到小红书标签页，请先打开小红书网站' });
            }
        });
        return true; // 保持消息通道开放
    }
    return true;
}); 
// 移除 import 语句，改用全局变量
let addComment, getRandomComment, waitForCommentsLoad;
let processComments, processPosts;
let checkPostProcessed, addRecord, getRecordsCount, getRecords;
let deleteRecord, getRandomDelay;
let AICommentGenerator;

// 动态加载依赖
async function loadDependencies() {
    try {
        const commentModule = await import(chrome.runtime.getURL('comment.js'));
        const postModule = await import(chrome.runtime.getURL('post.js'));
        const utilsModule = await import(chrome.runtime.getURL('utils.js'));
        const aiCommentModule = await import(chrome.runtime.getURL('ai-comment.js'));

        addComment = commentModule.addComment;
        getRandomComment = commentModule.getRandomComment;
        waitForCommentsLoad = commentModule.waitForCommentsLoad;

        processComments = postModule.processComments;
        processPosts = postModule.processPosts;

        checkPostProcessed = utilsModule.checkPostProcessed;
        addRecord = utilsModule.addRecord;
        getRecordsCount = utilsModule.getRecordsCount;
        getRecords = utilsModule.getRecords;
        deleteRecord = utilsModule.deleteRecord;
        getRandomDelay = utilsModule.getRandomDelay;

        AICommentGenerator = aiCommentModule.AICommentGenerator;

        console.log('所有依赖加载完成');
        return true;
    } catch (error) {
        console.error('加载依赖失败:', error);
        return false;
    }
}

// 立即加载依赖
let dependenciesLoaded = false;
loadDependencies().then(success => {
    dependenciesLoaded = success;
    console.log('依赖加载状态:', dependenciesLoaded);
});

let isRunning = false;
let currentKeyword = '';
let config = {
    likeInterval: { min: 1000, max: 2000 },
    postInterval: { min: 5000, max: 8000 },
    pageLoadWait: { min: 3000, max: 5000 },
    commentLoadWait: { min: 3000, max: 5000 },
    maxPosts: 0,
    maxLikes: 0,
    maxLikesPerPost: 0,
    isTestMode: false,
    commentKeywords: [],
    requireImage: false,
    testModeComment: true,
    commentMode: 'random',
    randomComments: [
        '写得真好，感谢分享！',
        '学到了，谢谢分享经验',
        '这个建议很实用，收藏了',
        '分析得很到位，支持一下',
        '内容很有价值，期待更多分享'
    ],
    aiCommentPrompt: '你是一家专业的软件开发公司，需要在小红书获客。请根据这篇笔记的内容，生成一条专业、有见地且自然的评论。评论要体现出你的专业背景，但不要过于营销化。可以分享一些相关的技术见解或经验，同时保持真诚和友好的语气。直接回复评论内容即可。笔记标题：{title}，内容：{content}'
};
let stats = {
    processedPosts: 0,
    totalLikes: 0
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('收到消息:', message);

    // 如果依赖还没加载完成，先加载依赖
    if (!dependenciesLoaded) {
        loadDependencies().then(success => {
            dependenciesLoaded = success;
            if (success) {
                // 依赖加载完成后重新处理消息
                handleMessage(message, sender, sendResponse);
            } else {
                sendResponse({ error: '依赖加载失败' });
            }
        });
        return true; // 保持消息通道开放
    }

    // 依赖已加载完成，直接处理消息
    handleMessage(message, sender, sendResponse);
    return true; // 保持消息通道开放
});

// 处理消息的函数
async function handleMessage(message, sender, sendResponse) {
    if (message.action === 'start') {
        isRunning = true;
        currentKeyword = message.keyword;
        // 更新配置
        if (message.config) {
            config = { ...config, ...message.config };
        }
        // 重置统计
        stats = {
            processedPosts: 0,
            totalLikes: 0
        };
        console.log('开始运行，关键词:', currentKeyword, '配置:', config);

        // 根据消息类型执行不同的操作
        if (message.type === 'like') {
            startAutoLike();
        } else if (message.type === 'comment') {
            startAutoComment();
        }

        // 发送响应
        sendResponse({ status: 'started' });
    } else if (message.action === 'stop') {
        console.log('停止运行');
        isRunning = false;
        sendResponse({ status: 'stopped' });
    } else if (message.action === 'likeCurrentPost') {
        // 处理单篇帖子点赞
        if (message.config) {
            config = { ...config, ...message.config };
        }
        likeCurrentPost().then(() => {
            sendResponse({ status: 'completed' });
        });
        return true; // 保持消息通道开放
    } else if (message.action === 'commentCurrentPost') {
        // 处理单篇帖子评论
        if (message.config) {
            config = { ...config, ...message.config };
        }
        commentCurrentPost().then(() => {
            sendResponse({ status: 'completed' });
        });
        return true; // 保持消息通道开放
    } else if (message.action === 'openRecords') {
        // 在当前页面打开记录页面
        const recordsUrl = chrome.runtime.getURL('records.html');
        window.open(recordsUrl, '_blank');
    } else if (message.action === 'getRecordsCount') {
        // 获取记录总数
        try {
            const count = await getRecordsCount();
            sendResponse({ count });
        } catch (error) {
            console.error('获取记录总数失败:', error);
            sendResponse({ error: error.message });
        }
    } else if (message.action === 'getRecords') {
        // 获取分页记录
        try {
            const page = message.page || 1;
            const pageSize = message.pageSize || 20;
            const records = await getRecords(page, pageSize);
            sendResponse(records);
        } catch (error) {
            console.error('获取记录失败:', error);
            sendResponse({ error: error.message });
        }
    } else if (message.action === 'deleteRecord') {
        // 删除指定记录
        try {
            const result = await deleteRecord(message.recordId);
            sendResponse(result);
        } catch (error) {
            console.error('删除记录失败:', error);
            sendResponse({ error: error.message });
        }
    }
    return true; // 保持消息通道开放
}

// 监听页面加载完成事件
document.addEventListener('DOMContentLoaded', () => {
    console.log('页面加载完成，检查是否需要执行自动点赞');
    if (isRunning && window.location.href.includes('search_result')) {
        console.log('在搜索结果页面，继续执行自动点赞');
        setTimeout(startAutoLike, 1000);
    }
});

async function startAutoLike() {
    await processPosts('点赞', async (postId, title, author) => {
        // 记录开始处理时间
        const startTime = new Date();

        // 等待评论加载
        console.log('等待评论加载...');
        const commentsLoaded = await waitForCommentsLoad();
        if (!commentsLoaded) {
            throw new Error('评论加载失败');
        }

        // 获取评论列表并处理
        const comments = document.querySelectorAll('.comment-item');
        console.log('找到评论数量:', comments.length);
        const result = await processComments(comments, config, stats);

        // 记录处理完成时间
        const endTime = new Date();
        const duration = endTime - startTime;

        // 添加处理记录
        await addRecord({
            postId,
            title,
            author,
            operationType: '点赞',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            duration,
            commentCount: comments.length,
            myComment: result.myComment,
            status: 'success'
        });

        return result;
    }, config, stats);
}

async function startAutoComment() {
    console.log('开始自动评论流程');
    if (config.commentMode === 'random' && config.randomComments.length === 0) {
        console.error('未配置评论内容');
        throw new Error('请添加自定义评论内容');
    }

    await processPosts('评论', async (postId, title, author) => {
        console.log('处理帖子:', { postId, title, author });

        const result = await commentCurrentPost();
        console.log('评论结果:', result);

        return result;
    }, config, stats);
}

// 处理单篇帖子点赞
async function likeCurrentPost() {
    try {
        console.log('开始处理当前帖子');

        // 获取帖子信息
        const titleElement = document.querySelector('#detail-title');
        const authorElement = document.querySelector('.author .username');
        const title = titleElement ? titleElement.textContent : '未知标题';
        const author = authorElement ? authorElement.textContent : '未知作者';

        // 记录开始处理时间
        const startTime = new Date();

        // 等待评论加载
        console.log('等待评论加载...');
        const commentsLoaded = await waitForCommentsLoad();
        if (!commentsLoaded) {
            throw new Error('评论加载失败');
        }

        // 获取评论列表并处理
        const comments = document.querySelectorAll('.comment-item');
        console.log('找到评论数量:', comments.length);
        const result = await processComments(comments, config, stats, true);

        // 记录处理完成时间
        const endTime = new Date();
        const duration = endTime - startTime;

        // 发送状态更新
        chrome.runtime.sendMessage({
            type: 'status',
            text: `当前帖子点赞完成 (总点赞数: ${stats.totalLikes})`
        });

    } catch (error) {
        console.error('处理当前帖子时发生错误:', error);
        chrome.runtime.sendMessage({
            type: 'status',
            text: '处理当前帖子时发生错误：' + error.message
        });
    }
}

// 处理单篇帖子评论
async function commentCurrentPost() {
    try {
        console.log('开始评论当前帖子');

        // 获取帖子信息
        var titleElement = document.querySelector('#detail-title');
        var authorElement = document.querySelector('.author .username');
        var contentElement = document.querySelector('#detail-content');

        if (!authorElement) {
            authorElement = document.querySelector('.author-wrapper .username');
        }
        if (!contentElement) {
            contentElement = document.querySelector('#detail-desc');
        }
        const title = titleElement ? titleElement.textContent : '';
        const author = authorElement ? authorElement.textContent : '';
        const content = contentElement ? contentElement.textContent : '';

        console.log('帖子信息:', title, author, content);

        // 使用作者和标题组合作为唯一标识
        const postIdentifier = `${author}_${title}`;
        console.log('生成帖子唯一标识:', postIdentifier);

        // 检查帖子是否已处理过
        console.log('检查帖子是否已处理...');
        const isProcessed = await checkPostProcessed(postIdentifier);
        if (isProcessed) {
            console.log('帖子已处理过，跳过:', title);
            // 添加toast提示
            chrome.runtime.sendMessage({
                type: 'toast',
                text: '该帖子已处理过，跳过'
            });
            return null;
        }
        console.log('帖子未处理过，继续处理');

        // 记录开始处理时间
        const startTime = new Date();

        // 检查是否启用了评论功能
        if (config.testModeComment) {
            console.log('测试模式 - 帖子信息：', { title, author });
            chrome.runtime.sendMessage({
                type: 'status',
                text: '测试模式：' + title + ' ' + author
            });
            return null;
        }

        // 获取评论内容
        let commentContent;
        if (config.commentMode === 'random') {
            if (config.randomComments.length === 0) {
                console.error('未配置评论内容');
                throw new Error('请添加自定义评论内容');
            }
            commentContent = getRandomComment(config.randomComments);
            console.log('获取随机评论内容:', commentContent);
        } else if (config.commentMode === 'ai') {
            try {
                const aiGenerator = new AICommentGenerator(config);
                commentContent = await aiGenerator.generateComment(title, content);
                console.log('生成AI评论内容:', commentContent);

                // 检查AI返回内容是否包含"不评论"
                if (commentContent && commentContent.includes('不评论')) {
                    console.log('AI建议不评论该帖子');
                    chrome.runtime.sendMessage({
                        type: 'toast',
                        text: 'AI建议不评论该帖子'
                    });

                    // 添加处理记录
                    const endTime = new Date();
                    const duration = endTime - startTime;
                    const record = {
                        postId: postIdentifier,
                        title,
                        author,
                        content,
                        operationType: '评论',
                        startTime: startTime.toISOString(),
                        endTime: endTime.toISOString(),
                        duration,
                        commentCount: 0,
                        myComment: 'AI建议不评论',
                        status: 'skipped'
                    };
                    await addRecord(record);
                    return null;
                }
            } catch (error) {
                console.error('生成AI评论失败:', error);
                throw new Error('生成AI评论失败: ' + error.message);
            }
        }

        if (commentContent) {
            console.log('准备发送评论:', commentContent);
            const success = await addComment(commentContent);
            if (success) {
                console.log('评论发送成功');
                // 记录处理完成时间
                const endTime = new Date();
                const duration = endTime - startTime;

                // 添加处理记录
                console.log('准备添加评论记录');
                const record = {
                    postId: postIdentifier,
                    title,
                    author,
                    content,
                    operationType: '评论',
                    startTime: startTime.toISOString(),
                    endTime: endTime.toISOString(),
                    duration,
                    commentCount: 1,
                    myComment: commentContent,
                    status: 'success'
                };
                console.log('记录内容:', record);
                const recordAdded = await addRecord(record);
                console.log('记录添加结果:', recordAdded ? '成功' : '失败');

                chrome.runtime.sendMessage({
                    type: 'status',
                    text: '评论发送成功'
                });
                return commentContent;
            }
            console.error('评论发送失败');
            throw new Error('评论发送失败');
        }

        return null;

    } catch (error) {
        console.error('评论当前帖子时发生错误:', error);
        chrome.runtime.sendMessage({
            type: 'status',
            text: '评论当前帖子时发生错误：' + error.message
        });
        return null;
    }
} 
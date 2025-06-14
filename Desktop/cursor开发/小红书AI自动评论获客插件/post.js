import { getRandomComment, addComment } from './comment.js';
import { getRandomDelay, checkLimits, showToast } from './utils.js';

// 处理评论点赞的核心逻辑
async function processComments(comments, config, stats, isSinglePost = false) {
    let postLikes = 0; // 当前帖子的点赞数
    let processedComments = new Set(); // 记录已处理的评论
    let myComment = null; // 记录我们的评论内容

    // 随机滚动评论区
    const scrollComments = (comment) => {
        const commentContainer = document.querySelector('.note-scroller');
        if (commentContainer && comment) {
            comment.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    };

    // 处理当前评论
    async function processCurrentComments() {
        for (const comment of comments) {
            if (!isSinglePost && !isRunning) break;

            // 检查限制
            if (!isSinglePost) {
                const limitError = checkLimits(stats, config);
                if (limitError) {
                    console.log(limitError);
                    chrome.runtime.sendMessage({
                        type: 'status',
                        text: limitError
                    });
                    isRunning = false;
                    break;
                }
            }

            // 检查单个帖子点赞限制
            if (config.maxLikesPerPost > 0 && postLikes >= config.maxLikesPerPost) {
                console.log('已达到单个帖子最大点赞数限制');
                break;
            }

            // 跳过已处理的评论
            const commentId = comment.getAttribute('data-id') || comment.innerHTML;
            if (processedComments.has(commentId)) {
                continue;
            }
            processedComments.add(commentId);

            // 获取评论用户和内容
            const authorElement = comment.querySelector('.author .name');
            const contentElement = comment.querySelector('.content .note-text');
            const hasImage = comment.querySelector('.comment-picture') !== null;

            if (authorElement && contentElement) {
                const author = authorElement.textContent;
                const content = contentElement.textContent;
                console.log('评论用户:', author);
                console.log('评论内容:', content);
                console.log('评论带图片:', hasImage);

                // 检查评论是否满足条件
                const hasKeyword = config.commentKeywords.length === 0 ||
                    config.commentKeywords.some(keyword => content.includes(keyword));
                const imageMatch = !config.requireImage || hasImage;

                if (!hasKeyword || !imageMatch) {
                    console.log('评论不满足条件，跳过');
                    continue;
                }
            }

            // 跳过作者评论
            const isAuthor = comment.querySelector('.author .tag')?.textContent === '作者';
            if (isAuthor) {
                console.log('跳过作者评论');
                continue;
            }

            // 滚动到当前评论位置
            if (Math.random() < 0.8) { // 80%的概率滚动
                scrollComments(comment);
                await new Promise(resolve => setTimeout(resolve, getRandomDelay({ min: 500, max: 1000 })));
            }

            // 查找点赞按钮并点击
            const likeButton = comment.querySelector('.like-wrapper');
            const likeIcon = likeButton?.querySelector('svg.like-icon use');
            if (likeButton && likeIcon && likeIcon.getAttribute('xlink:href') === '#like') {
                if (config.isTestMode) {
                    const author = comment.querySelector('.author .name')?.textContent || '未知用户';
                    const content = comment.querySelector('.content .note-text')?.textContent || '无内容';
                    showToast(`测试模式：\n用户：${author}\n内容：${content}`);
                } else {
                    console.log('点赞评论');
                    likeButton.click();
                }
                stats.totalLikes++;
                postLikes++;
                await new Promise(resolve => setTimeout(resolve, getRandomDelay(config.likeInterval)));
            }

            // 如果启用了评论功能且还没有评论过
            if (!config.testModeComment) {
                // 获取帖子信息
                const titleElement = document.querySelector('#detail-title');
                const authorElement = document.querySelector('.author .username');
                const title = titleElement ? titleElement.textContent : '未知标题';
                const author = authorElement ? authorElement.textContent : '未知作者';

                console.log('帖子信息:', title, author);
                // 检查是否已经评论过
                if (title && author) {
                    const postIdentifier = `${author}_${title}`;
                    const isProcessed = await checkPostProcessed(postIdentifier);
                    if (isProcessed) {
                        console.log('帖子已评论过，跳过');
                        continue;
                    }
                }

                let commentContent;
                if (config.commentMode === 'random') {
                    commentContent = getRandomComment(config.randomComments);
                } else if (config.commentMode === 'ai') {
                    // TODO: 这里可以接入AI评论功能
                    commentContent = 'AI评论功能待实现';
                }

                if (commentContent) {
                    console.log('准备发送评论:', commentContent);
                    const success = await addComment(commentContent);
                    if (success) {
                        console.log('评论发送成功');
                        hasCommented = true;
                        myComment = commentContent; // 记录我们的评论内容

                        // 添加评论记录，使用作者+标题作为唯一标识
                        if (title && author) {
                            await addRecord({
                                postId: `${author}_${title}`, // 使用作者和标题组合作为唯一标识
                                title,
                                author,
                                operationType: '评论',
                                startTime: new Date().toISOString(),
                                endTime: new Date().toISOString(),
                                duration: 0,
                                commentCount: 1,
                                myComment: commentContent,
                                status: 'success'
                            });
                        }

                        await new Promise(resolve => setTimeout(resolve, getRandomDelay({ min: 2000, max: 3000 })));
                    } else {
                        console.error('评论发送失败');
                        throw new Error('评论发送失败');
                    }
                }
            }
        }
    }

    // 尝试加载更多评论
    async function tryLoadMoreComments() {
        const maxAttempts = 3;
        let attempts = 0;
        let lastCommentCount = comments.length;

        while (attempts < maxAttempts) {
            // 滚动到底部
            const commentContainer = document.querySelector('.note-scroller');
            if (commentContainer) {
                commentContainer.scrollTo({
                    top: commentContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }

            // 等待新评论加载
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 检查是否有新评论
            const newComments = document.querySelectorAll('.comment-item');
            if (newComments.length === lastCommentCount) {
                attempts++;
                console.log(`尝试加载更多评论... 尝试 ${attempts}/${maxAttempts}`);
                continue;
            }

            // 处理新评论
            lastCommentCount = newComments.length;
            comments = newComments;
            await processCurrentComments();
        }
    }

    // 先处理当前评论
    await processCurrentComments();

    // 再尝试加载更多评论
    await tryLoadMoreComments();

    return {
        postLikes,
        myComment
    };
}

// 通用帖子处理函数
async function processPosts(operationType, operationHandler, config, stats) {
    if (!isRunning) return;

    try {
        // 检查限制
        const limitError = checkLimits(stats, config);
        if (limitError) {
            console.log(limitError);
            chrome.runtime.sendMessage({
                type: 'status',
                text: limitError
            });
            isRunning = false;
            return;
        }

        console.log(`开始自动${operationType}流程`);
        // 检查当前是否在搜索页面
        if (!window.location.href.includes('search_result')) {
        }

        if (currentKeyword) {
            // 在当前页面搜索
            const searchInput = document.querySelector('#search-input');
            if (searchInput) {
                // 清空搜索框
                searchInput.value = '';
                // 输入关键词
                searchInput.value = currentKeyword;
                // 触发输入事件
                searchInput.dispatchEvent(new Event('input', { bubbles: true }));
                // 触发回车事件
                searchInput.dispatchEvent(new KeyboardEvent('keydown', {
                    key: 'Enter',
                    code: 'Enter',
                    keyCode: 13,
                    which: 13,
                    bubbles: true
                }));


                //最新排序
                const sort = document.querySelector('body > div:nth-child(7) > div > li:nth-child(2) > span');
                if (sort) {
                    sort.click();
                }

                const searchIcon = document.querySelector('.search-icon');
                if (searchIcon) {
                    searchIcon.click()
                }

                // 使用chrome.runtime.sendMessage通知background script
                chrome.runtime.sendMessage({
                    type: 'status',
                    text: '正在搜索关键词'
                });
                await new Promise(resolve => setTimeout(resolve, 5000));
                //return;
            } else {
                console.log('未找到搜索框');
                chrome.runtime.sendMessage({
                    type: 'status',
                    text: '未找到搜索框，请确保在正确的页面'
                });
                return;
            }
        }

        // 处理当前页面的帖子
        async function processCurrentPage() {
            // 获取所有帖子
            const posts = document.querySelectorAll('.note-item .cover');
            console.log('找到帖子数量:', posts.length);

            // 处理每个帖子
            for (const post of posts) {
                if (!isRunning) break;

                // 检查限制
                const limitError = checkLimits(stats, config);
                if (limitError) {
                    console.log(limitError);
                    chrome.runtime.sendMessage({
                        type: 'status',
                        text: limitError
                    });
                    isRunning = false;
                    break;
                }

                // 点击帖子
                console.log('going to click', config.pageLoadWait, post)
                post.click();
                await new Promise(resolve => setTimeout(resolve, getRandomDelay(config.pageLoadWait)));
                console.log('click post', getRandomDelay(config.pageLoadWait))

                // 获取帖子信息
                const titleElement = post.querySelector('.title');
                const authorElement = post.querySelector('.author .username');
                const postId = post.getAttribute('data-id');
                const title = titleElement ? titleElement.textContent : '';
                const author = authorElement ? authorElement.textContent : '';

                // 检查帖子是否已处理过
                if (postId) {
                    const isProcessed = await checkPostProcessed(postId);
                    if (isProcessed) {
                        console.log('帖子已处理过，跳过:', title);
                        continue;
                    }
                }

                // 执行操作
                try {
                    await operationHandler(postId, title, author);
                    stats.processedPosts++;
                } catch (error) {
                    console.error('处理帖子时发生错误:', error);
                    chrome.runtime.sendMessage({
                        type: 'status',
                        text: '处理帖子时发生错误：' + error.message
                    });
                }

                // 返回列表页
                const bg = document.querySelector('.note-detail-mask .close-circle');
                bg && bg.click()

                await new Promise(resolve => setTimeout(resolve, getRandomDelay(config.postInterval)));
            }
        }

        // 尝试加载更多帖子
        async function tryLoadMorePosts() {
            const maxAttempts = 3;
            let attempts = 0;
            let lastPostCount = 0;

            while (attempts < maxAttempts) {
                // 滚动到底部
                window.scrollTo(0, document.body.scrollHeight);
                await new Promise(resolve => setTimeout(resolve, 1000));

                // 检查是否有新帖子
                const posts = document.querySelectorAll('.note-item');
                if (posts.length === lastPostCount) {
                    attempts++;
                    console.log(`尝试加载更多帖子... 尝试 ${attempts}/${maxAttempts}`);
                    continue;
                }

                // 处理新帖子
                lastPostCount = posts.length;
                await processCurrentPage();
            }
        }

        // 先处理当前页面的帖子
        await processCurrentPage();

        // 再尝试加载更多帖子
        await tryLoadMorePosts();

    } catch (error) {
        console.error('处理帖子时发生错误:', error);
        chrome.runtime.sendMessage({
            type: 'status',
            text: '处理帖子时发生错误：' + error.message
        });
    }
}

// 导出函数
export { processComments, processPosts }; 
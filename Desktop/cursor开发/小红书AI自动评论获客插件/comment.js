// 添加评论功能
async function addComment(content) {
    try {
        const contentInput = document.querySelector('.not-active .inner');
        if (contentInput) {
            contentInput.click()
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 查找评论输入框
        const commentInput = document.querySelector('#content-textarea');
        if (!commentInput) {
            console.log('未找到评论输入框');
            return false;
        }

        // 点击输入框
        commentInput.click();
        await new Promise(resolve => setTimeout(resolve, 500));

        // 使用 execCommand 来输入内容
        document.execCommand('insertText', false, content);

        // 触发多个事件以确保内容被正确识别
        const events = ['input', 'change', 'keyup'];
        events.forEach(eventType => {
            const event = new Event(eventType, { bubbles: true });
            commentInput.dispatchEvent(event);
        });

        // 等待一下确保内容已输入
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 查找发送按钮并点击
        const sendButton = document.querySelector('.submit');
        if (sendButton && !sendButton.disabled) {
            sendButton.click();
            console.log('评论已发送:', content);
            return true;
        } else {
            console.log('发送按钮不可用或未找到');
            return false;
        }
    } catch (error) {
        console.error('发送评论时发生错误:', error);
        return false;
    }
}

// 获取随机评论内容
function getRandomComment(randomComments) {
    return randomComments[Math.floor(Math.random() * randomComments.length)];
}

// 等待评论加载
async function waitForCommentsLoad() {
    const maxAttempts = 3;
    const checkInterval = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
        // 检查是否有评论列表
        const comments = document.querySelectorAll('.comment-item');
        if (comments.length > 0) {
            console.log('初始评论加载完成');
            return true;
        }

        await new Promise(resolve => setTimeout(resolve, checkInterval));
        attempts++;
        console.log(`等待初始评论加载... 尝试 ${attempts}/${maxAttempts}`);
    }

    console.log('初始评论加载超时');
    return false;
}

// 导出函数
export { addComment, getRandomComment, waitForCommentsLoad }; 
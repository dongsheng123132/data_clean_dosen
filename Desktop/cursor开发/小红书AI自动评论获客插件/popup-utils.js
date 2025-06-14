// 保存配置到storage
export async function saveConfig(config) {
    return new Promise((resolve) => {
        chrome.storage.local.set({ config }, () => {
            resolve();
        });
    });
}

// 从storage加载配置
export async function loadConfig() {
    return new Promise((resolve) => {
        chrome.storage.local.get(['config'], (result) => {
            resolve(result.config || null);
        });
    });
}

// 更新状态显示
export function updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
    }
}

// 更新按钮状态
export function updateButtonState(isRunning, type) {
    const prefix = type === 'like' ? 'like' : 'comment';
    const startButton = document.getElementById(`${prefix}StartBtn`);
    const stopButton = document.getElementById(`${prefix}StopBtn`);
    const keywordInput = document.getElementById('keyword');
    const configInputs = document.querySelectorAll('.config-input');

    if (startButton) startButton.disabled = isRunning;
    if (stopButton) stopButton.disabled = !isRunning;
    if (keywordInput) keywordInput.disabled = isRunning;
    configInputs.forEach(input => {
        input.disabled = isRunning;
    });
}

// 获取表单配置
export function getFormConfig() {
    const config = {};
    const inputs = document.querySelectorAll('.config-input');

    // 特殊处理testModeComment
    const testModeCommentCheckbox = document.getElementById('testModeComment');
    if (testModeCommentCheckbox) {
        config.testModeComment = testModeCommentCheckbox.checked;
    }

    // 特殊处理randomComments
    const customComments = document.getElementById('customComments');
    if (customComments) {
        // 确保返回一个数组
        const comments = customComments.value.trim();
        config.randomComments = comments ? comments.split(/\r?\n/).filter(line => line.trim()) : [];
        console.log('获取到的评论内容:', config.randomComments); // 添加日志
    } else {
        config.randomComments = []; // 如果没有找到输入框，设置为空数组
    }

    inputs.forEach(input => {
        // 跳过已经特殊处理的字段
        if (input.id === 'customComments' || input.id === 'testModeComment') {
            return;
        }

        const value = input.type === 'checkbox' ? input.checked : input.value;
        if (input.dataset.config) {
            const keys = input.dataset.config.split('.');
            let current = config;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = current[keys[i]] || {};
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
        }
    });

    return config;
}

// 设置表单配置
export function setFormConfig(config) {
    const inputs = document.querySelectorAll('.config-input');

    // 特殊处理testModeComment
    const testModeCommentCheckbox = document.getElementById('testModeComment');
    if (testModeCommentCheckbox && config.testModeComment !== undefined) {
        testModeCommentCheckbox.checked = config.testModeComment;
    }

    // 特殊处理randomComments
    const customComments = document.getElementById('customComments');
    if (customComments && config.randomComments) {
        // 确保randomComments是数组
        const comments = Array.isArray(config.randomComments)
            ? config.randomComments
            : (typeof config.randomComments === 'string'
                ? config.randomComments.split(/\r?\n/).filter(line => line.trim())
                : []);
        customComments.value = comments.join('\n');
    }

    // 特殊处理commentMode
    const commentModeSelect = document.getElementById('commentMode');
    if (commentModeSelect && config.commentMode !== undefined) {
        commentModeSelect.value = config.commentMode;
        // 直接更新UI状态
        const aiConfig = document.getElementById('aiConfig');
        const aiConfigContent = document.getElementById('aiConfigContent');
        const customCommentsSection = document.getElementById('customCommentsSection');

        if (aiConfig && aiConfigContent && customCommentsSection) {
            if (config.commentMode === 'ai') {
                aiConfig.style.display = 'block';
                aiConfigContent.style.display = 'block';
                customCommentsSection.style.display = 'none';
            } else {
                aiConfig.style.display = 'none';
                aiConfigContent.style.display = 'none';
                customCommentsSection.style.display = 'block';
            }
        }
    }

    inputs.forEach(input => {
        // 跳过已经特殊处理的字段
        if (input.id === 'customComments' || input.id === 'testModeComment' || input.id === 'commentMode') {
            return;
        }

        if (input.dataset.config) {
            const keys = input.dataset.config.split('.');
            let value = config;
            for (const key of keys) {
                value = value?.[key];
            }
            if (value !== undefined) {
                if (input.type === 'checkbox') {
                    input.checked = value;
                } else {
                    input.value = value;
                }
            }
        }
    });
} 
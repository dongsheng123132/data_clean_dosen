// 数据库实例缓存
let dbInstance = null;
const DB_VERSION = 3; // 增加版本号，添加content字段

// 初始化数据库
async function initDatabase() {
    if (dbInstance) {
        return dbInstance;
    }

    return new Promise((resolve, reject) => {
        const request = indexedDB.open('XHSRecords', DB_VERSION);

        request.onerror = (event) => {
            console.error('打开数据库失败:', event.target.error);
            reject(new Error('打开数据库失败: ' + event.target.error.message));
        };

        request.onupgradeneeded = (event) => {
            console.log('数据库升级中...', '旧版本:', event.oldVersion, '新版本:', event.newVersion);
            const db = event.target.result;

            // 检查是否需要创建对象存储
            if (!db.objectStoreNames.contains('records')) {
                console.log('创建 records 存储...');
                const store = db.createObjectStore('records', { keyPath: 'id', autoIncrement: true });
                store.createIndex('postId', 'postId', { unique: true });
                console.log('records 存储创建成功');
            } else if (event.oldVersion < 3) {
                // 如果是升级到版本3，添加content字段
                console.log('升级到版本3，添加content字段...');
                const store = event.target.transaction.objectStore('records');
                // 由于IndexedDB不需要显式添加字段，我们只需要确保新版本的数据结构包含content字段即可
                console.log('content字段添加完成');
            }
        };

        request.onsuccess = (event) => {
            console.log('数据库打开成功');
            dbInstance = event.target.result;

            // 验证数据库结构
            if (!dbInstance.objectStoreNames.contains('records')) {
                console.error('数据库结构验证失败：records 存储不存在');
                reject(new Error('数据库结构验证失败：records 存储不存在'));
                return;
            }

            resolve(dbInstance);
        };
    });
}

// 确保数据库已初始化
async function ensureDatabaseInitialized() {
    try {
        if (!dbInstance) {
            console.log('数据库未初始化，开始初始化...');
            await initDatabase();
            console.log('数据库初始化完成');
        }
        return dbInstance;
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    }
}

// 获取随机延时
function getRandomDelay(interval) {
    return Math.floor(Math.random() * (interval.max - interval.min + 1)) + interval.min;
}

// 显示提示信息
function showToast(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 9999;
        max-width: 300px;
        word-break: break-all;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// 检查帖子是否已处理过
async function checkPostProcessed(postId) {
    console.log('检查帖子是否已处理:', postId);
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const index = store.index('postId');

            const request = index.get(postId);
            request.onsuccess = (event) => {
                const existingRecord = event.target.result;
                console.log('检查是否存在相同记录:', !!existingRecord);
                resolve(!!existingRecord);
            };
            request.onerror = (event) => {
                console.error('检查记录失败:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('检查帖子处理状态时发生错误:', error);
        return false;
    }
}

// 检查是否达到限制
function checkLimits(stats, config) {
    if (config.maxPosts > 0 && stats.processedPosts >= config.maxPosts) {
        return '已达到最大处理帖子数限制';
    }
    if (config.maxLikes > 0 && stats.totalLikes >= config.maxLikes) {
        return '已达到最大点赞总数限制';
    }
    return null;
}

// 添加记录
async function addRecord(record) {
    console.log('开始添加记录:', record);
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const index = store.index('postId');

            // 检查是否存在相同记录
            const request = index.get(record.postId);
            request.onsuccess = (event) => {
                const existingRecord = event.target.result;
                console.log('检查是否存在相同记录:', !!existingRecord);

                if (!existingRecord) {
                    // 不存在相同记录，添加新记录
                    const addRequest = store.add(record);
                    addRequest.onsuccess = () => {
                        console.log('记录添加成功:', record);
                        resolve(true);
                    };
                    addRequest.onerror = (event) => {
                        console.error('记录添加失败:', event.target.error);
                        reject(event.target.error);
                    };
                } else {
                    console.log('记录已存在，跳过添加');
                    resolve(false);
                }
            };
            request.onerror = (event) => {
                console.error('检查记录失败:', event.target.error);
                reject(event.target.error);
            };
        });
    } catch (error) {
        console.error('添加记录时发生错误:', error);
        return false;
    }
}

// 获取所有记录
async function getAllRecords() {
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const request = store.getAll();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error('获取记录失败:', event.target.error);
                reject(new Error('获取记录失败: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('获取记录时发生错误:', error);
        throw error;
    }
}

// 删除记录
async function deleteRecord(postId) {
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readwrite');
            const store = transaction.objectStore('records');
            const index = store.index('postId');

            // 先通过postId查找记录
            const getRequest = index.get(postId);
            getRequest.onsuccess = (event) => {
                const record = event.target.result;
                if (!record) {
                    reject(new Error('未找到对应的记录'));
                    return;
                }

                // 找到记录后，使用记录的id进行删除
                const deleteRequest = store.delete(record.id);
                deleteRequest.onsuccess = () => {
                    resolve({ success: true });
                };

                deleteRequest.onerror = (event) => {
                    console.error('删除记录失败:', event.target.error);
                    reject(new Error('删除记录失败: ' + event.target.error.message));
                };
            };

            getRequest.onerror = (event) => {
                console.error('查找记录失败:', event.target.error);
                reject(new Error('查找记录失败: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('删除记录时发生错误:', error);
        throw error;
    }
}

// 获取分页记录
async function getRecords(page = 1, pageSize = 20) {
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const request = store.getAll();

            request.onsuccess = (event) => {
                // 获取所有记录并按时间降序排序
                const allRecords = event.target.result.sort((a, b) =>
                    new Date(b.startTime) - new Date(a.startTime)
                );

                // 计算分页
                const start = (page - 1) * pageSize;
                const end = start + pageSize;
                const pageRecords = allRecords.slice(start, end);

                resolve(pageRecords);
            };

            request.onerror = (event) => {
                console.error('获取记录失败:', event.target.error);
                reject(new Error('获取记录失败: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('获取记录时发生错误:', error);
        throw error;
    }
}

// 获取记录总数
async function getRecordsCount() {
    try {
        const db = await ensureDatabaseInitialized();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction(['records'], 'readonly');
            const store = transaction.objectStore('records');
            const request = store.count();

            request.onsuccess = (event) => {
                resolve(event.target.result);
            };

            request.onerror = (event) => {
                console.error('获取记录总数失败:', event.target.error);
                reject(new Error('获取记录总数失败: ' + event.target.error.message));
            };
        });
    } catch (error) {
        console.error('获取记录总数时发生错误:', error);
        throw error;
    }
}

// 导出函数
export {
    getRandomDelay,
    showToast,
    checkPostProcessed,
    checkLimits,
    addRecord,
    initDatabase,
    ensureDatabaseInitialized,
    getRecordsCount,
    getRecords,
    deleteRecord
}; 
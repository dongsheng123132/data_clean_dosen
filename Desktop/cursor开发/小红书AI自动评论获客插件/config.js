window.defaultConfig = {
    likeInterval: { min: 1000, max: 2000 }, // 每条点赞间隔时间（毫秒）
    postInterval: { min: 5000, max: 8000 }, // 每个帖子处理间隔时间（毫秒）
    pageLoadWait: { min: 3000, max: 5000 }, // 页面加载等待时间（毫秒）
    commentLoadWait: { min: 3000, max: 5000 }, // 评论加载等待时间（毫秒）
    maxPosts: 0, // 最多处理帖子数，0表示不限制
    maxLikes: 0, // 最多点赞总数，0表示不限制
    maxLikesPerPost: 0, // 单个帖子最多点赞数，0表示不限制
    isTestMode: false, // 是否测试模式
    commentKeywords: [], // 评论关键词列表，为空表示不限制
    requireImage: false, // 是否要求评论带图片
    testModeComment: true, // 是否测试模式（不进行评论操作）
    commentMode: 'random', // 评论模式：'random' 或 'ai'
    randomComments: [ // 随机评论内容池
        '写得真好，感谢分享！',
        '学到了，谢谢分享经验',
        '这个建议很实用，收藏了',
        '分析得很到位，支持一下',
        '内容很有价值，期待更多分享'
    ],
    aiCommentPrompt: '请根据这篇笔记的内容，生成一条合适的评论' // AI评论提示词
}; 
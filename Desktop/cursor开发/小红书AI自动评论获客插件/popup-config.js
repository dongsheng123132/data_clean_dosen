export const UI_CONFIG = {
    // 操作类型
    OPERATION_TYPES: {
        LIKE: 'like',
        COMMENT: 'comment'
    },

    // 评论模式
    COMMENT_MODES: {
        RANDOM: 'random',
        AI: 'ai'
    },

    // 默认配置
    DEFAULT_CONFIG: {
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
        aiCommentPrompt: '请根据这篇笔记的内容，生成一条合适的评论'
    }
}; 
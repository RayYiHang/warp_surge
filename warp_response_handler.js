/*
 * Warp Account Manager - 响应处理器
 * 处理Warp API响应，缓存数据，检测账户状态
 */

// 配置和常量
const CONFIG = {
    STORAGE_KEYS: {
        ACCOUNTS: "warp_accounts",
        ACTIVE_ACCOUNT: "warp_active_account",
        USER_SETTINGS: "warp_user_settings",
        NOTIFICATIONS: "warp_notifications"
    }
};

// 账户管理功能
const accountManager = {
    markAccountAsBanned(email) {
        const accounts = JSON.parse($persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}");
        if (accounts[email]) {
            accounts[email].healthStatus = 'banned';
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

            // 如果是活跃账户，清除活跃状态
            if ($persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT) === email) {
                $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
            }

            console.log(`账户 ${email} 已标记为ban状态`);
            return true;
        }
        return false;
    },

    async updateAccountToken(email) {
        const accounts = JSON.parse($persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}");
        const accountData = accounts[email];

        if (!accountData) {
            return { success: false, message: "账户不存在" };
        }

        // 简化的token刷新逻辑
        console.log(`需要刷新账户 ${email} 的token`);
        return { success: false, message: "需要手动刷新token" };
    }
};

// 持久化管理功能
const persistenceManager = {
    getSettings() {
        try {
            const settings = JSON.parse($persistentStore.read("warp_settings") || "{}");
            return {
                success: true,
                settings: {
                    autoRefresh: settings.autoRefresh !== false,
                    banDetection: settings.banDetection !== false,
                    healthCheck: settings.healthCheck !== false,
                    autoSwitch: settings.autoSwitch === true,
                    ...settings
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `获取设置失败: ${error}`,
                settings: {
                    autoRefresh: true,
                    banDetection: true,
                    healthCheck: true,
                    autoSwitch: false
                }
            };
        }
    }
};

// 响应处理类
class ResponseHandler {
    constructor() {
        this.cachedUserSettings = null;
        this.cacheTimestamp = 0;
        this.cacheExpiry = 30 * 60 * 1000; // 30分钟缓存过期
    }

    // 处理API响应
    handleResponse(response, request) {
        try {
            // 只处理Warp相关响应
            if (!request.url.includes('app.warp.dev')) {
                return response;
            }

            console.log(`处理响应: ${response.status} - ${request.url}`);

            // 处理不同类型的响应
            this.processByEndpoint(response, request);

            // 检测账户状态变化
            this.detectAccountStatus(response, request);

            // 缓存重要数据
            this.cacheImportantData(response, request);

            return response;

        } catch (error) {
            console.log(`处理响应时出错: ${error}`);
            return response;
        }
    }

    // 根据端点类型处理响应
    processByEndpoint(response, request) {
        const url = request.url;

        // AI端点响应处理
        if (url.includes('/ai/multi-agent')) {
            this.handleAIResponse(response, request);
        }

        // GraphQL响应处理
        else if (url.includes('/graphql/v2')) {
            this.handleGraphQLResponse(response, request);
        }

        // 用户设置端点
        else if (url.includes('GetUpdatedCloudObjects')) {
            this.handleCloudObjectsResponse(response, request);
        }

        // 认证相关端点
        else if (url.includes('auth') || url.includes('login')) {
            this.handleAuthResponse(response, request);
        }
    }

    // 处理AI端点响应
    handleAIResponse(response, request) {
        // 检测403错误（可能的ban）
        if (response.status === 403) {
            this.handleForbiddenResponse(response, request);
        }

        // 检测401错误（token问题）
        else if (response.status === 401) {
            this.handleUnauthorizedResponse(response, request);
        }

        // 检测速率限制
        else if (response.status === 429) {
            this.handleRateLimitResponse(response, request);
        }

        // AI功能正常响应
        else if (response.status === 200) {
            this.markAccountHealthy();
        }
    }

    // 处理GraphQL响应
    handleGraphQLResponse(response, request) {
        if (response.status === 200) {
            try {
                const responseData = JSON.parse(response.body || "{}");

                // 检测GraphQL错误
                if (responseData.errors && responseData.errors.length > 0) {
                    this.handleGraphQLErrors(responseData.errors, request);
                }

                // 处理特定操作类型
                const operation = this.extractGraphQLOperation(request.url);
                if (operation) {
                    this.handleGraphQLOperation(operation, responseData, request);
                }

            } catch (parseError) {
                console.log(`解析GraphQL响应失败: ${parseError}`);
            }
        }
    }

    // 处理云对象响应
    handleCloudObjectsResponse(response, request) {
        if (response.status === 200) {
            try {
                const responseData = JSON.parse(response.body || "{}");

                // 缓存用户设置
                this.cacheUserSettings(responseData);

                console.log("用户设置已更新和缓存");

            } catch (parseError) {
                console.log(`缓存用户设置失败: ${parseError}`);
            }
        }
    }

    // 处理认证响应
    handleAuthResponse(response, request) {
        // 认证失败可能意味着token问题
        if (response.status === 401 || response.status === 403) {
            this.handleUnauthorizedResponse(response, request);
        }
    }

    // 处理403禁止访问响应
    handleForbiddenResponse(response, request) {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (activeEmail) {
            console.log(`检测到403错误，账户 ${activeEmail} 可能已被限制访问`);

            // 标记账户为受限状态
            accountManager.markAccountAsBanned(activeEmail);

            // 创建通知
            this.createNotification('account_banned', activeEmail,
                '账户访问被限制', response.status);
        }
    }

    // 处理401未授权响应
    handleUnauthorizedResponse(response, request) {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (activeEmail) {
            console.log(`检测到401错误，尝试刷新账户 ${activeEmail} 的token`);

            // 异步刷新token
            this.scheduleTokenRefresh(activeEmail);
        }
    }

    // 处理速率限制响应
    handleRateLimitResponse(response, request) {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (activeEmail) {
            console.log(`账户 ${activeEmail} 遇到速率限制`);

            // 创建速率限制通知
            this.createNotification('rate_limit', activeEmail,
                'API调用频率受限', response.status);
        }
    }

    // 标记账户为健康状态
    markAccountHealthy() {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (activeEmail) {
            const accounts = JSON.parse($persistentStore.read("warp_accounts") || "{}");
            if (accounts[activeEmail]) {
                accounts[activeEmail].healthStatus = 'healthy';
                accounts[activeEmail].lastHealthCheck = Date.now();

                $persistentStore.write("warp_accounts", JSON.stringify(accounts));
            }
        }
    }

    // 检测账户状态变化
    detectAccountStatus(response, request) {
        const settings = persistenceManager.getSettings();
        if (!settings.success || !settings.settings.banDetection) {
            return; // 未启用ban检测
        }

        // 检测可能的ban信号
        const banSignals = [
            response.status === 403,
            response.status === 423, // Locked
            response.body && response.body.includes('suspended'),
            response.body && response.body.includes('banned'),
            response.body && response.body.includes('restricted')
        ];

        if (banSignals.some(signal => signal)) {
            this.handlePotentialBan(response, request);
        }
    }

    // 处理可能的ban情况
    handlePotentialBan(response, request) {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (!activeEmail) return;

        // 避免重复处理
        const lastBanCheck = $persistentStore.read("warp_last_ban_check") || "0";
        const now = Date.now().toString();

        if (parseInt(now) - parseInt(lastBanCheck) < 60000) { // 1分钟内不重复检查
            return;
        }

        console.log(`检测到可能的ban信号，账户: ${activeEmail}`);
        $persistentStore.write("warp_last_ban_check", now);

        // 分析响应内容以确定是否真的被ban
        this.analyzeBanResponse(response, request, activeEmail);
    }

    // 分析ban响应
    analyzeBanResponse(response, request, email) {
        const responseBody = response.body || '';

        // 明确的ban关键词
        const banKeywords = [
            'account suspended', 'account banned', 'access denied',
            'violated terms', 'abuse detected', 'unauthorized access'
        ];

        const isBanned = banKeywords.some(keyword =>
            responseBody.toLowerCase().includes(keyword)
        );

        if (isBanned) {
            accountManager.markAccountAsBanned(email);
            this.createNotification('confirmed_ban', email,
                '账户已被确认封禁', response.status);
        } else {
            // 可能是临时问题
            this.createNotification('potential_issue', email,
                '账户可能遇到临时问题', response.status);
        }
    }

    // 缓存重要数据
    cacheImportantData(response, request) {
        // 缓存用户设置
        if (request.url.includes('GetUpdatedCloudObjects') && response.status === 200) {
            this.cacheUserSettingsFromResponse(response);
        }

        // 缓存AI配置
        if (request.url.includes('/ai/config') && response.status === 200) {
            this.cacheAIConfig(response);
        }
    }

    // 从响应缓存用户设置
    cacheUserSettingsFromResponse(response) {
        try {
            const responseData = JSON.parse(response.body || "{}");
            this.cacheUserSettings(responseData);
        } catch (error) {
            console.log(`缓存用户设置失败: ${error}`);
        }
    }

    // 缓存用户设置
    cacheUserSettings(settingsData) {
        this.cachedUserSettings = settingsData;
        this.cacheTimestamp = Date.now();

        // 保存到持久存储
        try {
            const settingsString = JSON.stringify(settingsData);
            $persistentStore.write("warp_user_settings", settingsString);
        } catch (error) {
            console.log(`持久化用户设置失败: ${error}`);
        }
    }

    // 缓存AI配置
    cacheAIConfig(response) {
        try {
            const configData = JSON.parse(response.body || "{}");
            $persistentStore.write("warp_ai_config", JSON.stringify(configData));
            console.log("AI配置已缓存");
        } catch (error) {
            console.log(`缓存AI配置失败: ${error}`);
        }
    }

    // 获取缓存的用户设置
    getCachedUserSettings() {
        const now = Date.now();

        // 检查缓存是否过期
        if (now - this.cacheTimestamp > this.cacheExpiry) {
            // 从持久存储重新加载
            try {
                const storedSettings = $persistentStore.read("warp_user_settings");
                if (storedSettings) {
                    this.cachedUserSettings = JSON.parse(storedSettings);
                    this.cacheTimestamp = now;
                }
            } catch (error) {
                console.log(`重新加载用户设置失败: ${error}`);
                return null;
            }
        }

        return this.cachedUserSettings;
    }

    // 计划token刷新
    scheduleTokenRefresh(email) {
        // 延迟刷新，避免同时刷新多个token
        setTimeout(() => {
            accountManager.updateAccountToken(email);
        }, Math.random() * 5000); // 随机延迟0-5秒
    }

    // 提取GraphQL操作
    extractGraphQLOperation(url) {
        const match = url.match(/op=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : null;
    }

    // 处理GraphQL错误
    handleGraphQLErrors(errors, request) {
        const activeEmail = $persistentStore.read("warp_active_account");
        if (!activeEmail) return;

        errors.forEach(error => {
            if (error.message) {
                // 检测权限相关错误
                if (error.message.includes('permission') ||
                    error.message.includes('unauthorized') ||
                    error.message.includes('forbidden')) {

                    this.createNotification('graphql_permission_error',
                        activeEmail, error.message, 'graphql');
                }
            }
        });
    }

    // 处理GraphQL操作
    handleGraphQLOperation(operation, responseData, request) {
        // 处理特定的GraphQL操作
        switch (operation) {
            case 'CreateGenericStringObject':
                // 用户设置更新
                this.cacheUserSettings(responseData);
                break;
            case 'GetUpdatedCloudObjects':
                // 获取云对象更新
                this.cacheUserSettings(responseData);
                break;
            default:
                // 记录未知操作
                console.log(`处理未知GraphQL操作: ${operation}`);
        }
    }

    // 创建通知
    createNotification(type, email, message, statusCode) {
        const notification = {
            type: type,
            email: email,
            message: message,
            statusCode: statusCode,
            timestamp: Date.now()
        };

        // 保存通知
        const notifications = JSON.parse($persistentStore.read("warp_notifications") || "[]");
        notifications.push(notification);

        // 只保留最近100条通知
        if (notifications.length > 100) {
            notifications.splice(0, notifications.length - 100);
        }

        $persistentStore.write("warp_notifications", JSON.stringify(notifications));
        console.log(`创建通知: ${type} - ${message}`);
    }

    // 获取最近的通知
    getRecentNotifications(limit = 20) {
        try {
            const notifications = JSON.parse($persistentStore.read("warp_notifications") || "[]");

            // 按时间倒序排列，获取最新的通知
            return notifications
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);
        } catch (error) {
            console.log(`获取通知失败: ${error}`);
            return [];
        }
    }
}

// 创建全局响应处理器实例
const responseHandler = new ResponseHandler();


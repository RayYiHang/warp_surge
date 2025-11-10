/*
 * Warp Account Manager - Token自动刷新服务
 * 定期检查和刷新即将过期的token
 */

const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000; // 提前5分钟刷新

// 获取账户管理器模块
const accountManager = require('./warp_manager.js');
const persistenceManager = require('./warp_persistence.js');

// Token刷新服务
class TokenRefreshService {
    constructor() {
        this.isRunning = false;
        this.refreshTimer = null;
        this.refreshQueue = [];
    }

    // 启动自动刷新服务
    start() {
        if (this.isRunning) {
            console.log("Token刷新服务已在运行");
            return;
        }

        this.isRunning = true;
        console.log("Token刷新服务已启动");

        // 立即执行一次检查
        this.checkAllTokens();

        // 设置定时检查
        this.refreshTimer = setInterval(() => {
            this.checkAllTokens();
        }, TOKEN_REFRESH_INTERVAL);
    }

    // 停止自动刷新服务
    stop() {
        if (!this.isRunning) {
            return;
        }

        this.isRunning = false;
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }

        console.log("Token刷新服务已停止");
    }

    // 检查所有账户的token
    async checkAllTokens() {
        if (!this.isRunning) return;

        console.log("开始检查所有账户token...");

        try {
            const accounts = accountManager.getAccounts();
            const settings = persistenceManager.getSettings();

            if (!settings.success) {
                console.log("获取设置失败，跳过token检查");
                return;
            }

            const accountEmails = Object.keys(accounts);
            let refreshCount = 0;

            for (const email of accountEmails) {
                const accountData = accounts[email];

                // 跳过已ban的账户
                if (accountData.healthStatus === 'banned') {
                    continue;
                }

                // 检查token是否需要刷新
                if (this.needsRefresh(accountData.stsTokenManager)) {
                    console.log(`账户 ${email} 的token需要刷新`);
                    refreshCount++;

                    // 异步刷新token，不阻塞其他检查
                    this.refreshAccountToken(email);
                }
            }

            if (refreshCount === 0) {
                console.log("所有账户token仍然有效");
            } else {
                console.log(`${refreshCount} 个账户的token正在刷新`);
            }

        } catch (error) {
            console.log(`检查token时出错: ${error}`);
        }
    }

    // 检查单个账户是否需要刷新token
    needsRefresh(tokenManager) {
        if (!tokenManager || !tokenManager.expirationTime) {
            return true; // 无效token数据，需要刷新
        }

        const currentTime = Date.now();
        const expiryTime = tokenManager.expirationTime;

        return currentTime >= (expiryTime - TOKEN_REFRESH_THRESHOLD);
    }

    // 刷新单个账户的token
    async refreshAccountToken(email) {
        try {
            console.log(`正在刷新账户 ${email} 的token...`);

            const result = await accountManager.updateAccountToken(email);

            if (result.success) {
                console.log(`账户 ${email} 的token刷新成功`);
                this.notifyTokenRefresh(email, true, result.message);
            } else {
                console.log(`账户 ${email} 的token刷新失败: ${result.message}`);
                this.notifyTokenRefresh(email, false, result.message);

                // 如果刷新失败，标记账户为不健康
                this.markAccountUnhealthy(email);
            }

        } catch (error) {
            console.log(`刷新账户 ${email} token时发生异常: ${error}`);
            this.notifyTokenRefresh(email, false, `刷新异常: ${error}`);
            this.markAccountUnhealthy(email);
        }
    }

    // 标记账户为不健康状态
    markAccountUnhealthy(email) {
        const accounts = accountManager.getAccounts();
        if (accounts[email]) {
            accounts[email].healthStatus = 'unhealthy';
            accounts[email].lastHealthCheck = Date.now();

            $persistentStore.write("warp_accounts", JSON.stringify(accounts));
            console.log(`账户 ${email} 已标记为不健康状态`);
        }
    }

    // 通知token刷新结果
    notifyTokenRefresh(email, success, message) {
        const notification = {
            type: 'token_refresh',
            email: email,
            success: success,
            message: message,
            timestamp: Date.now()
        };

        // 保存通知到持久存储
        const notifications = JSON.parse($persistentStore.read("warp_notifications") || "[]");
        notifications.push(notification);

        // 只保留最近50条通知
        if (notifications.length > 50) {
            notifications.splice(0, notifications.length - 50);
        }

        $persistentStore.write("warp_notifications", JSON.stringify(notifications));
    }

    // 手动刷新所有token
    async forceRefreshAll() {
        console.log("强制刷新所有账户token...");

        const accounts = accountManager.getAccounts();
        const accountEmails = Object.keys(accounts);

        const promises = accountEmails.map(email => {
            return this.refreshAccountToken(email);
        });

        await Promise.allSettled(promises);

        console.log("强制刷新完成");
    }

    // 获取token刷新统计
    getRefreshStats() {
        try {
            const notifications = JSON.parse($persistentStore.read("warp_notifications") || "[]");
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            // 过滤最近24小时的通知
            const recentNotifications = notifications.filter(n =>
                n.type === 'token_refresh' && (now - n.timestamp) < oneDay
            );

            const successCount = recentNotifications.filter(n => n.success).length;
            const failureCount = recentNotifications.filter(n => !n.success).length;

            return {
                success: true,
                stats: {
                    totalRefreshes24h: recentNotifications.length,
                    successfulRefreshes24h: successCount,
                    failedRefreshes24h: failureCount,
                    successRate: recentNotifications.length > 0 ?
                        (successCount / recentNotifications.length * 100).toFixed(1) + "%" : "N/A",
                    serviceRunning: this.isRunning
                }
            };
        } catch (error) {
            return {
                success: false,
                message: `获取刷新统计失败: ${error}`,
                stats: {
                    serviceRunning: this.isRunning
                }
            };
        }
    }
}

// 创建全局服务实例
const tokenRefreshService = new TokenRefreshService();

// 导出服务
if (typeof module !== 'undefined') {
    module.exports = tokenRefreshService;
}

// 自动启动服务（如果启用自动刷新）
const settings = persistenceManager.getSettings();
if (settings.success && settings.settings.autoRefresh) {
    console.log("自动token刷新已启用，启动服务...");
    tokenRefreshService.start();
}
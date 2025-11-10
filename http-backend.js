/*
 * Warp Account Manager HTTP Backend - Surge版
 * 为Surge提供HTTP API接口，支持Web管理界面
 */

const CONFIG = {
    PORT: 8080,
    HOST: '127.0.0.1',
    STORAGE_KEYS: {
        ACCOUNTS: "warp_accounts",
        ACTIVE_ACCOUNT: "warp_active_account",
        USER_SETTINGS: "warp_user_settings",
        NOTIFICATIONS: "warp_notifications"
    }
};

// HTTP API处理器类
class WarpAPIHandler {
    constructor() {
        this.routes = new Map();
        this.setupRoutes();
    }

    // 设置路由
    setupRoutes() {
        // 账户管理API
        this.routes.set('GET:/api/accounts', this.getAccounts.bind(this));
        this.routes.set('POST:/api/accounts', this.addAccount.bind(this));
        this.routes.set('DELETE:/api/accounts/:email', this.deleteAccount.bind(this));
        this.routes.set('POST:/api/switch', this.switchAccount.bind(this));
        this.routes.set('GET:/api/active', this.getActiveAccount.bind(this));

        // 统计信息API
        this.routes.set('GET:/api/stats', this.getStats.bind(this));
        this.routes.set('GET:/api/refresh-stats', this.getRefreshStats.bind(this));
        this.routes.set('GET:/api/notifications', this.getNotifications.bind(this));

        // 备份恢复API
        this.routes.set('GET:/api/backup', this.createBackup.bind(this));
        this.routes.set('POST:/api/restore', this.restoreData.bind(this));
        this.routes.set('DELETE:/api/clear', this.clearAllData.bind(this));

        // 设置API
        this.routes.set('GET:/api/settings', this.getSettings.bind(this));
        this.routes.set('POST:/api/settings', this.updateSettings.bind(this));

        // 测试API
        this.routes.set('POST:/api/test', this.runTest.bind(this));
    }

    // 处理HTTP请求
    handleRequest(request, response) {
        try {
            const method = request.method || 'GET';
            const url = request.url || '';
            const path = url.split('?')[0];

            const routeKey = `${method}:${path}`;
            const handler = this.routes.get(routeKey);

            if (handler) {
                return handler(request, response);
            } else {
                return this.sendJSON(response, { error: 'API Not Found' }, 404);
            }
        } catch (error) {
            return this.sendJSON(response, { error: error.message }, 500);
        }
    }

    // 账户管理API实现
    getAccounts(request, response) {
        try {
            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);
            const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT) || "";

            const accountList = Object.keys(accounts).map(email => ({
                email,
                isActive: email === activeEmail,
                healthStatus: accounts[email].healthStatus || 'healthy',
                lastUpdated: accounts[email].lastUpdated || Date.now()
            }));

            return this.sendJSON(response, {
                success: true,
                data: accountList
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    addAccount(request, response) {
        try {
            const accountData = JSON.parse(request.body);

            if (!accountData.email || !accountData.stsTokenManager) {
                return this.sendJSON(response, {
                    success: false,
                    error: "无效的账户数据结构"
                }, 400);
            }

            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);

            // 添加账户信息
            accounts[accountData.email] = {
                ...accountData,
                healthStatus: 'healthy',
                lastUpdated: Date.now()
            };

            $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

            // 如果是第一个账户，设为活跃账户
            if (Object.keys(accounts).length === 1) {
                $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, accountData.email);
            }

            return this.sendJSON(response, {
                success: true,
                message: `账户 ${accountData.email} 已添加`
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    deleteAccount(request, response) {
        try {
            const pathParts = request.path.split('/');
            const email = decodeURIComponent(pathParts[pathParts.length - 1]);

            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);

            if (!accounts[email]) {
                return this.sendJSON(response, {
                    success: false,
                    error: "账户不存在"
                }, 404);
            }

            delete accounts[email];
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

            // 如果删除的是活跃账户，清除活跃状态
            const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
            if (activeEmail === email) {
                $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
            }

            return this.sendJSON(response, {
                success: true,
                message: `账户 ${email} 已删除`
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    switchAccount(request, response) {
        try {
            const { email } = JSON.parse(request.body);

            if (!email) {
                return this.sendJSON(response, {
                    success: false,
                    error: "邮箱地址不能为空"
                }, 400);
            }

            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);

            if (!accounts[email]) {
                return this.sendJSON(response, {
                    success: false,
                    error: "账户不存在"
                }, 404);
            }

            $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, email);

            return this.sendJSON(response, {
                success: true,
                message: `已切换到账户 ${email}`
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    getActiveAccount(request, response) {
        try {
            const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT) || null;
            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);

            const activeAccount = activeEmail && accounts[activeEmail] ? {
                email: activeEmail,
                ...accounts[activeEmail]
            } : null;

            return this.sendJSON(response, {
                success: true,
                data: activeAccount
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    // 统计信息API
    getStats(request, response) {
        try {
            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);
            const accountCount = Object.keys(accounts).length;

            const bannedCount = Object.values(accounts).filter(acc =>
                acc.healthStatus === 'banned'
            ).length;

            const healthyCount = accountCount - bannedCount;
            const backupExists = !!$persistentStore.read("warp_backup");

            return this.sendJSON(response, {
                success: true,
                data: {
                    totalAccounts: accountCount,
                    healthyAccounts: healthyCount,
                    bannedAccounts: bannedCount,
                    hasBackup: backupExists
                }
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    getRefreshStats(request, response) {
        try {
            const notifications = JSON.parse($persistentStore.read(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || "[]");
            const now = Date.now();
            const oneDay = 24 * 60 * 60 * 1000;

            const recentNotifications = notifications.filter(n =>
                n.type === 'token_refresh' && (now - n.timestamp) < oneDay
            );

            const successCount = recentNotifications.filter(n => n.success).length;
            const failureCount = recentNotifications.filter(n => !n.success).length;

            return this.sendJSON(response, {
                success: true,
                data: {
                    totalRefreshes24h: recentNotifications.length,
                    successfulRefreshes24h: successCount,
                    failedRefreshes24h: failureCount,
                    successRate: recentNotifications.length > 0 ?
                        (successCount / recentNotifications.length * 100).toFixed(1) + "%" : "N/A"
                }
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    getNotifications(request, response) {
        try {
            const notifications = JSON.parse($persistentStore.read(CONFIG.STORAGE_KEYS.NOTIFICATIONS) || "[]");

            // 按时间倒序排列，获取最新的通知
            const recentNotifications = notifications
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, 20);

            return this.sendJSON(response, {
                success: true,
                data: recentNotifications
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    // 备份恢复API
    createBackup(request, response) {
        try {
            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const activeAccount = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT) || "";
            const settings = $persistentStore.read("warp_settings") || "{}";
            const userSettings = $persistentStore.read(CONFIG.STORAGE_KEYS.USER_SETTINGS) || "";

            const backupData = {
                version: "1.0",
                timestamp: Date.now(),
                accounts: JSON.parse(accountsData),
                activeAccount: activeAccount,
                settings: JSON.parse(settings),
                userSettings: userSettings ? JSON.parse(userSettings) : null
            };

            $persistentStore.write("warp_backup", JSON.stringify(backupData));

            return this.sendJSON(response, {
                success: true,
                data: backupData
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    restoreData(request, response) {
        try {
            const { backupData } = JSON.parse(request.body);
            const data = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;

            if (!data.version || !data.accounts) {
                return this.sendJSON(response, {
                    success: false,
                    error: "无效的备份数据格式"
                }, 400);
            }

            // 恢复数据
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(data.accounts));
            if (data.activeAccount) {
                $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, data.activeAccount);
            }
            if (data.settings) {
                $persistentStore.write("warp_settings", JSON.stringify(data.settings));
            }
            if (data.userSettings) {
                $persistentStore.write(CONFIG.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(data.userSettings));
            }

            return this.sendJSON(response, {
                success: true,
                message: "数据恢复成功"
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    clearAllData(request, response) {
        try {
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify({}));
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
            $persistentStore.write(CONFIG.STORAGE_KEYS.USER_SETTINGS, "");
            $persistentStore.write(CONFIG.STORAGE_KEYS.NOTIFICATIONS, "");

            return this.sendJSON(response, {
                success: true,
                message: "所有数据已清除"
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    // 设置API
    getSettings(request, response) {
        try {
            const settings = JSON.parse($persistentStore.read("warp_settings") || "{}");
            return this.sendJSON(response, {
                success: true,
                data: {
                    autoRefresh: settings.autoRefresh !== false,
                    banDetection: settings.banDetection !== false,
                    healthCheck: settings.healthCheck !== false,
                    autoSwitch: settings.autoSwitch === true,
                    ...settings
                }
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    updateSettings(request, response) {
        try {
            const { settings } = JSON.parse(request.body);
            const currentSettings = JSON.parse($persistentStore.read("warp_settings") || "{}");
            const updatedSettings = { ...currentSettings, ...settings };

            $persistentStore.write("warp_settings", JSON.stringify(updatedSettings));

            return this.sendJSON(response, {
                success: true,
                message: "设置已更新",
                data: updatedSettings
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    // 测试API
    runTest(request, response) {
        try {
            const testAccount = {
                email: "test@example.com",
                stsTokenManager: {
                    accessToken: "test_token_123",
                    refreshToken: "refresh_token_456",
                    expirationTime: Date.now() + 3600000
                },
                healthStatus: "healthy",
                lastUpdated: Date.now()
            };

            const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
            const accounts = JSON.parse(accountsData);

            return this.sendJSON(response, {
                success: true,
                data: {
                    testAccount: testAccount,
                    currentAccounts: Object.keys(accounts),
                    systemStatus: "正常",
                    timestamp: Date.now(),
                    testResult: "模块运行正常"
                }
            });
        } catch (error) {
            return this.sendJSON(response, {
                success: false,
                error: error.message
            }, 500);
        }
    }

    // 工具方法
    sendJSON(response, data, status = 200) {
        if (typeof response === 'object' && response.headers) {
            // Surge HTTP响应
            response.headers['Content-Type'] = 'application/json';
            response.headers['Access-Control-Allow-Origin'] = '*';
            response.status = status;
            response.body = JSON.stringify(data, null, 2);
        } else {
            // 其他情况，返回JSON字符串
            return JSON.stringify(data, null, 2);
        }
    }
}

// 创建全局API处理器实例
const apiHandler = new WarpAPIHandler();

// HTTP请求处理函数
function handleRequest(request, response) {
    return apiHandler.handleRequest(request, response);
}

// 导出处理函数供Surge使用
if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest,
        apiHandler
    };
}

console.log('🌐 Warp HTTP API后端已加载');
console.log('📱 Web管理界面: http://warp.local');
console.log('🔧 API接口: http://warp.local/api');

// 在Surge环境中，这个脚本主要用于处理API请求
// 实际的HTTP服务需要通过Surge的规则和重写来实现
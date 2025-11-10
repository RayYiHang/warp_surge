/*
 * Warp Account Manager - 持久化数据管理
 * 处理账户数据的导入导出和备份
 */

const STORAGE_VERSION = "1.0";

// 数据库初始化
function initDatabase() {
    const version = $persistentStore.read("warp_db_version");
    if (version !== STORAGE_VERSION) {
        // 迁移或初始化数据
        console.log(`数据库版本从 ${version} 升级到 ${STORAGE_VERSION}`);
        $persistentStore.write("warp_db_version", STORAGE_VERSION);

        // 如果是全新安装，设置默认值
        if (!version) {
            $persistentStore.write("warp_accounts", JSON.stringify({}));
            $persistentStore.write("warp_active_account", "");
            $persistentStore.write("warp_settings", JSON.stringify({
                autoRefresh: true,
                banDetection: true,
                healthCheck: true
            }));
        }
    }
}

// 数据备份
function backupData() {
    try {
        const backupData = {
            version: STORAGE_VERSION,
            timestamp: Date.now(),
            accounts: JSON.parse($persistentStore.read("warp_accounts") || "{}"),
            activeAccount: $persistentStore.read("warp_active_account") || "",
            settings: JSON.parse($persistentStore.read("warp_settings") || "{}"),
            userSettings: JSON.parse($persistentStore.read("warp_user_settings") || "null")
        };

        const backupString = JSON.stringify(backupData, null, 2);
        $persistentStore.write("warp_backup", backupString);

        return {
            success: true,
            message: "数据备份成功",
            data: backupString
        };
    } catch (error) {
        return {
            success: false,
            message: `数据备份失败: ${error}`
        };
    }
}

// 数据恢复
function restoreData(backupString) {
    try {
        const backupData = JSON.parse(backupString);

        // 验证备份数据格式
        if (!backupData.version || !backupData.accounts) {
            throw new Error("无效的备份数据格式");
        }

        // 恢复数据
        $persistentStore.write("warp_accounts", JSON.stringify(backupData.accounts));
        if (backupData.activeAccount) {
            $persistentStore.write("warp_active_account", backupData.activeAccount);
        }
        if (backupData.settings) {
            $persistentStore.write("warp_settings", JSON.stringify(backupData.settings));
        }
        if (backupData.userSettings) {
            $persistentStore.write("warp_user_settings", JSON.stringify(backupData.userSettings));
        }

        console.log("数据恢复成功");
        return {
            success: true,
            message: "数据恢复成功"
        };
    } catch (error) {
        console.log(`数据恢复失败: ${error}`);
        return {
            success: false,
            message: `数据恢复失败: ${error}`
        };
    }
}

// 清除所有数据
function clearAllData() {
    try {
        $persistentStore.write("warp_accounts", JSON.stringify({}));
        $persistentStore.write("warp_active_account", "");
        $persistentStore.write("warp_user_settings", "");
        console.log("所有数据已清除");
        return {
            success: true,
            message: "所有数据已清除"
        };
    } catch (error) {
        return {
            success: false,
            message: `清除数据失败: ${error}`
        };
    }
}

// 获取存储统计信息
function getStorageStats() {
    try {
        const accounts = JSON.parse($persistentStore.read("warp_accounts") || "{}");
        const activeAccount = $persistentStore.read("warp_active_account") || "";
        const backupExists = !!$persistentStore.read("warp_backup");

        const accountCount = Object.keys(accounts).length;
        const bannedCount = Object.values(accounts).filter(acc =>
            acc.healthStatus === 'banned'
        ).length;

        return {
            success: true,
            stats: {
                totalAccounts: accountCount,
                activeAccount: activeAccount,
                bannedAccounts: bannedCount,
                healthyAccounts: accountCount - bannedCount,
                hasBackup: backupExists,
                lastBackup: backupExists ? "有备份" : "无备份"
            }
        };
    } catch (error) {
        return {
            success: false,
            message: `获取统计信息失败: ${error}`
        };
    }
}

// 设置管理
function getSettings() {
    try {
        const settings = JSON.parse($persistentStore.read("warp_settings") || "{}");
        return {
            success: true,
            settings: {
                autoRefresh: settings.autoRefresh !== false, // 默认true
                banDetection: settings.banDetection !== false, // 默认true
                healthCheck: settings.healthCheck !== false, // 默认true
                autoSwitch: settings.autoSwitch === true, // 默认false
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

function setSettings(newSettings) {
    try {
        const currentSettings = JSON.parse($persistentStore.read("warp_settings") || "{}");
        const updatedSettings = { ...currentSettings, ...newSettings };

        $persistentStore.write("warp_settings", JSON.stringify(updatedSettings));

        return {
            success: true,
            message: "设置已保存",
            settings: updatedSettings
        };
    } catch (error) {
        return {
            success: false,
            message: `保存设置失败: ${error}`
        };
    }
}

// 自动备份（每天）
function autoBackup() {
    const lastBackup = $persistentStore.read("warp_last_auto_backup");
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24小时

    if (!lastBackup || (now - parseInt(lastBackup)) > oneDay) {
        const backupResult = backupData();
        if (backupResult.success) {
            $persistentStore.write("warp_last_auto_backup", now.toString());
            console.log("自动备份完成");
        } else {
            console.log(`自动备份失败: ${backupResult.message}`);
        }
    }
}

// 初始化数据库
initDatabase();
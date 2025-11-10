/*
 * Warp Account Manager - Surge实现
 * 替代Python项目的核心功能
 */

// 配置
const CONFIG = {
    // Warp API配置
    WARP_API_KEY: "AIzaSyC7_n2YgtZIvc3h9YYn24HnGqNruGrbSW8",
    TOKEN_REFRESH_URL: "https://securetoken.googleapis.com/v1/token",

    // 存储键名
    STORAGE_KEYS: {
        ACCOUNTS: "warp_accounts",
        ACTIVE_ACCOUNT: "warp_active_account",
        USER_SETTINGS: "warp_user_settings",
        LAST_TOKEN_CHECK: "warp_last_token_check"
    },

    // 实验ID生成
    EXPERIMENT_ID_LENGTHS: [8, 4, 4, 4, 12]
};

// 初始化数据存储
function initializeStorage() {
    if (!$persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS)) {
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify({}));
        console.log("初始化账户存储");
    }

    if (!$persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT)) {
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
        console.log("初始化活跃账户存储");
    }
}

// 生成随机UUID格式实验ID
function generateExperimentId() {
    const hexDigits = '0123456789abcdef';
    const lengths = CONFIG.EXPERIMENT_ID_LENGTHS;

    let result = "";
    for (let i = 0; i < lengths.length; i++) {
        if (i > 0) result += "-";
        for (let j = 0; j < lengths[i]; j++) {
            result += hexDigits[Math.floor(Math.random() * hexDigits.length)];
        }
    }

    return result;
}

// 获取所有账户
function getAccounts() {
    const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS);
    return accountsData ? JSON.parse(accountsData) : {};
}

// 获取当前活跃账户
function getActiveAccount() {
    const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (!activeEmail) return null;

    const accounts = getAccounts();
    return accounts[activeEmail] || null;
}

// 添加新账户
function addAccount(accountData) {
    if (!accountData.email || !accountData.stsTokenManager) {
        return { success: false, message: "无效的账户数据结构" };
    }

    const accounts = getAccounts();
    accounts[accountData.email] = accountData;

    $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

    // 如果这是第一个账户，设为活跃账户
    if (Object.keys(accounts).length === 1) {
        setActiveAccount(accountData.email);
    }

    return { success: true, message: `账户 ${accountData.email} 已添加` };
}

// 设置活跃账户
function setActiveAccount(email) {
    if (!email) {
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
        return { success: false, message: "邮箱地址不能为空" };
    }

    const accounts = getAccounts();
    if (!accounts[email]) {
        return { success: false, message: "账户不存在" };
    }

    $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, email);
    return { success: true, message: `已切换到账户 ${email}` };
}

// 检查token是否需要刷新
function isTokenExpired(tokenData) {
    const currentTime = Date.now();
    const expiryTime = tokenData.expirationTime;

    // 提前5分钟刷新token
    return currentTime >= (expiryTime - 300000);
}

// 刷新token
function refreshToken(accountData) {
    return new Promise((resolve, reject) => {
        const refreshToken = accountData.stsTokenManager.refreshToken;
        const apiKey = accountData.apiKey || CONFIG.WARP_API_KEY;

        const requestData = {
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        };

        const postRequest = {
            url: `${CONFIG.TOKEN_REFRESH_URL}?key=${apiKey}`,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'WarpAccountManager/1.0'
            },
            body: JSON.stringify(requestData)
        };

        $httpClient.post(postRequest, (error, response, data) => {
            if (error) {
                console.log(`Token刷新失败: ${error}`);
                resolve({ success: false, error: error });
                return;
            }

            try {
                const tokenData = JSON.parse(data);
                if (tokenData.access_token) {
                    const newTokenData = {
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expirationTime: Date.now() + (tokenData.expires_in * 1000)
                    };

                    resolve({ success: true, tokenData: newTokenData });
                } else {
                    resolve({ success: false, error: "无效的token响应" });
                }
            } catch (parseError) {
                resolve({ success: false, error: `解析失败: ${parseError}` });
            }
        });
    });
}

// 更新账户token
async function updateAccountToken(email) {
    const accounts = getAccounts();
    const accountData = accounts[email];

    if (!accountData) {
        return { success: false, message: "账户不存在" };
    }

    // 检查是否需要刷新token
    if (!isTokenExpired(accountData.stsTokenManager)) {
        return { success: true, message: "Token仍然有效" };
    }

    console.log(`正在刷新 ${email} 的token...`);
    const refreshResult = await refreshToken(accountData);

    if (refreshResult.success) {
        accountData.stsTokenManager = {
            ...accountData.stsTokenManager,
            ...refreshResult.tokenData
        };

        accounts[email] = accountData;
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

        console.log(`${email} 的token已成功刷新`);
        return { success: true, message: "Token刷新成功" };
    } else {
        console.log(`${email} 的token刷新失败: ${refreshResult.error}`);
        return { success: false, message: `Token刷新失败: ${refreshResult.error}` };
    }
}

// 删除账户
function deleteAccount(email) {
    const accounts = getAccounts();
    if (!accounts[email]) {
        return { success: false, message: "账户不存在" };
    }

    delete accounts[email];
    $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

    // 如果删除的是活跃账户，清除活跃状态
    const activeAccount = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (activeAccount === email) {
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
    }

    return { success: true, message: `账户 ${email} 已删除` };
}

// 获取账户列表（用于UI显示）
function getAccountList() {
    const accounts = getAccounts();
    const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);

    return Object.keys(accounts).map(email => ({
        email,
        isActive: email === activeEmail,
        healthStatus: accounts[email].healthStatus || 'healthy',
        lastUpdated: accounts[email].lastUpdated || Date.now()
    }));
}

// 标记账户为ban状态
function markAccountAsBanned(email) {
    const accounts = getAccounts();
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
}

// 主请求处理函数
function handleRequest(request) {
    // 只处理Warp相关请求
    if (!request.url.includes('app.warp.dev')) {
        return request;
    }

    const activeAccount = getActiveAccount();
    if (!activeAccount) {
        console.log("没有活跃账户，跳过请求处理");
        return request;
    }

    // 检查并刷新token
    const email = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
    if (email && isTokenExpired(activeAccount.stsTokenManager)) {
        console.log("Token已过期，正在刷新...");
        updateAccountToken(email);
    }

    // 获取最新的活跃账户数据
    const currentActiveAccount = getActiveAccount();
    if (currentActiveAccount && currentActiveAccount.stsTokenManager.accessToken) {
        // 替换Authorization头
        request.headers['Authorization'] = `Bearer ${currentActiveAccount.stsTokenManager.accessToken}`;

        // 添加随机实验ID
        request.headers['X-Warp-Experiment-Id'] = generateExperimentId();

        console.log(`已为账户 ${email} 设置请求头`);
    }

    return request;
}

// 响应处理函数
function handleResponse(response, request) {
    // 检查403错误（可能是ban）
    if (response.status === 403 && request.url.includes('/ai/multi-agent')) {
        const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
        if (activeEmail) {
            markAccountAsBanned(activeEmail);
            console.log(`检测到403错误，账户 ${activeEmail} 可能已被ban`);
        }
    }

    // 处理用户设置缓存
    if (response.status === 200 && request.url.includes('GetUpdatedCloudObjects')) {
        try {
            const responseData = JSON.parse(response.body);
            $persistentStore.write(CONFIG.STORAGE_KEYS.USER_SETTINGS, JSON.stringify(responseData));
            console.log("用户设置已缓存");
        } catch (error) {
            console.log(`缓存用户设置失败: ${error}`);
        }
    }

    return response;
}

// 导出函数供Surge使用
if (typeof module !== 'undefined') {
    module.exports = {
        initializeStorage,
        addAccount,
        setActiveAccount,
        getActiveAccount,
        getAccountList,
        deleteAccount,
        updateAccountToken,
        handleRequest,
        handleResponse
    };
}
/*
 * Warp Account Manager - Box.js风格实现
 * 完全基于Surge的Web管理界面
 * 参考: https://github.com/chavyleung/scripts
 */

const CONFIG = {
    STORAGE_KEYS: {
        ACCOUNTS: "warp_accounts",
        ACTIVE_ACCOUNT: "warp_active_account",
        USER_SETTINGS: "warp_user_settings",
        NOTIFICATIONS: "warp_notifications"
    }
};

// Box.js风格的HTTP请求处理
function handleRequest(request, response) {
    const url = request.url || '/';
    const method = request.method || 'GET';

    // 处理根路径和子路径
    if (url === '/' || url.startsWith('/warp')) {
        response.status = 200;
        response.headers = {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        response.body = getManagerHTML();
        return response;
    }

    // 处理API请求
    if (url.startsWith('/api/')) {
        return handleAPIRequest(request, response);
    }

    // 处理静态资源
    if (url === '/style.css') {
        response.status = 200;
        response.headers = { 'Content-Type': 'text/css; charset=utf-8' };
        response.body = getCSS();
        return response;
    }

    if (url === '/script.js') {
        response.status = 200;
        response.headers = { 'Content-Type': 'application/javascript; charset=utf-8' };
        response.body = getJavaScript();
        return response;
    }

    // 默认返回管理页面
    response.status = 200;
    response.headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
    };
    response.body = getManagerHTML();
    return response;
}

// 处理API请求
function handleAPIRequest(request, response) {
    const url = request.url || '';
    const method = request.method || 'GET';
    const path = url.replace('/api', '');

    try {
        let result = { success: false, error: 'API not implemented' };

        // 账户管理API
        if (path === '/accounts') {
            if (method === 'GET') {
                result = getAccounts();
            } else if (method === 'POST') {
                const body = request.body || '{}';
                const accountData = JSON.parse(body);
                result = addAccount(accountData);
            }
        }

        // 获取活跃账户
        else if (path === '/active' && method === 'GET') {
            result = getActiveAccount();
        }

        // 切换账户
        else if (path === '/switch' && method === 'POST') {
            const body = request.body || '{}';
            const { email } = JSON.parse(body);
            result = switchAccount(email);
        }

        // 删除账户
        else if (path.startsWith('/delete/') && method === 'DELETE') {
            const email = decodeURIComponent(path.replace('/delete/', ''));
            result = deleteAccount(email);
        }

        // 统计信息
        else if (path === '/stats' && method === 'GET') {
            result = getStorageStats();
        }

        // 备份数据
        else if (path === '/backup' && method === 'GET') {
            result = createBackup();
        }

        // 恢复数据
        else if (path === '/restore' && method === 'POST') {
            const body = request.body || '{}';
            const { backupData } = JSON.parse(body);
            result = restoreData(backupData);
        }

        // 清除数据
        else if (path === '/clear' && method === 'DELETE') {
            result = clearAllData();
        }

        // 系统测试
        else if (path === '/test' && method === 'GET') {
            result = runSystemTest();
        }

        response.body = JSON.stringify(result, null, 2);
        response.headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };

        return response;
    } catch (error) {
        response.body = JSON.stringify({ success: false, error: error.message }, null, 2);
        response.headers = {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        return response;
    }
}

// 账户管理功能
function getAccounts() {
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

        return { success: true, data: accountList };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function addAccount(accountData) {
    try {
        if (!accountData.email || !accountData.stsTokenManager) {
            return { success: false, error: "无效的账户数据结构" };
        }

        const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
        const accounts = JSON.parse(accountsData);

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

        return { success: true, message: `账户 ${accountData.email} 已添加` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getActiveAccount() {
    try {
        const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT) || null;
        const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
        const accounts = JSON.parse(accountsData);

        const activeAccount = activeEmail && accounts[activeEmail] ? {
            email: activeEmail,
            ...accounts[activeEmail]
        } : null;

        return { success: true, data: activeAccount };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function switchAccount(email) {
    try {
        if (!email) {
            return { success: false, error: "邮箱地址不能为空" };
        }

        const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
        const accounts = JSON.parse(accountsData);

        if (!accounts[email]) {
            return { success: false, error: "账户不存在" };
        }

        $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, email);

        return { success: true, message: `已切换到账户 ${email}` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function deleteAccount(email) {
    try {
        const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
        const accounts = JSON.parse(accountsData);

        if (!accounts[email]) {
            return { success: false, error: "账户不存在" };
        }

        delete accounts[email];
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));

        // 如果删除的是活跃账户，清除活跃状态
        const activeEmail = $persistentStore.read(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT);
        if (activeEmail === email) {
            $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
        }

        return { success: true, message: `账户 ${email} 已删除` };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function getStorageStats() {
    try {
        const accountsData = $persistentStore.read(CONFIG.STORAGE_KEYS.ACCOUNTS) || "{}";
        const accounts = JSON.parse(accountsData);
        const accountCount = Object.keys(accounts).length;

        const bannedCount = Object.values(accounts).filter(acc =>
            acc.healthStatus === 'banned'
        ).length;

        const healthyCount = accountCount - bannedCount;
        const backupExists = !!$persistentStore.read("warp_backup");

        return {
            success: true,
            data: {
                totalAccounts: accountCount,
                healthyAccounts: healthyCount,
                bannedAccounts: bannedCount,
                hasBackup: backupExists
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function createBackup() {
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

        return { success: true, data: backupData };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function restoreData(backupData) {
    try {
        const data = typeof backupData === 'string' ? JSON.parse(backupData) : backupData;

        if (!data.version || !data.accounts) {
            return { success: false, error: "无效的备份数据格式" };
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

        return { success: true, message: "数据恢复成功" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function clearAllData() {
    try {
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACCOUNTS, JSON.stringify({}));
        $persistentStore.write(CONFIG.STORAGE_KEYS.ACTIVE_ACCOUNT, "");
        $persistentStore.write(CONFIG.STORAGE_KEYS.USER_SETTINGS, "");
        $persistentStore.write(CONFIG.STORAGE_KEYS.NOTIFICATIONS, "");

        return { success: true, message: "所有数据已清除" };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

function runSystemTest() {
    try {
        const accounts = getAccounts();
        const stats = getStorageStats();

        return {
            success: true,
            data: {
                accountManager: typeof accountManager !== 'undefined',
                persistenceManager: typeof persistenceManager !== 'undefined',
                accountsCount: accounts.success ? accounts.data.length : 0,
                storageStats: stats.success ? stats.data : null,
                systemStatus: "正常",
                timestamp: Date.now()
            }
        };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

// 生成管理界面HTML
function getManagerHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warp Account Manager - Surge实现</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>🚀 Warp Account Manager</h1>
            <p>完全基于Surge的Web管理界面 - Box.js风格实现</p>
        </header>

        <main class="main">
            <div class="alert alert-info">
                <strong>🎯 当前访问:</strong> 完全基于Surge脚本<br>
                <strong>⚡ 优势:</strong> 无需外部服务器，纯Surge实现<br>
                <strong>🔧 技术:</strong> URL Rewrite + Script 动态响应
            </div>

            <div id="messageContainer"></div>

            <div class="tabs">
                <div class="tab active" data-tab="accounts">👥 账户管理</div>
                <div class="tab" data-tab="stats">📊 统计信息</div>
                <div class="tab" data-tab="backup">💾 备份管理</div>
                <div class="tab" data-tab="tools">🔧 系统工具</div>
            </div>

            <div class="tab-content active" id="accounts-content">
                <div class="card">
                    <h3>➕ 添加账户</h3>
                    <div class="form-group">
                        <label for="accountEmail">邮箱</label>
                        <input type="email" id="accountEmail" placeholder="your-email@example.com">
                    </div>
                    <div class="form-group">
                        <label for="accessToken">Access Token</label>
                        <input type="text" id="accessToken" placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...">
                    </div>
                    <div class="form-group">
                        <label for="refreshToken">Refresh Token</label>
                        <input type="text" id="refreshToken" placeholder="AQB0h5m-7k8j9l2p3q4r5s6t7u8v9w0x">
                    </div>
                    <div class="form-group">
                        <label for="expirationTime">过期时间 (时间戳)</label>
                        <input type="number" id="expirationTime" placeholder="1704067200000">
                    </div>
                    <button class="btn btn-primary" onclick="addAccount()">添加账户</button>
                    <button class="btn btn-secondary" onclick="loadFromLocalStorage()">从LocalStorage加载</button>
                    <div id="addAccountResult"></div>
                </div>

                <div class="card">
                    <h3>👥 账户列表</h3>
                    <button class="btn btn-primary" onclick="loadAccounts()">刷新列表</button>
                    <div id="accountsList" class="loading">点击刷新查看账户列表...</div>
                </div>
            </div>

            <div class="tab-content" id="stats-content">
                <div class="card">
                    <h3>📊 存储统计</h3>
                    <button class="btn btn-primary" onclick="loadStats()">加载统计</button>
                    <div id="statsResult" class="loading">点击加载查看统计信息...</div>
                </div>
            </div>

            <div class="tab-content" id="backup-content">
                <div class="card">
                    <h3>💾 数据备份</h3>
                    <button class="btn btn-primary" onclick="createBackup()">创建备份</button>
                    <div id="backupResult"></div>
                </div>

                <div class="card">
                    <h3>📥 数据恢复</h3>
                    <textarea id="backupData" placeholder="粘贴备份数据..." rows="8"></textarea>
                    <button class="btn btn-primary" onclick="restoreData()">恢复数据</button>
                    <div id="restoreResult"></div>
                </div>
            </div>

            <div class="tab-content" id="tools-content">
                <div class="card">
                    <h3>🔧 系统测试</h3>
                    <button class="btn btn-primary" onclick="runTest()">运行测试</button>
                    <div id="testResult" class="loading">点击运行系统测试...</div>
                </div>

                <div class="card">
                    <h3>🗑️ 数据管理</h3>
                    <button class="btn btn-danger" onclick="clearAllData()">清除所有数据</button>
                    <div id="clearResult"></div>
                </div>
            </div>
        </main>
    </div>

    <script src="/script.js"></script>
</body>
</html>`;
}

// 生成CSS样式
function getCSS() {
    return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    padding: 20px;
    line-height: 1.6;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #007aff 0%, #5856d6 100%);
    color: white;
    padding: 30px;
    text-align: center;
}

.header h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
}

.main {
    padding: 30px;
}

.alert {
    background: #e3f2fd;
    border: 1px solid #bbdefb;
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    color: #1565c0;
    border-left: 4px solid #2196f3;
}

.alert-info {
    background: #e8f5e8;
    border-color: #c3e6c3;
    color: #2e7d32;
    border-left-color: #4caf50;
}

.alert-success {
    background: #e3f2fd;
    border-color: #bbdefb;
    color: #1565c0;
    border-left-color: #2196f3;
}

.alert-error {
    background: #ffebee;
    border-color: #ffcdd2;
    color: #c62828;
    border-left-color: #f44336;
}

.tabs {
    display: flex;
    background: #f5f5f7;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.tab {
    flex: 1;
    min-width: 120px;
    padding: 12px 20px;
    text-align: center;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.3s;
    font-weight: 500;
    font-size: 14px;
}

.tab:hover {
    background: rgba(0, 122, 255, 0.1);
}

.tab.active {
    background: #007aff;
    color: white;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
}

.tab-content {
    display: none;
}

.tab-content.active {
    display: block;
    animation: fadeIn 0.3s;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

.card {
    background: white;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
    border: 1px solid #e1e1e1;
}

.card h3 {
    color: #1d1d1f;
    margin-bottom: 20px;
    font-size: 1.3em;
    display: flex;
    align-items: center;
    gap: 10px;
}

.form-group {
    margin-bottom: 20px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 600;
    color: #1d1d1f;
}

input, textarea, select {
    width: 100%;
    padding: 12px;
    border: 2px solid #e1e1e1;
    border-radius: 8px;
    font-size: 14px;
    transition: border-color 0.3s;
    background: #fafafa;
    font-family: inherit;
}

input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #007aff;
    background: white;
}

.btn {
    background: #007aff;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.3s;
    margin-right: 10px;
    margin-bottom: 10px;
}

.btn:hover {
    background: #0051d5;
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 122, 255, 0.3);
}

.btn-secondary {
    background: #5856d6;
}

.btn-secondary:hover {
    background: #434190;
}

.btn-danger {
    background: #ff3b30;
}

.btn-danger:hover {
    background: #d70015;
}

.loading {
    color: #666;
    font-style: italic;
    padding: 20px;
    text-align: center;
}

.account-item {
    background: white;
    border: 2px solid #e1e1e1;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 15px;
    transition: all 0.3s;
}

.account-item:hover {
    border-color: #007aff;
    transform: translateY(-2px);
}

.account-item.active {
    border-color: #34c759;
    background: #f0fff4;
}

.account-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.account-email {
    font-weight: 600;
    color: #1d1d1f;
}

.status {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.status.healthy {
    background: #d4edda;
    color: #155724;
}

.status.banned {
    background: #f8d7da;
    color: #721c24;
}

.account-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.account-actions .btn {
    font-size: 12px;
    padding: 8px 16px;
    margin: 0;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
}

.stat-card {
    background: white;
    border: 2px solid #e1e1e1;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    transition: all 0.3s;
}

.stat-card:hover {
    border-color: #007aff;
    transform: translateY(-2px);
}

.stat-number {
    font-size: 2.5em;
    font-weight: bold;
    color: #007aff;
    margin-bottom: 5px;
}

.stat-label {
    color: #666;
    font-size: 14px;
    font-weight: 500;
}

@media (max-width: 768px) {
    .container {
        margin: 10px;
        border-radius: 8px;
    }

    .header {
        padding: 20px;
    }

    .header h1 {
        font-size: 2em;
    }

    .main {
        padding: 20px;
    }

    .tabs {
        flex-direction: column;
    }

    .tab {
        margin-bottom: 2px;
    }

    .account-actions {
        flex-direction: column;
    }

    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}
`;
}

// 生成JavaScript代码
function getJavaScript() {
    return `
// Warp Account Manager JavaScript
class WarpManager {
    constructor() {
        this.apiBase = '/api';
        this.init();
    }

    init() {
        // 初始化标签页
        this.initTabs();

        // 绑定事件
        this.bindEvents();

        // 显示欢迎消息
        this.showMessage('欢迎使用Warp Account Manager！完全基于Surge实现。', 'success');
    }

    initTabs() {
        const tabs = document.querySelectorAll('.tab');
        const contents = document.querySelectorAll('.tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const targetTab = e.target.dataset.tab;

                // 移除所有活动状态
                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                // 添加活动状态
                e.target.classList.add('active');
                document.getElementById(targetTab + '-content').classList.add('active');
            });
        });
    }

    bindEvents() {
        // 绑定键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.addAccount();
            }
        });
    }

    showMessage(message, type = 'info', duration = 5000) {
        const container = document.getElementById('messageContainer');
        const alertClass = type === 'error' ? 'alert-error' :
                          type === 'success' ? 'alert-success' : 'alert-info';

        const alertDiv = document.createElement('div');
        alertDiv.className = alertClass;
        alertDiv.textContent = message;

        container.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.remove();
        }, duration);
    }

    showLoading(elementId, message = '加载中...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.className = 'loading';
            element.textContent = message;
        }
    }

    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.className = '';
        }
    }

    async apiRequest(method, endpoint, data = null) {
        try {
            const options = {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                }
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const response = await fetch(this.apiBase + endpoint, options);
            const result = await response.json();

            return result;
        } catch (error) {
            console.error('API请求失败:', error);
            return { success: false, error: error.message };
        }
    }

    async addAccount() {
        const email = document.getElementById('accountEmail').value.trim();
        const accessToken = document.getElementById('accessToken').value.trim();
        const refreshToken = document.getElementById('refreshToken').value.trim();
        const expirationTime = document.getElementById('expirationTime').value.trim();

        if (!email || !accessToken || !refreshToken || !expirationTime) {
            this.showMessage('请填写所有必需字段', 'error');
            return;
        }

        const accountData = {
            email: email,
            stsTokenManager: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expirationTime: parseInt(expirationTime)
            }
        };

        this.showLoading('addAccountResult', '添加中...');

        try {
            const result = await this.apiRequest('POST', '/accounts', accountData);

            if (result.success) {
                this.showMessage(result.message, 'success');
                // 清空表单
                document.getElementById('accountEmail').value = '';
                document.getElementById('accessToken').value = '';
                document.getElementById('refreshToken').value = '';
                document.getElementById('expirationTime').value = '';
                // 刷新账户列表
                this.loadAccounts();
            } else {
                this.showMessage('添加失败: ' + (result.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.showMessage('网络错误: ' + error.message, 'error');
        }

        this.hideLoading('addAccountResult');
    }

    async loadFromLocalStorage() {
        try {
            // 模拟从LocalStorage获取数据
            const mockData = {
                email: 'example@warp.dev',
                stsTokenManager: {
                    accessToken: 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...',
                    refreshToken: 'AQB0h5m-7k8j9l2p3q4r5s6t7u8v9w0x',
                    expirationTime: Date.now() + 3600000
                }
            };

            document.getElementById('accountEmail').value = mockData.email;
            document.getElementById('accessToken').value = mockData.stsTokenManager.accessToken;
            document.getElementById('refreshToken').value = mockData.stsTokenManager.refreshToken;
            document.getElementById('expirationTime').value = mockData.stsTokenManager.expirationTime;

            this.showMessage('已加载示例数据，请替换为真实数据', 'info');
        } catch (error) {
            this.showMessage('加载数据失败: ' + error.message, 'error');
        }
    }

    async loadAccounts() {
        this.showLoading('accountsList', '加载账户列表...');

        try {
            const result = await this.apiRequest('GET', '/accounts');

            if (result.success) {
                this.displayAccounts(result.data || []);
            } else {
                document.getElementById('accountsList').innerHTML =
                    '<div class="loading">加载失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('accountsList').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    displayAccounts(accounts) {
        const container = document.getElementById('accountsList');

        if (accounts.length === 0) {
            container.innerHTML = '<div class="loading">暂无账户，请先添加账户</div>';
            return;
        }

        const html = accounts.map(account => \`
            <div class="account-item \${account.isActive ? 'active' : ''}">
                <div class="account-header">
                    <div class="account-email">\${account.email}</div>
                    <span class="status \${account.healthStatus}">\${account.healthStatus}</span>
                </div>
                <div style="margin-bottom: 15px;">
                    <small>最后更新: \${new Date(account.lastUpdated).toLocaleString()}</small>
                </div>
                <div class="account-actions">
                    \${!account.isActive ?
                        \`<button class="btn" onclick="warpManager.switchAccount('\${account.email}')">设为活跃</button>\` :
                        '<span style="color: #34c759; font-weight: 600;">✅ 当前活跃</span>'
                    }
                    <button class="btn btn-danger" onclick="warpManager.deleteAccount('\${account.email}')">删除</button>
                </div>
            </div>
        \`).join('');

        container.innerHTML = html;
    }

    async switchAccount(email) {
        if (!confirm(\`确定要切换到账户 \${email} 吗？\`)) return;

        try {
            const result = await this.apiRequest('POST', '/switch', { email });

            if (result.success) {
                this.showMessage(result.message, 'success');
                this.loadAccounts();
            } else {
                this.showMessage('切换失败: ' + (result.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.showMessage('网络错误: ' + error.message, 'error');
        }
    }

    async deleteAccount(email) {
        if (!confirm(\`确定要删除账户 \${email} 吗？此操作不可恢复！\`)) return;

        try {
            const result = await this.apiRequest('DELETE', \`/delete/\${encodeURIComponent(email)}\`);

            if (result.success) {
                this.showMessage(result.message, 'success');
                this.loadAccounts();
            } else {
                this.showMessage('删除失败: ' + (result.error || '未知错误'), 'error');
            }
        } catch (error) {
            this.showMessage('网络错误: ' + error.message, 'error');
        }
    }

    async loadStats() {
        this.showLoading('statsResult', '加载统计信息...');

        try {
            const result = await this.apiRequest('GET', '/stats');

            if (result.success) {
                this.displayStats(result.data || {});
            } else {
                document.getElementById('statsResult').innerHTML =
                    '<div class="loading">加载失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('statsResult').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    displayStats(stats) {
        const html = \`
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-number">\${stats.totalAccounts || 0}</div>
                    <div class="stat-label">总账户数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.healthyAccounts || 0}</div>
                    <div class="stat-label">健康账户</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.bannedAccounts || 0}</div>
                    <div class="stat-label">被封账户</div>
                </div>
                <div class="stat-card">
                    <div class="stat-number">\${stats.hasBackup ? '有' : '无'}</div>
                    <div class="stat-label">备份状态</div>
                </div>
            </div>
        \`;

        document.getElementById('statsResult').innerHTML = html;
    }

    async createBackup() {
        try {
            const result = await this.apiRequest('GET', '/backup');

            if (result.success) {
                const backupData = JSON.stringify(result.data, null, 2);
                document.getElementById('backupResult').innerHTML = \`
                    <div style="margin-top: 15px;">
                        <p style="margin-bottom: 10px; color: #666;">备份数据：</p>
                        <textarea readonly rows="10" style="font-family: monospace; font-size: 12px;">\${backupData}</textarea>
                        <div style="margin-top: 10px;">
                            <button class="btn btn-secondary" onclick="warpManager.copyToClipboard('\${btoa(backupData)}')">复制到剪贴板</button>
                        </div>
                    </div>
                \`;
                this.showMessage('备份创建成功！', 'success');
            } else {
                document.getElementById('backupResult').innerHTML =
                    '<div class="loading">备份失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('backupResult').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    async restoreData() {
        const backupData = document.getElementById('backupData').value.trim();
        if (!backupData) {
            this.showMessage('请输入备份数据', 'error');
            return;
        }

        if (!confirm('确定要恢复数据吗？当前数据将被覆盖！')) return;

        try {
            const result = await this.apiRequest('POST', '/restore', { backupData });

            if (result.success) {
                this.showMessage(result.message, 'success');
                document.getElementById('backupData').value = '';
                this.loadAccounts();
                this.loadStats();
            } else {
                document.getElementById('restoreResult').innerHTML =
                    '<div class="loading">恢复失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('restoreResult').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    async runTest() {
        this.showLoading('testResult', '运行系统测试...');

        try {
            const result = await this.apiRequest('GET', '/test');

            if (result.success) {
                const html = \`
                    <div style="font-family: monospace; font-size: 12px; line-height: 1.6;">
                        <h4>系统测试结果:</h4>
                        <p>✅ 系统状态: \${result.data.systemStatus}</p>
                        <p>📱 账户管理器: \${result.data.accountManager ? '已加载' : '未加载'}</p>
                        <p>💾 持久化管理器: \${result.data.persistenceManager ? '已加载' : '未加载'}</p>
                        <p>👥 账户数量: \${result.data.accountsCount}</p>
                        <p>⏰ 测试时间: \${new Date(result.data.timestamp).toLocaleString()}</p>
                    </div>
                \`;
                document.getElementById('testResult').innerHTML = html;
                this.showMessage('系统测试完成！', 'success');
            } else {
                document.getElementById('testResult').innerHTML =
                    '<div class="loading">测试失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('testResult').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    async clearAllData() {
        if (!confirm('确定要清除所有数据吗？此操作不可恢复！\\n\\n建议先备份数据。')) {
            return;
        }

        if (!confirm('再次确认：真的要清除所有账户数据、设置和备份吗？')) {
            return;
        }

        try {
            const result = await this.apiRequest('DELETE', '/clear');

            if (result.success) {
                this.showMessage(result.message, 'success');
                this.loadAccounts();
                this.loadStats();
                document.getElementById('clearResult').innerHTML =
                    '<div style="color: #2e7d32; margin-top: 10px;">✅ ' + result.message + '</div>';
            } else {
                document.getElementById('clearResult').innerHTML =
                    '<div class="loading">清除失败: ' + (result.error || '未知错误') + '</div>';
            }
        } catch (error) {
            document.getElementById('clearResult').innerHTML =
                '<div class="loading">网络错误: ' + error.message + '</div>';
        }
    }

    copyToClipboard(base64Text) {
        try {
            const text = atob(base64Text);
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('已复制到剪贴板', 'success');
            }).catch(() => {
                this.showMessage('复制失败，请手动复制', 'error');
            });
        } catch (error) {
            this.showMessage('复制失败: ' + error.message, 'error');
        }
    }
}

// 初始化应用
const warpManager = new WarpManager();
`;
}

// 导出处理函数
if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest,
        getManagerHTML,
        getCSS,
        getJavaScript
    };
}

console.log('🌐 Warp Account Manager Box.js风格实现已加载');
console.log('📱 访问地址: http://warp.local');
console.log('🔧 技术实现: 完全基于Surge的URL Rewrite + Script');
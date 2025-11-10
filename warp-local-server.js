/*
 * Warp Local Server - 直接通过warp.local访问管理界面
 * 使用Surge脚本动态生成HTML响应
 */

// 完整的管理界面HTML
const MANAGER_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warp Account Manager - 管理后台</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
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
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .main { padding: 30px; }
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
        .tab:hover { background: rgba(0, 122, 255, 0.1); }
        .tab.active {
            background: #007aff;
            color: white;
            box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; animation: fadeIn 0.3s; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
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
        .form-group { margin-bottom: 20px; }
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
        textarea {
            height: 120px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            resize: vertical;
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
            display: inline-block;
            text-decoration: none;
            user-select: none;
        }
        .btn:hover {
            background: #0051d5;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 122, 255, 0.3);
        }
        .btn:active { transform: translateY(0); }
        .btn.secondary { background: #5856d6; }
        .btn.secondary:hover { background: #434190; }
        .btn.danger { background: #ff3b30; }
        .btn.danger:hover { background: #d70015; }
        .btn.success { background: #34c759; }
        .btn.success:hover { background: #28a745; }
        .btn:disabled {
            background: #ccc;
            cursor: not-allowed;
            transform: none;
            box-shadow: none;
        }
        .result {
            background: #f8f9fa;
            border: 1px solid #e1e1e1;
            border-radius: 8px;
            padding: 20px;
            margin-top: 15px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            max-height: 400px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-break: break-all;
        }
        .account-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
        }
        .account-card {
            background: white;
            border: 2px solid #e1e1e1;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s;
            position: relative;
        }
        .account-card:hover {
            border-color: #007aff;
            transform: translateY(-2px);
            box-shadow: 0 8px 16px rgba(0, 122, 255, 0.1);
        }
        .account-card.active {
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
            word-break: break-all;
            margin-right: 10px;
        }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.banned { background: #f8d7da; color: #721c24; }
        .status.unhealthy { background: #fff3cd; color: #856404; }
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
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007aff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
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
        .alert.success {
            background: #e8f5e8;
            border-color: #c3e6c3;
            color: #2e7d32;
            border-left-color: #4caf50;
        }
        .alert.error {
            background: #ffebee;
            border-color: #ffcdd2;
            color: #c62828;
            border-left-color: #f44336;
        }
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #666;
        }
        .empty-state h3 {
            margin-bottom: 10px;
            font-size: 1.5em;
            color: #999;
        }
        .empty-state p {
            font-size: 1.1em;
            line-height: 1.6;
        }
        .account-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .account-actions .btn {
            font-size: 12px;
            padding: 8px 16px;
            margin: 0;
        }
        .command-output {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            margin-top: 10px;
            border: 1px solid #444;
        }
        .command-copy {
            float: right;
            background: #007aff;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }
        .command-copy:hover { background: #0051d5; }

        @media (max-width: 768px) {
            .container { margin: 10px; border-radius: 8px; }
            .header { padding: 20px; }
            .header h1 { font-size: 2em; }
            .main { padding: 20px; }
            .tabs { flex-direction: column; }
            .tab { margin-bottom: 2px; }
            .account-grid { grid-template-columns: 1fr; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Warp Account Manager</h1>
            <p>本地管理后台 - 通过warp.local直接访问</p>
        </div>

        <div class="main">
            <div class="alert">
                <strong>🎯 当前访问方式:</strong> http://warp.local<br>
                <strong>⚡ 优势:</strong> 无需下载文件，直接在浏览器中管理Warp账户<br>
                <strong>🔧 技术支持:</strong> 基于Surge脚本动态生成响应
            </div>

            <div id="messageContainer"></div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab('accounts')">👥 账户管理</div>
                <div class="tab" onclick="switchTab('stats')">📊 统计信息</div>
                <div class="tab" onclick="switchTab('backup')">💾 备份管理</div>
                <div class="tab" onclick="switchTab('tools')">🔧 系统工具</div>
                <div class="tab" onclick="switchTab('help')">📖 使用帮助</div>
            </div>

            <!-- 账户管理 -->
            <div id="accounts" class="tab-content active">
                <div class="card">
                    <h3>➕ 添加新账户</h3>
                    <div class="form-group">
                        <label for="accountData">账户数据 (JSON格式)</label>
                        <textarea id="accountData" placeholder='{
  "email": "your-email@example.com",
  "stsTokenManager": {
    "accessToken": "your_access_token",
    "refreshToken": "your_refresh_token",
    "expirationTime": 1234567890000
  }
}'></textarea>
                    </div>
                    <button class="btn" onclick="addAccount()">
                        <span id="addAccountLoading"></span>添加账户
                    </button>
                    <button class="btn secondary" onclick="loadAccountExample()">加载示例</button>
                    <button class="btn secondary" onclick="validateAccountData()">验证格式</button>
                    <div id="addAccountCommand"></div>
                </div>

                <div class="card">
                    <h3>👥 账户列表</h3>
                    <button class="btn" onclick="loadAccounts()">
                        <span id="accountLoading"></span>查看账户
                    </button>
                    <button class="btn secondary" onclick="switchAccountDialog()">切换账户</button>
                    <button class="btn secondary" onclick="deleteAccountDialog()">删除账户</button>
                    <div id="accountList" class="command-output"></div>
                </div>
            </div>

            <!-- 统计信息 -->
            <div id="stats" class="tab-content">
                <div class="card">
                    <h3>📊 存储统计</h3>
                    <button class="btn" onclick="loadStats()">
                        <span id="statsLoading"></span>查看统计
                    </button>
                    <div id="statsCommand"></div>
                </div>

                <div class="card">
                    <h3>🔄 Token刷新统计</h3>
                    <button class="btn" onclick="loadRefreshStats()">查看刷新统计</button>
                    <div id="refreshStatsCommand"></div>
                </div>
            </div>

            <!-- 备份管理 -->
            <div id="backup" class="tab-content">
                <div class="card">
                    <h3>💾 数据备份</h3>
                    <button class="btn success" onclick="backupData()">
                        <span id="backupLoading"></span>创建备份
                    </button>
                    <div id="backupCommand"></div>
                </div>

                <div class="card">
                    <h3>📥 数据恢复</h3>
                    <div class="form-group">
                        <label for="restoreData">备份数据</label>
                        <textarea id="restoreData" placeholder="粘贴之前备份的JSON数据"></textarea>
                    </div>
                    <button class="btn success" onclick="restoreData()">恢复数据</button>
                    <div id="restoreCommand"></div>
                </div>
            </div>

            <!-- 系统工具 -->
            <div id="tools" class="tab-content">
                <div class="card">
                    <h3>🔧 系统测试</h3>
                    <button class="btn" onclick="testSystem()">
                        <span id="testLoading"></span>运行系统测试
                    </button>
                    <div id="testCommand"></div>
                </div>

                <div class="card">
                    <h3>⚙️ 系统设置</h3>
                    <button class="btn" onclick="loadSettings()">查看设置</button>
                    <div id="settingsCommand"></div>
                </div>

                <div class="card">
                    <h3>🗑️ 数据管理</h3>
                    <button class="btn danger" onclick="clearAllData()">清除所有数据</button>
                    <div id="clearCommand"></div>
                </div>
            </div>

            <!-- 使用帮助 -->
            <div id="help" class="tab-content">
                <div class="card">
                    <h3>📖 使用方法</h3>
                    <h4>1. 获取账户数据</h4>
                    <ul>
                        <li>登录 https://app.warp.dev</li>
                        <li>按F12打开开发者工具</li>
                        <li>Application → Local Storage → app.warp.dev</li>
                        <li>复制包含email和stsTokenManager的数据</li>
                    </ul>

                    <h4>2. 添加账户</h4>
                    <p>在"账户管理"标签页粘贴数据，点击"添加账户"按钮</p>

                    <h4>3. 管理账户</h4>
                    <p>使用相应的按钮查看、切换或删除账户</p>
                </div>

                <div class="card">
                    <h3>⚡ 快速命令参考</h3>
                    <div style="font-family: monospace; font-size: 12px; line-height: 1.6;">
                        <strong>账户管理:</strong><br>
                        • accountManager.getAccountList()<br>
                        • accountManager.setActiveAccount("email")<br>
                        • accountManager.getActiveAccount()<br><br>
                        <strong>数据管理:</strong><br>
                        • persistenceManager.backupData()<br>
                        • persistenceManager.getStorageStats()<br>
                        • persistenceManager.clearAllData()
                    </div>
                </div>

                <div class="card">
                    <h3>🛠️ 故障排除</h3>
                    <p><strong>命令未执行:</strong> 确保Surge模块已启用并重启</p>
                    <p><strong>数据丢失:</strong> 检查持久存储权限</p>
                    <p><strong>Token过期:</strong> 重新获取账户数据</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 全局配置
        const CONFIG = {
            API_BASE: '/api',
            WARP_LOCAL: 'warp.local'
        };

        // 初始化页面
        document.addEventListener('DOMContentLoaded', function() {
            showMessage('欢迎使用Warp Account Manager! 直接在浏览器中管理您的Warp账户。', 'success');

            // 自动检测当前访问方式
            if (window.location.hostname === CONFIG.WARP_LOCAL) {
                showMessage('✅ 已通过 warp.local 成功访问！', 'success');
            }
        });

        // 切换标签页
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        // 显示消息
        function showMessage(message, type = 'info', duration = 5000) {
            const container = document.getElementById('messageContainer');
            const alertClass = type === 'error' ? 'alert error' : type === 'success' ? 'alert success' : 'alert';

            const alertDiv = document.createElement('div');
            alertDiv.className = alertClass;
            alertDiv.textContent = message;

            container.appendChild(alertDiv);

            setTimeout(() => {
                alertDiv.remove();
            }, duration);
        }

        // 显示加载状态
        function setLoading(elementId, show = true) {
            const element = document.getElementById(elementId);
            if (element) {
                element.innerHTML = show ? '<span class="loading"></span> ' : '';
            }
        }

        // 显示命令
        function showCommand(elementId, command, description = '') {
            const element = document.getElementById(elementId);
            if (!element) return;

            const html = \`
                <div style="margin-top: 15px;">
                    \${description ? \`<p style="margin-bottom: 10px; color: #666;">\${description}</p>\` : ''}
                    <div class="command-output">
                        <button class="command-copy" onclick="copyToClipboard('\`btoa(command)\`')">复制</button>
                        <div>\${command}</div>
                    </div>
                </div>
            \`;
            element.innerHTML = html;
        }

        // 验证账户数据格式
        function validateAccountData() {
            const accountData = document.getElementById('accountData').value;
            if (!accountData.trim()) {
                showMessage('请输入账户数据', 'error');
                return false;
            }

            try {
                const data = JSON.parse(accountData);

                if (!data.email) {
                    throw new Error('缺少email字段');
                }

                if (!data.stsTokenManager) {
                    throw new Error('缺少stsTokenManager字段');
                }

                if (!data.stsTokenManager.accessToken) {
                    throw new Error('缺少accessToken字段');
                }

                if (!data.stsTokenManager.refreshToken) {
                    throw new Error('缺少refreshToken字段');
                }

                if (!data.stsTokenManager.expirationTime) {
                    throw new Error('缺少expirationTime字段');
                }

                showMessage('账户数据格式验证通过！', 'success');
                return true;
            } catch (error) {
                showMessage('JSON格式错误: ' + error.message, 'error');
                return false;
            }
        }

        // 添加账户
        function addAccount() {
            if (!validateAccountData()) {
                return;
            }

            setLoading('addAccountLoading', true);

            try {
                const accountData = JSON.parse(document.getElementById('accountData').value);
                const command = \`accountManager.addAccount(\${JSON.stringify(accountData, null, 2)})\`;

                showCommand('addAccountCommand', command, '请在Surge控制台中执行以下命令来添加账户：');

                // 自动复制到剪贴板
                copyToClipboard(btoa(command));
                showMessage('命令已生成并复制到剪贴板，请在Surge控制台中执行', 'success');

                // 清空输入框
                document.getElementById('accountData').value = '';
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            } finally {
                setLoading('addAccountLoading', false);
            }
        }

        // 加载账户列表
        function loadAccounts() {
            setLoading('accountLoading', true);

            try {
                const command = 'accountManager.getAccountList()';
                showCommand('accountList', command, '请在Surge控制台中执行以下命令查看账户列表：');

                copyToClipboard(btoa(command));
                showMessage('命令已复制到剪贴板，请在Surge控制台中执行', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            } finally {
                setLoading('accountLoading', false);
            }
        }

        // 切换账户对话框
        function switchAccountDialog() {
            const email = prompt('请输入要切换到的账户邮箱:');
            if (!email) return;

            try {
                const command = \`accountManager.setActiveAccount("\${email}")\`;
                showCommand('accountList', command, '请在Surge控制台中执行以下命令来切换账户：');

                copyToClipboard(btoa(command));
                showMessage('切换命令已生成并复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 删除账户对话框
        function deleteAccountDialog() {
            const email = prompt('请输入要删除的账户邮箱:');
            if (!email) return;

            try {
                const command = \`accountManager.deleteAccount("\${email}")\`;
                showCommand('accountList', command, '请在Surge控制台中执行以下命令来删除账户：');

                copyToClipboard(btoa(command));
                showMessage('删除命令已生成并复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 加载统计
        function loadStats() {
            setLoading('statsLoading', true);

            try {
                const command = 'persistenceManager.getStorageStats()';
                showCommand('statsCommand', command, '请在Surge控制台中执行以下命令查看统计信息：');

                copyToClipboard(btoa(command));
                showMessage('统计命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            } finally {
                setLoading('statsLoading', false);
            }
        }

        // 加载刷新统计
        function loadRefreshStats() {
            try {
                const commands = [
                    '// 查看Token刷新统计',
                    'const notifications = JSON.parse($persistentStore.read("warp_notifications") || "[]");',
                    'const refreshNotifies = notifications.filter(n => n.type === "token_refresh");',
                    'console.log("24小时内Token刷新次数:", refreshNotifies.length);',
                    'console.log("成功次数:", refreshNotifies.filter(n => n.success).length);',
                    'console.log("失败次数:", refreshNotifies.filter(n => !n.success).length);'
                ];

                showCommand('refreshStatsCommand', commands.join('\\n'), '请在Surge控制台中执行以下命令查看Token刷新统计：');

                copyToClipboard(btoa(commands.join('\\n')));
                showMessage('统计命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 备份数据
        function backupData() {
            setLoading('backupLoading', true);

            try {
                const command = 'persistenceManager.backupData()';
                showCommand('backupCommand', command, '请在Surge控制台中执行以下命令来备份数据：');

                copyToClipboard(btoa(command));
                showMessage('备份命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            } finally {
                setLoading('backupLoading', false);
            }
        }

        // 恢复数据
        function restoreData() {
            const backupString = document.getElementById('restoreData').value;
            if (!backupString.trim()) {
                showMessage('请输入备份数据', 'error');
                return;
            }

            try {
                const command = \`persistenceManager.restoreData(\`\${backupString}\`)\`;
                showCommand('restoreCommand', command, '请在Surge控制台中执行以下命令来恢复数据：');

                copyToClipboard(btoa(command));
                showMessage('恢复命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 系统测试
        function testSystem() {
            setLoading('testLoading', true);

            try {
                const commands = [
                    '// Warp Account Manager 系统测试',
                    'console.log("=== 系统测试开始 ===");',
                    '',
                    '// 1. 检查模块加载状态',
                    'console.log("账户管理器:", typeof accountManager !== "undefined" ? "已加载" : "未加载");',
                    'console.log("持久化管理器:", typeof persistenceManager !== "undefined" ? "已加载" : "未加载");',
                    '',
                    '// 2. 检查数据存储',
                    'const accounts = accountManager.getAccountList();',
                    'console.log("账户数量:", accounts.length);',
                    '',
                    '// 3. 检查存储统计',
                    'const stats = persistenceManager.getStorageStats();',
                    'console.log("存储统计:", stats);',
                    '',
                    'console.log("=== 系统测试完成 ===");'
                ];

                showCommand('testCommand', commands.join('\\n'), '请在Surge控制台中执行以下命令进行系统测试：');

                copyToClipboard(btoa(commands.join('\\n')));
                showMessage('测试命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            } finally {
                setLoading('testLoading', false);
            }
        }

        // 加载设置
        function loadSettings() {
            try {
                const command = 'persistenceManager.getSettings()';
                showCommand('settingsCommand', command, '请在Surge控制台中执行以下命令查看系统设置：');

                copyToClipboard(btoa(command));
                showMessage('设置命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 清除所有数据
        function clearAllData() {
            if (!confirm('确定要清除所有数据吗？此操作不可恢复！\\n\\n建议先备份数据。')) {
                return;
            }

            if (!confirm('再次确认：真的要清除所有账户数据、设置和备份吗？')) {
                return;
            }

            try {
                const command = 'persistenceManager.clearAllData()';
                showCommand('clearCommand', command, '请在Surge控制台中执行以下命令来清除所有数据：');

                copyToClipboard(btoa(command));
                showMessage('清除命令已复制到剪贴板', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 加载账户示例
        function loadAccountExample() {
            const example = {
                email: "example@warp.dev",
                stsTokenManager: {
                    accessToken: "example_access_token_here",
                    refreshToken: "example_refresh_token_here",
                    expirationTime: Date.now() + 3600000
                }
            };
            document.getElementById('accountData').value = JSON.stringify(example, null, 2);
            showMessage('已加载示例数据，请替换为真实数据', 'info');
        }

        // 复制到剪贴板（使用base64编码避免特殊字符问题）
        function copyToClipboard(base64Text) {
            try {
                const text = atob(base64Text);
                navigator.clipboard.writeText(text).then(() => {
                    console.log('命令已复制到剪贴板');
                }).catch(() => {
                    console.log('复制失败，请手动复制');
                });
            } catch (error) {
                console.log('复制过程出错:', error);
            }
        }

        // 处理键盘快捷键
        document.addEventListener('keydown', function(e) {
            // Ctrl+Enter 执行添加账户
            if (e.ctrlKey && e.key === 'Enter') {
                const activeTab = document.querySelector('.tab-content.active');
                if (activeTab && activeTab.id === 'accounts') {
                    addAccount();
                }
            }
        });

        console.log('🚀 Warp Account Manager 已加载');
        console.log('📱 当前访问方式: warp.local');
        console.log('🔧 技术支持: 基于Surge脚本动态响应');
    </script>
</body>
</html>`;

// Surge脚本中的请求处理函数
function handleRequest(request, response) {
    // 设置响应头
    response.headers = {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    // 返回管理界面HTML
    response.status = 200;
    response.body = MANAGER_HTML;

    return response;
}

// 导出处理函数
if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest,
        MANAGER_HTML
    };
}

console.log('🌐 Warp Local Server 已加载');
console.log('📱 访问地址: http://warp.local');
console.log('🚀 现在可以直接通过域名访问管理界面！');
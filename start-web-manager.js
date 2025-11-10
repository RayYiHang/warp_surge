/*
 * Warp Web管理界面启动脚本
 * 在本地启动一个简单的HTTP服务器来托管管理界面
 */

const PORT = 8080;
const HOST = '127.0.0.1';

// 创建简单的HTTP服务器响应
function createHTTPResponse(statusCode, contentType, body) {
    return {
        status: statusCode,
        headers: {
            'Content-Type': contentType,
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        },
        body: body
    };
}

// 获取管理界面HTML
function getManagerHTML() {
    return `<!DOCTYPE html>
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
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .main { padding: 30px; }
        .alert {
            background: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            color: #1565c0;
            border-left: 4px solid #2196f3;
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
        }
        .btn.secondary { background: #5856d6; }
        .btn.danger { background: #ff3b30; }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #1d1d1f;
        }
        textarea {
            width: 100%;
            height: 120px;
            padding: 12px;
            border: 2px solid #e1e1e1;
            border-radius: 8px;
            font-size: 12px;
            font-family: 'Monaco', 'Courier New', monospace;
            resize: vertical;
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
        }
        .account-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 20px;
        }
        .account-card {
            background: white;
            border: 2px solid #e1e1e1;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.3s;
        }
        .account-card.active { border-color: #34c759; background: #f0fff4; }
        .account-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .account-email { font-weight: 600; color: #1d1d1f; word-break: break-all; }
        .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        .status.healthy { background: #d4edda; color: #155724; }
        .status.banned { background: #f8d7da; color: #721c24; }
        .account-actions { display: flex; gap: 8px; flex-wrap: wrap; }
        .account-actions .btn { font-size: 12px; padding: 8px 16px; margin: 0; }
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        .tabs { display: flex; background: #f5f5f7; border-radius: 8px; padding: 4px; margin-bottom: 30px; }
        .tab {
            flex: 1;
            padding: 12px 20px;
            text-align: center;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.3s;
            font-weight: 500;
        }
        .tab.active {
            background: #007aff;
            color: white;
        }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Warp Account Manager</h1>
            <p>本地管理后台 - 基于Surge脚本</p>
        </div>

        <div class="main">
            <div class="alert">
                <strong>📍 当前访问方式:</strong> 直接通过Surge脚本管理<br>
                <strong>🔧 管理方式:</strong> Surge控制台 → 脚本编辑器
            </div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab('accounts')">👥 账户管理</div>
                <div class="tab" onclick="switchTab('tools')">🔧 快速工具</div>
                <div class="tab" onclick="switchTab('help')">📖 使用帮助</div>
            </div>

            <!-- 账户管理 -->
            <div id="accounts" class="tab-content active">
                <div class="card">
                    <h3>👥 账户操作</h3>
                    <div class="form-group">
                        <label for="accountData">账户数据 (JSON格式)</label>
                        <textarea id="accountData" placeholder='{
  "email": "your-email@example.com",
  "stsTokenManager": {
    "accessToken": "...",
    "refreshToken": "...",
    "expirationTime": 1234567890000
  }
}'></textarea>
                    </div>
                    <button class="btn" onclick="addAccount()">添加账户</button>
                    <button class="btn secondary" onclick="loadAccounts()">查看账户</button>
                    <button class="btn secondary" onclick="switchAccount()">切换账户</button>
                    <div id="accountList" class="result">点击"查看账户"显示账户列表</div>
                </div>
            </div>

            <!-- 快速工具 -->
            <div id="tools" class="tab-content">
                <div class="card">
                    <h3>🔧 快速操作</h3>
                    <button class="btn" onclick="testSystem()">测试系统</button>
                    <button class="btn secondary" onclick="backupData()">备份数据</button>
                    <button class="btn secondary" onclick="getStats()">查看统计</button>
                    <div id="toolResult" class="result">点击按钮执行操作</div>
                </div>

                <div class="card">
                    <h3>📋 常用命令</h3>
                    <div class="form-group">
                        <label>添加账户命令</label>
                        <textarea readonly>accountManager.addAccount({
  "email": "your-email@example.com",
  "stsTokenManager": {
    "accessToken": "...",
    "refreshToken": "...",
    "expirationTime": 1234567890000
  }
})</textarea>
                    </div>
                    <button class="btn secondary" onclick="copyToClipboard(this.previousElementSibling.value)">复制命令</button>
                </div>
            </div>

            <!-- 使用帮助 -->
            <div id="help" class="tab-content">
                <div class="card">
                    <h3>📖 使用方法</h3>
                    <h4>1. 添加账户</h4>
                    <p>从Chrome开发者工具获取账户数据，然后在"账户管理"标签页添加。</p>

                    <h4>2. 管理账户</h4>
                    <p>使用提供的命令或直接在Surge控制台执行相应的函数。</p>

                    <h4>3. 获取账户数据</h4>
                    <ul>
                        <li>登录 https://app.warp.dev</li>
                        <li>按F12打开开发者工具</li>
                        <li>Application → Local Storage → app.warp.dev</li>
                        <li>复制包含email和stsTokenManager的数据</li>
                    </ul>
                </div>

                <div class="card">
                    <h3>⚡ 常用函数</h3>
                    <ul>
                        <li><code>accountManager.getAccountList()</code> - 获取账户列表</li>
                        <li><code>accountManager.setActiveAccount("email")</code> - 切换活跃账户</li>
                        <li><code>accountManager.getActiveAccount()</code> - 获取当前活跃账户</li>
                        <li><code>persistenceManager.backupData()</code> - 备份数据</li>
                        <li><code>persistenceManager.getStorageStats()</code> - 获取统计信息</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 切换标签页
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        // 添加账户
        function addAccount() {
            const accountData = document.getElementById('accountData').value;
            if (!accountData.trim()) {
                alert('请输入账户数据');
                return;
            }

            try {
                const data = JSON.parse(accountData);
                const command = `accountManager.addAccount(${JSON.stringify(data)})`;
                showResult('accountList', \`执行命令: \${command}\\n\\n请在Surge控制台中执行此命令\`);
                copyToClipboard(command);
                alert('命令已复制到剪贴板，请在Surge控制台中执行');
            } catch (error) {
                alert('JSON格式错误: ' + error.message);
            }
        }

        // 查看账户
        function loadAccounts() {
            const command = 'accountManager.getAccountList()';
            showResult('accountList', \`执行命令: \${command}\\n\\n请在Surge控制台中执行此命令查看账户列表\`);
            copyToClipboard(command);
        }

        // 切换账户
        function switchAccount() {
            const email = prompt('请输入要切换到的账户邮箱:');
            if (!email) return;

            const command = `accountManager.setActiveAccount("${email}")`;
            showResult('accountList', \`执行命令: \${command}\\n\\n请在Surge控制台中执行此命令\`);
            copyToClipboard(command);
        }

        // 测试系统
        function testSystem() {
            const commands = [
                'console.log("系统状态:", accountManager ? "正常" : "未加载");',
                'const accounts = accountManager.getAccountList();',
                'console.log("账户数量:", accounts.length);',
                'const stats = persistenceManager.getStorageStats();',
                'console.log("统计信息:", stats);'
            ];

            showResult('toolResult', '请在Surge控制台中依次执行以下命令:\\n\\n' + commands.join('\\n'));
            copyToClipboard(commands.join('\\n'));
        }

        // 备份数据
        function backupData() {
            const command = 'persistenceManager.backupData()';
            showResult('toolResult', \`执行命令: \${command}\\n\\n请在Surge控制台中执行此命令\`);
            copyToClipboard(command);
        }

        // 获取统计
        function getStats() {
            const command = 'persistenceManager.getStorageStats()';
            showResult('toolResult', \`执行命令: \${command}\\n\\n请在Surge控制台中执行此命令\`);
            copyToClipboard(command);
        }

        // 显示结果
        function showResult(elementId, text) {
            document.getElementById(elementId).textContent = text;
        }

        // 复制到剪贴板
        function copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                console.log('命令已复制到剪贴板');
            }).catch(() => {
                console.log('复制失败，请手动复制');
            });
        }

        // 自动加载
        window.addEventListener('load', function() {
            console.log('Warp Account Manager 管理界面已加载');
            console.log('请在Surge控制台中使用相关命令管理账户');
        });
    </script>
</body>
</html>`;
}

// Surge脚本中的HTTP处理函数
function handleRequest(request, response) {
    const url = request.url || '/';
    const method = request.method || 'GET';

    // 处理根路径请求
    if (url === '/' || url === '/index.html') {
        response.body = getManagerHTML();
        response.status = 200;
        response.headers = {
            'Content-Type': 'text/html; charset=utf-8',
            'Access-Control-Allow-Origin': '*'
        };
        return response;
    }

    // API请求处理
    if (url.startsWith('/api/')) {
        // 这里可以添加API处理逻辑
        return handleAPIRequest(request, response);
    }

    // 404处理
    response.status = 404;
    response.body = JSON.stringify({ error: 'Not Found' });
    response.headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    };
    return response;
}

// API请求处理
function handleAPIRequest(request, response) {
    const url = request.url || '';
    const method = request.method || 'GET';
    const path = url.replace('/api', '');

    // 根据路径处理不同的API请求
    try {
        // 这里可以调用相应的Surge脚本函数
        let result = { error: 'API not implemented' };

        switch (method + path) {
            case 'GET/accounts':
                // 调用账户列表获取函数
                result = { success: true, message: '请在Surge控制台执行: accountManager.getAccountList()' };
                break;
            case 'POST/accounts':
                // 调用添加账户函数
                result = { success: true, message: '请在Surge控制台执行: accountManager.addAccount(data)' };
                break;
            default:
                result = { error: 'API endpoint not found' };
        }

        response.body = JSON.stringify(result);
        response.status = result.error ? 404 : 200;
        response.headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        };
    } catch (error) {
        response.body = JSON.stringify({ error: error.message });
        response.status = 500;
        response.headers = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        };
    }

    return response;
}

// 导出处理函数
if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest,
        getManagerHTML
    };
}

console.log('🌐 Warp Web管理界面启动脚本已加载');
console.log('📱 访问方式: 在浏览器中打开本地HTML文件');
console.log('🔧 管理方式: Surge控制台 → 脚本编辑器');
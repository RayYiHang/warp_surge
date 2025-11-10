/*
 * Warp Account Manager - 简化版Box.js实现
 * 专注于快速响应，避免超时
 */

// 简化的配置
const CONFIG = {
    STORAGE_KEYS: {
        ACCOUNTS: "warp_accounts"
    }
};

// 简化的HTML模板
function getSimpleHTML() {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Warp Account Manager</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #f5f5f7; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center; }
        .card { background: white; padding: 25px; border-radius: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .btn { background: #007AFF; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; }
        .btn:hover { background: #0056b3; }
        .status { padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 500; }
        .status-success { background: #d4edda; color: #155724; }
        .status-info { background: #d1ecf1; color: #0c5460; }
        .accounts { margin-top: 20px; }
        .account-item { background: #f8f9fa; padding: 15px; margin-bottom: 10px; border-radius: 8px; border-left: 4px solid #007AFF; }
        .alert { padding: 15px; border-radius: 8px; margin-bottom: 20px; }
        .alert-info { background: #e3f2fd; border-left: 4px solid #2196F3; color: #1976D2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Warp Account Manager</h1>
            <p>完全基于Surge的Web管理界面</p>
        </div>

        <div class="alert alert-info">
            <strong>🎯 当前访问:</strong> http://warpmanager.com<br>
            <strong>⚡ 优势:</strong> Box.js标准实现，MITM拦截处理<br>
            <strong>🔧 技术:</strong> 简化版脚本，避免超时问题
        </div>

        <div class="card">
            <h2>📊 账户总览</h2>
            <div id="accountOverview">
                <p>正在加载账户数据...</p>
            </div>
            <button class="btn" onclick="loadAccounts()">刷新账户列表</button>
        </div>

        <div class="card">
            <h2>➕ 添加账户</h2>
            <p>在浏览器中访问 <code>app.warp.dev</code> 并登录，然后使用浏览器开发者工具获取账户信息。</p>
            <button class="btn" onclick="showAddAccount()">添加新账户</button>
        </div>

        <div class="card accounts">
            <h2>📋 账户列表</h2>
            <div id="accountList">
                <p>暂无账户数据</p>
            </div>
        </div>
    </div>

    <script>
        // 简化的JavaScript功能
        function loadAccounts() {
            const accounts = localStorage.getItem('warp_accounts') || '[]';
            try {
                const accountData = JSON.parse(accounts);
                displayAccounts(accountData);
            } catch (e) {
                document.getElementById('accountList').innerHTML = '<p>账户数据加载失败</p>';
            }
        }

        function displayAccounts(accounts) {
            const listContainer = document.getElementById('accountList');
            const overviewContainer = document.getElementById('accountOverview');

            if (accounts.length === 0) {
                listContainer.innerHTML = '<p>暂无账户数据</p>';
                overviewContainer.innerHTML = '<p>账户数量: 0</p>';
                return;
            }

            overviewContainer.innerHTML = `<p>账户数量: ${accounts.length}</p>`;

            let html = '';
            accounts.forEach((account, index) => {
                html += \`
                    <div class="account-item">
                        <strong>账户 \${index + 1}</strong><br>
                        邮箱: \${account.email || '未设置'}<br>
                        状态: <span class="status status-success">正常</span>
                    </div>
                \`;
            });

            listContainer.innerHTML = html;
        }

        function showAddAccount() {
            alert('请先在 app.warp.dev 登录，然后使用浏览器扩展获取账户信息');
        }

        // 页面加载时自动加载账户
        window.onload = function() {
            loadAccounts();
        };
    </script>
</body>
</html>`;
}

// 主处理函数
function handleRequest(request, response) {
    const url = request.url || '/';
    const method = request.method || 'GET';

    // 快速检测是否为warpmanager.com请求
    if (!url.includes('warpmanager.com')) {
        return;
    }

    try {
        // 处理OPTIONS预检请求
        if (method === 'OPTIONS') {
            response.status = 200;
            response.headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            };
            return;
        }

        // 处理GET请求 - 立即返回简化HTML
        if (method === 'GET') {
            response.status = 200;
            response.headers = {
                'Content-Type': 'text/html; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            };
            response.body = getSimpleHTML();
            return;
        }

        // 处理POST请求 - 简单的API响应
        if (method === 'POST') {
            response.status = 200;
            response.headers = {
                'Content-Type': 'application/json; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            };
            response.body = JSON.stringify({
                success: true,
                message: '操作成功'
            });
            return;
        }

    } catch (error) {
        console.error('Script error:', error);
        // 即使出错也要快速返回
        response.status = 200;
        response.headers = {
            'Content-Type': 'text/html; charset=utf-8'
        };
        response.body = '<html><body><h1>Warp Manager</h1><p>Simple version loaded</p></body></html>';
        return;
    }
}

// 对于Surge脚本，需要导出处理函数
if (typeof $request !== 'undefined') {
    const response = {};
    handleRequest($request, response);
    $done(response);
} else {
    console.log('Warp Manager Simple Script Loaded');
}
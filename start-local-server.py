#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Warp Account Manager 本地HTTP服务器
直接在本地启动HTTP服务器托管管理界面
"""

import http.server
import socketserver
import webbrowser
import os
import sys
from pathlib import Path

# 配置
PORT = 8080
HOST = '127.0.0.1'

class WarpHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(Path(__file__).parent), **kwargs)

    def do_GET(self):
        # 处理根路径请求
        if self.path == '/' or self.path == '/index.html':
            self.path = '/warp-local.html'
            return super().do_GET()

        # 处理其他文件请求
        return super().do_GET()

    def log_message(self, format, *args):
        # 简化日志输出
        print(f"📝 {self.address_string()} - {format % args}")

def create_warp_local_html():
    """创建warp-local.html文件"""
    html_content = '''<!DOCTYPE html>
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
            display: flex;
            align-items: center;
            gap: 10px;
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
        .command-output {
            background: #1e1e1e;
            color: #d4d4d4;
            border-radius: 8px;
            padding: 15px;
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            margin-top: 10px;
            border: 1px solid #444;
            position: relative;
        }
        .command-copy {
            position: absolute;
            top: 10px;
            right: 10px;
            background: #007aff;
            color: white;
            border: none;
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 11px;
        }
        .command-copy:hover { background: #0051d5; }
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
        .tab.active { background: #007aff; color: white; }
        .tab-content { display: none; }
        .tab-content.active { display: block; }
        .success-message {
            background: #e8f5e8;
            border: 1px solid #c3e6c3;
            color: #2e7d32;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .error-message {
            background: #ffebee;
            border: 1px solid #ffcdd2;
            color: #c62828;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Warp Account Manager</h1>
            <p>本地管理后台 - 简单易用的Warp账户管理工具</p>
        </div>

        <div class="main">
            <div class="alert">
                <strong>🎯 当前访问方式:</strong> 本地HTTP服务器<br>
                <strong>⚡ 优势:</strong> 无需复杂配置，直接访问<br>
                <strong>🔧 端口:</strong> <span id="currentPort">8080</span>
            </div>

            <div id="messageContainer"></div>

            <div class="tabs">
                <div class="tab active" onclick="switchTab('accounts')">👥 账户管理</div>
                <div class="tab" onclick="switchTab('tools')">🔧 工具箱</div>
                <div class="tab" onclick="switchTab('help')">📖 帮助</div>
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
                    <button class="btn" onclick="addAccount()">添加账户</button>
                    <button class="btn secondary" onclick="loadAccountExample()">加载示例</button>
                    <button class="btn secondary" onclick="validateAccountData()">验证格式</button>
                    <div id="addAccountCommand"></div>
                </div>

                <div class="card">
                    <h3>👥 账户操作</h3>
                    <button class="btn" onclick="loadAccounts()">查看账户列表</button>
                    <button class="btn secondary" onclick="switchAccount()">切换活跃账户</button>
                    <button class="btn secondary" onclick="deleteAccount()">删除账户</button>
                    <div id="accountList" class="command-output"></div>
                </div>
            </div>

            <!-- 工具箱 -->
            <div id="tools" class="tab-content">
                <div class="card">
                    <h3>🔧 系统工具</h3>
                    <button class="btn" onclick="testSystem()">系统测试</button>
                    <button class="btn secondary" onclick="backupData()">备份数据</button>
                    <button class="btn secondary" onclick="getStats()">查看统计</button>
                    <div id="toolResult" class="command-output"></div>
                </div>

                <div class="card">
                    <h3>📋 常用命令</h3>
                    <div style="font-family: monospace; font-size: 12px; line-height: 1.8;">
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
            </div>

            <!-- 帮助 -->
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

                    <h4>2. 使用此界面</h4>
                    <ul>
                        <li>在"账户管理"标签页粘贴数据</li>
                        <li>点击"添加账户"生成命令</li>
                        <li>复制命令到Surge控制台执行</li>
                    </ul>
                </div>

                <div class="card">
                    <h3>🛠️ 故障排除</h3>
                    <p><strong>命令未执行:</strong> 确保Surge模块已启用</p>
                    <p><strong>数据格式错误:</strong> 检查JSON格式是否正确</p>
                    <p><strong>Token过期:</strong> 重新获取账户数据</p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // 初始化页面
        document.addEventListener('DOMContentLoaded', function() {
            const port = window.location.port || '8080';
            document.getElementById('currentPort').textContent = port;
            showMessage('欢迎使用Warp Account Manager! 现在可以方便地管理您的Warp账户了。', 'success');
        });

        // 切换标签页
        function switchTab(tabName) {
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

            event.target.classList.add('active');
            document.getElementById(tabName).classList.add('active');
        }

        // 显示消息
        function showMessage(message, type = 'info') {
            const container = document.getElementById('messageContainer');
            const messageClass = type === 'error' ? 'error-message' : 'success-message';

            const messageDiv = document.createElement('div');
            messageDiv.className = messageClass;
            messageDiv.textContent = message;

            container.appendChild(messageDiv);

            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }

        // 显示命令
        function showCommand(elementId, command, description = '') {
            const element = document.getElementById(elementId);
            if (!element) return;

            const html = \`
                <div style="margin-top: 15px;">
                    \${description ? \`<p style="margin-bottom: 10px; color: #666;">\${description}</p>\` : ''}
                    <div class="command-output">
                        <button class="command-copy" onclick="copyCommand(this)">复制</button>
                        <div>\${command}</div>
                    </div>
                </div>
            \`;
            element.innerHTML = html;
        }

        // 复制命令
        function copyCommand(button) {
            const commandDiv = button.nextElementSibling;
            const command = commandDiv.textContent;

            navigator.clipboard.writeText(command).then(() => {
                button.textContent = '已复制!';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            }).catch(() => {
                // 降级方案
                const textArea = document.createElement('textarea');
                textArea.value = command;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                button.textContent = '已复制!';
                setTimeout(() => {
                    button.textContent = '复制';
                }, 2000);
            });
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

            try {
                const accountData = JSON.parse(document.getElementById('accountData').value);
                const command = \`accountManager.addAccount(\${JSON.stringify(accountData, null, 2)})\`;

                showCommand('addAccountCommand', command, '请在Surge控制台中执行以下命令来添加账户：');
                showMessage('命令已生成！请复制到Surge控制台执行', 'success');

                // 清空输入框
                document.getElementById('accountData').value = '';
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 加载账户列表
        function loadAccounts() {
            const command = 'accountManager.getAccountList()';
            showCommand('accountList', command, '请在Surge控制台中执行以下命令查看账户列表：');
            showMessage('命令已生成！请复制到Surge控制台执行', 'success');
        }

        // 切换账户
        function switchAccount() {
            const email = prompt('请输入要切换到的账户邮箱:');
            if (!email) return;

            try {
                const command = \`accountManager.setActiveAccount("\${email}")\`;
                showCommand('accountList', command, '请在Surge控制台中执行以下命令来切换账户：');
                showMessage('切换命令已生成！', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 删除账户
        function deleteAccount() {
            const email = prompt('请输入要删除的账户邮箱:');
            if (!email) return;

            try {
                const command = \`accountManager.deleteAccount("\${email}")\`;
                showCommand('accountList', command, '请在Surge控制台中执行以下命令来删除账户：');
                showMessage('删除命令已生成！', 'success');
            } catch (error) {
                showMessage('生成命令失败: ' + error.message, 'error');
            }
        }

        // 系统测试
        function testSystem() {
            const commands = [
                '// Warp Account Manager 系统测试',
                'console.log("=== 系统测试开始 ===");',
                'const accounts = accountManager.getAccountList();',
                'console.log("账户数量:", accounts.length);',
                'const stats = persistenceManager.getStorageStats();',
                'console.log("存储统计:", stats);',
                'console.log("=== 系统测试完成 ===");'
            ];

            showCommand('toolResult', commands.join('\\n'), '请在Surge控制台中执行以下命令进行系统测试：');
            showMessage('测试命令已生成！', 'success');
        }

        // 备份数据
        function backupData() {
            const command = 'persistenceManager.backupData()';
            showCommand('toolResult', command, '请在Surge控制台中执行以下命令来备份数据：');
            showMessage('备份命令已生成！', 'success');
        }

        // 查看统计
        function getStats() {
            const command = 'persistenceManager.getStorageStats()';
            showCommand('toolResult', command, '请在Surge控制台中执行以下命令查看统计：');
            showMessage('统计命令已生成！', 'success');
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
    </script>
</body>
</html>'''

    return html_content

def main():
    print("🚀 启动Warp Account Manager本地服务器...")

    # 创建HTML文件
    html_file = Path(__file__).parent / "warp-local.html"
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(create_warp_local_html())

    print(f"📝 已创建管理界面文件: {html_file}")

    # 启动HTTP服务器
    try:
        with socketserver.TCPServer((HOST, PORT), WarpHTTPRequestHandler) as httpd:
            server_url = f"http://{HOST}:{PORT}"

            print(f"🌐 服务器已启动: {server_url}")
            print(f"📱 管理界面: {server_url}/warp-local.html")
            print("🛑 按 Ctrl+C 停止服务器")
            print()

            # 自动打开浏览器
            try:
                webbrowser.open(f"{server_url}/warp-local.html")
                print("✅ 已自动打开浏览器")
            except:
                print("⚠️  无法自动打开浏览器，请手动访问上述地址")

            # 启动服务器
            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 服务器已停止")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ 端口 {PORT} 已被占用，请尝试其他端口")
            print(f"💡 解决方案: python {__file__} --port 8081")
        else:
            print(f"❌ 启动失败: {e}")
    except Exception as e:
        print(f"❌ 未知错误: {e}")

if __name__ == "__main__":
    # 支持命令行参数指定端口
    if len(sys.argv) > 1 and sys.argv[1] == "--port":
        try:
            PORT = int(sys.argv[2])
        except (IndexError, ValueError):
            print("❌ 端口参数错误，使用默认端口 8080")
            PORT = 8080

    main()
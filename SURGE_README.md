# Warp Account Manager - Surge版本

基于Surge的Warp.dev账户管理器，完全替代Python项目实现相同功能。

## 功能对比

### ✅ 完全实现的Python项目功能

| Python功能 | Surge实现 | 说明 |
|-----------|----------|------|
| 账户管理 | ✅ | SQLite → Surge Persistent Storage |
| 代理拦截 | ✅ | Mitmproxy → Surge Script |
| Token刷新 | ✅ | 自动token检测和刷新 |
| Chrome扩展 | ⚠️ | 需要手动导入账户数据 |
| 跨平台代理 | ✅ | Surge原生支持 |
| 健康监控 | ✅ | 403/401错误检测 |
| UI界面 | ⚠️ | 简化的命令行界面 |

## 安装步骤

### 1. 安装Surge模块
将 `warp-account-manager.sgmodule` 添加到Surge模块列表。

### 2. 部署脚本文件
将以下JS文件放到Surge脚本目录：
- `warp_manager.js` - 核心管理功能
- `warp_persistence.js` - 数据持久化
- `warp_token_refresh.js` - 自动token刷新
- `warp_response_handler.js` - 响应处理

### 3. 启用MitM
在Surge中启用MitM并添加域名：
```
hostname = app.warp.dev, dataplane.rudderstack.com, securetoken.googleapis.com
```

## 使用方法

### 添加账户

#### 方法1: 手动导入（推荐）
从Chrome开发者工具获取账户数据：
```json
{
  "email": "your-email@example.com",
  "stsTokenManager": {
    "accessToken": "...",
    "refreshToken": "...",
    "expirationTime": 1234567890000
  },
  "apiKey": "AIzaSy..."
}
```

#### 方法2: 使用浏览器扩展
需要开发简单的浏览器扩展来捕获账户数据。

### 切换活跃账户
```javascript
// 在Surge脚本中调用
accountManager.setActiveAccount("your-email@example.com");
```

### 查看账户状态
```javascript
// 获取账户列表
const accounts = accountManager.getAccountList();
console.log(accounts);
```

## 核心脚本说明

### warp_manager.js
- 账户数据管理
- 请求拦截和修改
- Token自动刷新
- 实验ID生成

### warp_persistence.js
- 数据持久化存储
- 备份和恢复
- 设置管理
- 存储统计

### warp_token_refresh.js
- 定期检查token状态
- 自动刷新过期token
- 刷新统计和通知

### warp_response_handler.js
- API响应分析
- 账户状态检测
- 用户设置缓存
- 错误通知

## 配置选项

```javascript
const CONFIG = {
    // Token刷新阈值（提前5分钟）
    TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000,

    // 自动刷新间隔（5分钟检查一次）
    REFRESH_INTERVAL: 5 * 60 * 1000,

    // 缓存过期时间（30分钟）
    CACHE_EXPIRY: 30 * 60 * 1000,

    // 是否启用自动切换
    AUTO_SWITCH_ENABLED: false
};
```

## 数据存储结构

```
warp_accounts = {
    "email@example.com": {
        "email": "email@example.com",
        "stsTokenManager": {
            "accessToken": "...",
            "refreshToken": "...",
            "expirationTime": 1234567890000
        },
        "healthStatus": "healthy",
        "lastUpdated": 1234567890000
    }
}

warp_active_account = "email@example.com"

warp_settings = {
    "autoRefresh": true,
    "banDetection": true,
    "healthCheck": true
}
```

## API命令

### 账户管理
```javascript
// 添加账户
accountManager.addAccount(accountData);

// 切换账户
accountManager.setActiveAccount("email@example.com");

// 删除账户
accountManager.deleteAccount("email@example.com");

// 获取账户列表
accountManager.getAccountList();
```

### 数据管理
```javascript
// 备份数据
persistenceManager.backupData();

// 恢复数据
persistenceManager.restoreData(backupString);

// 获取统计信息
persistenceManager.getStorageStats();
```

### Token管理
```javascript
// 强制刷新所有token
tokenRefreshService.forceRefreshAll();

// 获取刷新统计
tokenRefreshService.getRefreshStats();
```

## 故障排除

### 1. Token刷新失败
- 检查网络连接
- 验证refreshToken有效性
- 查看控制台错误日志

### 2. 账户被误判为ban
- 手动设置健康状态
- 检查API响应内容
- 调整ban检测规则

### 3. 数据丢失
- 使用备份恢复功能
- 检查持久存储权限
- 重新初始化数据库

## 性能优化

1. **减少网络请求**
   - 启用用户设置缓存
   - 批量token刷新
   - 智能请求去重

2. **内存优化**
   - 限制缓存大小
   - 定期清理通知
   - 压缩存储数据

3. **网络优化**
   - 并行token刷新
   - 失败重试机制
   - 连接池管理

## 安全考虑

1. **数据加密**
   - 敏感数据本地存储
   - 定期清理过期数据
   - 最小权限原则

2. **访问控制**
   - 仅处理Warp域名
   - 请求头验证
   - 异常流量检测

## 更新日志

### v1.0.0
- 完整移植Python项目功能
- Surge脚本架构设计
- 基础账户管理实现
- 自动token刷新
- 响应处理和状态检测

## 支持与反馈

如有问题或建议，请：
1. 检查控制台日志
2. 查看存储统计数据
3. 提交详细错误报告

---

**注意**: 此版本完全基于Surge实现，无需Python环境或额外依赖。
# 🔧 Surge模块安装修复指南

## ❌ 常见的模块安装问题

### 问题1: 模块显示"无效"
**原因**: 通常是由于以下原因：
- URL路径错误
- 模块格式问题
- Surge版本兼容性
- 网络连接问题

### 问题2: 脚本无法加载
**原因**:
- 文件路径不正确
- GitHub Raw链接访问限制
- 脚本语法错误

## 🚀 解决方案

### 方案1: 使用简化版本 (推荐)

**步骤1**: 先安装简化版本测试基本功能
```
https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-account-manager-simple.sgmodule
```

**步骤2**: 测试访问
```
http://warp.local
```

**步骤3**: 如果成功，再安装完整版本
```
https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-account-manager-fixed.sgmodule
```

### 方案2: 本地文件安装

**步骤1**: 下载模块文件到本地
```bash
# 创建本地文件夹
mkdir -p ~/warp-surge
cd ~/warp-surge

# 下载模块文件
curl -o warp-account-manager.sgmodule https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-account-manager-simple.sgmodule
```

**步骤2**: 本地路径安装
```
file:///Users/你的用户名/warp-surge/warp-account-manager.sgmodule
```

**步骤3**: 修改脚本路径为本地路径
```bash
# 编辑模块文件
nano ~/warp-surge/warp-account-manager.sgmodule
```

将 `script-path` 中的 GitHub链接改为：
```
script-path=file:///Users/你的用户名/warp-surge/warp-box.js
```

### 方案3: 手动创建模块

**步骤1**: 创建模块文件
```bash
# 创建模块文件
touch ~/warp-surge/warp-account-manager.sgmodule
```

**步骤2**: 添加基本配置
```bash
cat > ~/warp-surge/warp-account-manager.sgmodule << 'EOF'
#!name=Warp Account Manager
#!desc=Warp.dev账户管理器
#!author=RayYiHang

[Script]
warp-box-server = type=http-request,pattern=^http://warp\.local,script-path=warp-box.js

[Rule]
URL-REGEX:(http|https)://warp\.local/?.* - REJECT

[Host]
127.0.0.1 warp.local

[URL Rewrite]
^https?://warp\.local - REJECT-200

[MITM]
hostname = app.warp.dev, dataplane.rudderstack.com, securetoken.googleapis.com
EOF
```

**步骤3**: 下载脚本文件
```bash
curl -o ~/warp-surge/warp-box.js https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-box.js
```

## 🔍 诊断步骤

### 第一步: 检查模块文件
1. 复制模块链接到浏览器
2. 查看文件是否存在
3. 检查文件格式是否正确

### 第二步: 检查Surge配置
1. 确认Surge版本 >= 4.0
2. 检查网络连接
3. 确认HTTPS解密已启用

### 第三步: 测试基础功能
1. 安装简化版本
2. 尝试访问 http://warp.local
3. 查看Surge日志

## 📋 完整的安装步骤

### 推荐方案

**1. 先用简化版本测试**
```bash
# 复制这个链接到Surge
https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-account-manager-simple.sgmodule
```

**2. 安装模块**
- Surge → 模块管理 → 添加模块
- 粘贴链接 → 确定

**3. 启用MitM**
- Surge → 设置 → HTTPS解密 → 开启MitM
- 添加主机名：`app.warp.dev, dataplane.rudderstack.com, securetoken.googleapis.com`

**4. 测试访问**
```
http://warp.local
```

**5. 如果成功，升级到完整版本**
```bash
# 移除简化版本
# 添加完整版本
https://raw.githubusercontent.com/RayYiHang/warp_surge/refs/heads/main/warp-account-manager-fixed.sgmodule
```

## 🛠️ 常见问题解决

### Q: 显示"URL-REGEX语法错误"
**A**: 你的Surge版本不支持URL-REGEX，使用简化版本

### Q: 脚本路径404错误
**A**: GitHub Raw链接可能被墙，使用本地文件方案

### Q: 模块安装成功但无法访问
**A**: 检查Host配置是否正确

### Q: 脚本执行错误
**A**: 查看Surge控制台的错误信息

## 🎯 最终建议

**如果你是第一次使用**:
1. 使用简化版本 (`warp-account-manager-simple.sgmodule`)
2. 测试基本功能是否正常
3. 确认warp.local可以访问
4. 再考虑升级到完整版本

**如果你需要完整功能**:
1. 使用本地文件方案，避免网络问题
2. 手动创建模块，确保所有路径正确
3. 逐步测试每个功能

## 📞 技术支持

如果仍然有问题：

1. **检查Surge日志**
   - 查看控制台错误信息
   - 确认模块是否正确加载

2. **验证网络连接**
   - 测试GitHub访问
   - 尝试其他Raw文件链接

3. **确认系统兼容性**
   - 检查Surge版本
   - 确认系统平台支持

4. **寻求帮助**
   - GitHub Issues
   - Surge官方文档

现在先试试简化版本，看看能否正常工作！
# 桶装水送水记录系统 🚰

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/water-delivery-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-orange)](https://workers.cloudflare.com/)

一个基于 Cloudflare Workers 和 KV 存储的现代化桶装水送水记录管理系统。采用无服务器架构，支持全球部署，提供实时数据同步和响应式用户界面。


## 📸 项目截图



<img width="1064" height="781" alt="image" src="https://github.com/user-attachments/assets/30034b1a-35e4-485e-8864-362e636b9500" />

<img width="1064" height="736" alt="image" src="https://github.com/user-attachments/assets/9a230ced-35d0-4a5e-903d-b1fce1115af8" />

## ✨ 功能特性

### 核心功能
- 📝 **智能记录**：记录每日送水数量（普通水和农夫山泉）
- 🪣 **自动计算**：实时计算和更新空桶存量
- 📊 **历史查询**：查看过往送水记录，支持时间范围筛选
- 📤 **数据导出**：一键导出Excel格式的送水记录
- 🗑️ **安全清空**：带10秒倒计时的数据清空确认机制

### 技术特性
- ⚡ **无服务器架构**：基于 Cloudflare Workers，零服务器维护
- 🌍 **全球部署**：利用 Cloudflare 边缘网络，全球低延迟访问
- 💾 **分布式存储**：使用 Cloudflare KV 实现数据持久化
- 📱 **响应式设计**：完美适配桌面端、平板和移动设备
- 🔒 **用户认证**：安全的登录系统保护数据隐私
- 🎨 **现代UI**：毛玻璃效果、渐变色彩、流畅动画

### 用户体验
- 🚀 **即时响应**：实时数据更新，无需刷新页面
- 🔄 **智能重试**：处理网络波动，确保数据一致性
- 💡 **友好提示**：清晰的操作反馈和错误提示
- 📅 **时间筛选**：灵活的日期范围查询功能

## 🚀 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) (版本 16 或更高)
- [Cloudflare 账户](https://dash.cloudflare.com/sign-up)
- [Git](https://git-scm.com/)

### 一键部署

点击下方按钮即可一键部署到 Cloudflare Workers：

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/your-username/water-delivery-tracker)

### 手动部署

#### 1. 克隆项目

```bash
git clone https://github.com/your-username/water-delivery-tracker.git
cd water-delivery-tracker
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 登录 Cloudflare

```bash
npx wrangler auth login
```

#### 4. 创建 KV 命名空间

```bash
# 创建生产环境 KV 命名空间
npm run kv:namespace:create

# 创建预览环境 KV 命名空间（可选）
npm run kv:namespace:create:preview
```

#### 5. 配置 wrangler.toml

将创建的 KV 命名空间 ID 填入 `wrangler.toml` 文件中：

```toml
[[env.production.kv_namespaces]]
binding = "WATER_KV"
preview_id = "your-preview-id"  # 替换为实际的预览 ID
id = "your-production-id"       # 替换为实际的生产 ID
```

> 💡 **提示**：KV 命名空间 ID 可以在创建命令的输出中找到，或在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 的 Workers & Pages > KV 部分查看。

#### 6. 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787` 查看本地开发环境。

#### 7. 部署到 Cloudflare

```bash
npm run deploy
```

部署成功后，你将获得一个类似 `https://your-app.your-subdomain.workers.dev` 的访问地址。

## 📖 使用说明

### 主要功能

#### 🔐 用户登录
- 使用用户名和密码登录系统
- 登录状态会在浏览器中保持，无需重复登录

#### 📝 记录送水
1. 在主界面输入今天送的普通水和农夫山泉数量
2. 输入拿走的空桶数量
3. 点击「提交送水记录」按钮
4. 系统会自动计算剩余的空桶数量并更新状态

#### 📊 查看记录
- **历史记录**：在记录区域查看所有过往的送水记录
- **时间筛选**：使用日期选择器筛选特定时间范围的记录
- **实时状态**：页面顶部显示当前空桶存量

#### 📤 数据管理
- **导出数据**：点击「导出Excel」按钮下载送水记录
- **清空数据**：点击「清空所有数据」按钮（需10秒倒计时确认）

### 🔌 API 接口

#### 认证接口
```http
POST /api/login
Content-Type: application/json

{
  "username": "",
  "password": ""
}
```

#### 送水记录接口
```http
# 添加送水记录
POST /api/delivery
Content-Type: application/json

{
  "normalWater": 5,
  "nongfuWater": 3,
  "emptyBucketsTaken": 6
}

# 获取送水记录（支持日期筛选）
GET /api/records?startDate=2024-01-01&endDate=2024-01-31

# 获取当前状态
GET /api/status
```

#### 数据管理接口
```http
# 设置初始空桶数量
POST /api/initial-buckets
Content-Type: application/json

{
  "buckets": 20
}

# 清空所有数据
DELETE /api/clear-data
```

### 数据结构

#### 送水记录
```json
{
  "date": "2024-01-01",
  "timestamp": "2024-01-01T10:00:00.000Z",
  "normalWater": 5,
  "nongfuWater": 3,
  "totalDelivered": 8,
  "emptyBucketsTaken": 6,
  "remainingEmptyBuckets": 12
}
```

#### 当前状态
```json
{
  "emptyBuckets": 12
}
```

## 🛠️ 技术栈

### 核心技术
- **运行时**：[Cloudflare Workers](https://workers.cloudflare.com/) - 边缘计算平台
- **存储**：[Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) - 分布式键值存储
- **前端**：原生 HTML5/CSS3/ES6+ JavaScript
- **构建工具**：[Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) - Cloudflare 官方开发工具

### 架构特点
- **无服务器**：完全基于 Serverless 架构，无需管理服务器
- **边缘计算**：在全球 200+ 个数据中心运行，延迟低至 1ms
- **单文件应用**：前后端代码集成在一个文件中，简化部署
- **零配置**：开箱即用，无需复杂的环境配置

### 项目结构
```
water-delivery-tracker/
├── src/
│   └── index.js          # 主应用文件（前端+后端）
├── package.json          # 项目依赖和脚本
├── wrangler.toml         # Cloudflare Workers 配置
└── README.md            # 项目文档
```

### 依赖管理
```json
{
  "devDependencies": {
    "wrangler": "^3.0.0"
  },
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "kv:namespace:create": "wrangler kv:namespace create WATER_KV",
    "kv:namespace:create:preview": "wrangler kv:namespace create WATER_KV --preview"
  }
}
```

## ⚠️ 注意事项

### 数据安全
- 🔒 系统使用简单的用户名密码认证，建议在生产环境中加强安全措施
- 💾 数据存储在 Cloudflare KV 中，具有高可用性和持久性
- 🔄 建议定期导出数据作为备份

### 使用限制
- 📊 空桶数量不能为负数，系统会自动验证
- 📅 所有时间都使用 ISO 8601 格式存储（UTC时区）
- 📈 记录按时间戳排序，最新的记录显示在前
- 🚫 单次操作的数据量建议控制在合理范围内

### 免费额度
- 🆓 Cloudflare Workers 免费版每天 100,000 次请求
- 💾 KV 存储免费版每天 100,000 次读取，1,000 次写入
- 📊 对于小型应用，免费额度通常足够使用

## 🔧 故障排除

### 部署相关问题

#### 认证问题
```bash
# 重新登录 Cloudflare 账户
npx wrangler auth login

# 检查登录状态
npx wrangler whoami
```

#### KV 命名空间问题
```bash
# 列出所有 KV 命名空间
npx wrangler kv:namespace list

# 查看 KV 中的所有键
npx wrangler kv:key list --binding WATER_KV

# 查看特定键的值
npx wrangler kv:key get "status" --binding WATER_KV
```

#### 部署失败
- ✅ 确认 `wrangler.toml` 配置正确
- ✅ 检查 Workers 配额是否充足
- ✅ 验证 KV 命名空间 ID 是否正确
- ✅ 确保网络连接正常

### 运行时问题

#### 数据不显示
1. 检查浏览器控制台是否有错误信息
2. 验证 KV 数据是否正确存储
3. 确认 API 请求是否成功

#### 登录失败
- 确认用户名和密码正确（`` / ``）
- 清除浏览器缓存和 localStorage
- 检查网络连接

#### 性能问题
- Cloudflare Workers 冷启动可能需要几百毫秒
- KV 存储具有最终一致性，数据同步可能有轻微延迟
- 使用浏览器开发者工具检查网络请求

### 开发调试

#### 本地开发
```bash
# 启动本地开发服务器
npm run dev

# 查看详细日志
npx wrangler dev --local --verbose
```

#### 远程调试
```bash
# 查看 Worker 日志
npx wrangler tail

# 查看特定部署的日志
npx wrangler tail --env production
```

## 🤝 贡献指南

我们欢迎所有形式的贡献！无论是报告 bug、提出新功能建议，还是提交代码改进。

### 如何贡献

1. **Fork 项目**
   ```bash
   git clone https://github.com/your-username/water-delivery-tracker.git
   ```

2. **创建功能分支**
   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **提交更改**
   ```bash
   git commit -m 'Add some amazing feature'
   ```

4. **推送到分支**
   ```bash
   git push origin feature/amazing-feature
   ```

5. **创建 Pull Request**

### 开发规范

- 📝 提交信息使用清晰的描述
- 🧪 确保代码在本地环境正常运行
- 📚 更新相关文档
- 🎨 保持代码风格一致

### 报告问题

如果你发现了 bug 或有功能建议，请：

1. 检查 [Issues](https://github.com/your-username/water-delivery-tracker/issues) 中是否已有相关问题
2. 如果没有，请创建新的 Issue
3. 提供详细的问题描述和复现步骤

## 📝 更新日志

### v1.2.0 (2024-01-XX)
- ✨ 新增时间范围筛选功能
- 📤 支持Excel格式数据导出
- 🎨 优化移动端界面体验
- 🔧 改进错误处理机制

### v1.1.0 (2024-01-XX)
- 🔒 添加用户认证系统
- 📊 实现历史记录查看
- 🪣 优化空桶数量计算逻辑
- 📱 增强响应式设计

### v1.0.0 (2024-01-XX)
- 🎉 初始版本发布
- 📝 基础送水记录功能
- 💾 Cloudflare KV 数据存储
- 🚀 一键部署支持

## 🌟 致谢

感谢以下技术和服务：

- [Cloudflare Workers](https://workers.cloudflare.com/) - 提供强大的边缘计算平台
- [Cloudflare KV](https://developers.cloudflare.com/workers/runtime-apis/kv/) - 可靠的分布式存储
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) - 优秀的开发工具

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源协议。

```
MIT License

Copyright (c) 2024 Water Delivery Tracker

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

<div align="center">

**⭐ 如果这个项目对你有帮助，请给它一个星标！**

[🐛 报告问题](https://github.com/your-username/water-delivery-tracker/issues) • [💡 功能建议](https://github.com/your-username/water-delivery-tracker/issues) • [📖 文档](https://github.com/your-username/water-delivery-tracker/wiki)

</div>

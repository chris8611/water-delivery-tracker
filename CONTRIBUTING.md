# 贡献指南 🤝

感谢你对桶装水送水记录系统的关注！我们欢迎所有形式的贡献，无论是报告 bug、提出新功能建议，还是提交代码改进。

## 🚀 快速开始

### 开发环境设置

1. **Fork 并克隆项目**
   ```bash
   git clone https://github.com/your-username/water-delivery-tracker.git
   cd water-delivery-tracker
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置 Cloudflare 环境**
   ```bash
   # 登录 Cloudflare
   npx wrangler auth login
   
   # 创建开发用的 KV 命名空间
   npm run kv:namespace:create:preview
   ```

4. **启动本地开发服务器**
   ```bash
   npm run dev
   ```

## 📝 贡献类型

### 🐛 报告 Bug

如果你发现了 bug，请：

1. 检查 [Issues](https://github.com/your-username/water-delivery-tracker/issues) 中是否已有相关问题
2. 如果没有，请创建新的 Issue，包含：
   - 清晰的问题描述
   - 复现步骤
   - 期望的行为
   - 实际的行为
   - 环境信息（浏览器、操作系统等）
   - 截图或错误日志（如果有）

### 💡 功能建议

我们欢迎新功能建议！请：

1. 在 Issues 中创建功能请求
2. 详细描述功能的用途和价值
3. 提供使用场景和示例
4. 考虑实现的复杂度和维护成本

### 🔧 代码贡献

#### 开发流程

1. **创建功能分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

2. **进行开发**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 确保代码在本地正常运行

3. **测试你的更改**
   ```bash
   # 本地测试
   npm run dev
   
   # 部署测试（可选）
   npx wrangler deploy --env preview
   ```

4. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   # 或
   git commit -m "fix: fix your bug description"
   ```

5. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```
   然后在 GitHub 上创建 Pull Request

#### 提交信息规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式调整（不影响功能）
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

示例：
```
feat: add date range filter for water delivery records
fix: resolve empty bucket calculation error
docs: update API documentation
```

## 🎨 代码风格

### JavaScript 规范

- 使用 ES6+ 语法
- 使用 2 空格缩进
- 使用单引号
- 行末不加分号
- 函数和变量使用驼峰命名
- 常量使用大写下划线命名

### HTML/CSS 规范

- HTML 使用语义化标签
- CSS 类名使用短横线命名法（kebab-case）
- 保持响应式设计
- 优先使用 Flexbox 和 Grid 布局

### 注释规范

```javascript
/**
 * 处理送水记录提交
 * @param {Object} data - 送水数据
 * @param {number} data.normalWater - 普通水数量
 * @param {number} data.nongfuWater - 农夫山泉数量
 * @param {number} data.emptyBucketsTaken - 拿走的空桶数量
 * @returns {Promise<Object>} 处理结果
 */
async function handleDelivery(data) {
  // 实现逻辑
}
```

## 🧪 测试

### 手动测试清单

在提交 PR 之前，请确保：

- [ ] 登录功能正常
- [ ] 送水记录提交功能正常
- [ ] 历史记录显示正常
- [ ] 时间筛选功能正常
- [ ] Excel 导出功能正常
- [ ] 数据清空功能正常
- [ ] 移动端界面正常
- [ ] 错误处理正常

### 浏览器兼容性

请在以下浏览器中测试：

- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

## 📚 文档

如果你的更改涉及：

- 新功能：更新 README.md 中的功能特性部分
- API 变更：更新 API 接口文档
- 配置变更：更新部署步骤
- 故障排除：更新故障排除部分

## 🔍 代码审查

### PR 审查标准

- 代码质量和可读性
- 功能完整性和正确性
- 性能影响
- 安全性考虑
- 文档完整性
- 向后兼容性

### 审查流程

1. 自动化检查（如果有）
2. 代码审查
3. 功能测试
4. 合并到主分支

## 🎯 优先级

我们特别欢迎以下类型的贡献：

### 高优先级
- 🔒 安全性改进
- 🐛 Bug 修复
- 📱 移动端体验优化
- ⚡ 性能优化

### 中优先级
- ✨ 新功能开发
- 🎨 UI/UX 改进
- 📚 文档完善
- 🧪 测试覆盖

### 低优先级
- 🔧 代码重构
- 📦 依赖更新
- 🎯 代码优化

## 💬 沟通

### 获取帮助

如果你在贡献过程中遇到问题：

1. 查看现有的 Issues 和 Discussions
2. 创建新的 Issue 描述你的问题
3. 在 PR 中 @mention 维护者

### 社区准则

- 保持友善和尊重
- 欢迎新贡献者
- 提供建设性的反馈
- 专注于技术讨论

## 🏆 贡献者认可

我们会在以下方式认可贡献者：

- README.md 中的贡献者列表
- Release Notes 中的感谢
- GitHub 贡献者图表

## 📄 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下发布。

---

再次感谢你的贡献！🎉
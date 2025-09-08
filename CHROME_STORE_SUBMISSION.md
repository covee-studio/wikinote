# Chrome商店提交指南

## 构建完成

✅ Chrome插件已成功构建完成！

### 文件位置
- **插件目录**: `dist/extension/`
- **压缩包**: `dist/wikinote-extension.zip`

### 插件特性
- ✅ Manifest V3 兼容
- ✅ 新标签页替换功能
- ✅ 多语言维基百科文章展示
- ✅ 瀑布流布局
- ✅ 响应式设计
- ✅ 完整的图标集 (16x16, 32x32, 48x48, 128x128)

## 提交到Chrome商店步骤

### 1. 准备材料

#### 必需材料：
- **插件压缩包**: `dist/wikinote-extension.zip`
- **插件描述**: 
  ```
  Transform your new tab into a gateway of knowledge with Wikinote. Discover fascinating Wikipedia articles in an elegant waterfall layout that adapts to your screen.
  
  With support for 40+ languages, Wikinote brings the world's knowledge to your fingertips. Built as an open-source project with privacy-first design - no ads, no tracking, just pure knowledge discovery.
  
  Whether you're a lifelong learner or simply curious, Wikinote turns every new tab into an opportunity to learn something new.
  
  Project: https://github.com/Exploreryer/wikinote
  ```

#### 推荐材料：
- **截图**: 3-5张插件使用截图 (1280x800 或 640x400)
- **宣传图片**: 1280x800 的推广图片
- **详细描述**: 功能特性详细介绍

### 2. 创建开发者账户
1. 访问 [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
2. 支付一次性 $5.00 注册费
3. 完成开发者账户设置

### 3. 提交插件
1. 登录开发者控制台
2. 点击 "Add new item"
3. 上传 `wikinote-extension.zip` 文件
4. 填写插件信息：
   - **名称**: Wikinote
   - **版本**: 1.0.0
   - **描述**: 详细功能描述
   - **分类**: Productivity 或 Education
   - **语言**: English
   - **隐私政策**: 提供GitHub项目链接作为透明性说明

### 4. 商店信息填写

#### 基本信息：
- **名称**: Wikinote
- **简短描述**: Transform your new tab into a gateway of knowledge discovery
- **详细描述**: 
  ```
Turn every new tab into a doorway to curiosity.

Wikinote replaces your new tab with a stream of Wikipedia articles — dynamically surfaced to surprise, inform, and inspire.

What makes Wikinote special:

• A clean, responsive waterfall layout that adapts to any screen
• Wikipedia content in 40+ languages, changing with every tab
• Privacy-first: no tracking, all data stored locally
• Fully open-source and transparent – every line of code is yours to explore

There’s no curation, no agenda — just the joy of discovery through the world’s largest knowledge base.

💻 Explore the code or contribute: https://github.com/Exploreryer/wikinote

If you enjoy using Wikinote, feel free to leave a review or share your feedback — your ideas help shape its future. 🚀
  ```

#### 分类和标签：
- **类别**: Productivity
- **标签**: wikipedia, education, new tab, discovery, learning, open source

### 5. 隐私和权限说明

#### 权限使用说明：

**storage 权限**:
```
The extension uses Chrome's storage API to save user preferences locally on their device, such as language selection and liked articles. This allows users to maintain their preferred settings and access their saved articles across browser sessions, providing a personalized experience. No data is collected or transmitted to external servers.
```

**unlimitedStorage 权限**:
```
The extension stores user's liked articles and preferences locally on their device. While the data volume is typically small, unlimitedStorage ensures the extension can function properly without storage quota limitations, especially for users who save many articles for later reading. All data remains on the user's device and is not collected or transmitted.
```

**主机权限 (https://*.wikipedia.org/*)**:
```
The extension requests access to https://*.wikipedia.org/* to fetch random Wikipedia articles and their content. This is essential for the core functionality of displaying Wikipedia articles on the new tab page. The extension only accesses Wikipedia's public API to retrieve article data, images, and excerpts.
```

#### 远程代码使用说明：

**选择**: "是的,我正在使用远程代码" (Yes, I am using remote code)

**理由**:
```
The extension fetches content from Wikipedia's public API (https://*.wikipedia.org/w/api.php) to display random articles. This is required for core functionality. The extension does not execute any remote JavaScript code; it only retrieves data via HTTPS requests to Wikipedia endpoints. No user data is transmitted or collected.
```

#### 单一用途说明：
```
Wikinote transforms the new tab page to display random Wikipedia articles in a beautiful waterfall layout. The extension's single purpose is to provide users with an engaging knowledge discovery experience every time they open a new tab, featuring articles from Wikipedia in multiple languages with no ads or tracking.
```

#### 数据使用要点：
- ✅ 不收集用户个人信息
- ✅ 所有数据存储在本地
- ✅ 仅访问Wikipedia公共API
- ✅ 无广告、无追踪
- ✅ 用户偏好和收藏文章仅用于功能实现

### 6. 数据使用和隐私政策填写

#### 数据使用部分填写：

**所有数据类型都不勾选**：
- ❌ 个人身份信息
- ❌ 健康信息
- ❌ 财务和付款信息
- ❌ 身份验证信息
- ❌ 个人通讯
- ❌ 位置
- ❌ 网络记录
- ❌ 用户活动（本地存储，不收集）
- ❌ 网站内容（仅获取Wikipedia内容，不收集用户数据）

**理由**：我们的插件不收集任何用户数据，所有数据都存储在用户本地设备上，不会传输到任何外部服务器。

#### 数据使用承诺（全部勾选）：
- ✅ 我不会出于已获批准的用途之外的用途向第三方出售或传输用户数据
- ✅ 我不会为实现与我的产品的单一用途无关的目的而使用或转移用户数据
- ✅ 我不会为确定信用度或实现贷款而使用或转移用户数据

#### 隐私政策URL：
```
https://github.com/Exploreryer/wikinote
```

**注意**：由于我们的插件不收集任何用户数据，所有数据都存储在用户本地，因此不需要专门的隐私政策。可以提供GitHub项目链接作为透明性说明。

### 7. 审核注意事项

#### 功能完整性检查：
- ✅ 确保插件功能完整
- ✅ 测试所有语言支持
- ✅ 验证新标签页替换功能
- ✅ 检查响应式设计
- ✅ 确保无恶意代码
- ✅ 提供清晰的用户说明

#### 权限审核要点：
- ✅ 所有权限使用合理且必要
- ✅ 主机权限仅用于Wikipedia API访问
- ✅ 存储权限仅用于用户偏好和收藏
- ✅ 明确说明远程代码使用（仅API数据获取）

#### 可能遇到的审核延迟：
- ⚠️ 由于使用主机权限，可能需要进行深入审核
- ⚠️ 审核时间可能比标准流程更长
- ⚠️ 这是正常现象，请耐心等待

#### 审核通过要点：
- ✅ 功能描述清晰准确
- ✅ 权限使用说明详细
- ✅ 数据使用说明透明（不收集用户数据）
- ✅ 代码无恶意行为
- ✅ 用户体验良好

### 8. 发布后维护
- 监控用户反馈
- 定期更新内容
- 修复bug和改进功能
- 响应Chrome商店审核要求

## 技术规格

### 插件结构（构建输出）：
```
extension/
├── manifest.json          # 插件配置文件
├── newtab.html           # 新标签页HTML
├── newtab.js             # 主要JavaScript文件
├── newtab.css            # 样式文件
├── vendor.js             # 第三方库
└── icons/                # 图标文件
    ├── icon-16.png
    ├── icon-32.png
    ├── icon-48.png
    └── icon-128.png
```

### 兼容性：
- ✅ Chrome 88+
- ✅ Manifest V3
- ✅ 新标签页API
- ✅ Storage API

## 故障排除

如果遇到审核问题：
1. 检查 `manifest.json` 语法与权限说明
2. 验证 `icons/` 下 16/32/48/128 图标是否存在（构建脚本会自动生成缺失尺寸）
3. 测试功能完整性：新标签页替换、文章获取、点赞、分享、语言切换
4. 确保 CSP 配置符合商店要求（已在 `manifest.json` 的 `content_security_policy.extension_pages` 配置）
5. 附上数据使用与隐私说明（不收集用户数据，全部本地存储）

### 打包发布

构建完成后运行：

```bash
npm run pack:extension
```

会在 `dist/wikinote-extension.zip` 生成提交包（包含 `extension/` 全部内容）。

## 联系信息

如有问题，请参考：
- **项目GitHub**: https://github.com/Exploreryer/wikinote
- **问题反馈**: https://github.com/Exploreryer/wikinote/issues
- **开发者文档**: Chrome Extension Developer Guide
- **开源协议**: MIT License 
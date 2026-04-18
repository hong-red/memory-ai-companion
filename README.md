# 小世界·记忆 - AI 伴侣

一个温暖、个性化的 AI 情感陪伴应用，支持智能对话、日记记录、角色扮演等功能。

![应用截图](screenshot.png)

## 📋 项目分支说明

本项目有两个主要分支，适用于不同场景：

### 🌿 main 分支 - 纯前端 PWA 版本
**适合**：快速体验、个人本地使用、无需服务器的场景
- ✅ 纯前端实现，无需后端服务器
- ✅ 支持 PWA 安装，可像原生应用一样使用
- ✅ 数据存储在浏览器 LocalStorage
- ✅ 部署在 GitHub Pages：https://hong-red.github.io/memory-ai-companion/
- ⚠️ 数据仅在本地浏览器保存，清除缓存会丢失
- ⚠️ 无法跨设备同步数据

### 🔧 master 分支 - 前后端完整版本
**适合**：正式使用、需要数据持久化、多设备同步的场景
- ✅ 完整的用户系统和数据持久化
- ✅ 后端 API + 数据库存储
- ✅ 支持多设备数据同步
- ✅ 数据安全存储在服务器
- ✅ 部署地址：http://81.70.191.44:3000
- ⚠️ 需要服务器部署

## ✨ 主要功能

### 🤖 智能对话
- 基于 Moonshot AI API 的自然语言对话
- 支持自定义 AI 角色性格和系统提示词
- 长期记忆功能，AI 能记住你们的聊天历史
- 支持多个 AI 角色切换，每个角色有独立的记忆

### 🎭 个性角色
- **内置角色**：叶修（冷静理性的伙伴）、helpful 助手（高效实用的助手）
- **自定义角色**：支持创建属于自己的 AI 角色
  - 4 种快速模板：友好伙伴、导师/老师、心理咨询师、领域专家
  - 自动身份声明：确保 AI 正确回答"你是谁"
  - 角色描述和系统提示词自定义
- 可为每个角色上传专属头像

### 📔 智能日记
- 手动记录日记，支持选择心情标签
- AI 自动总结聊天记录生成日记
- 连续记录天数统计，养成记录习惯
- 日记历史查看和管理

### 🎨 界面个性化
- 自定义聊天背景图片
- 用户和 AI 头像自定义上传
- 精美的聊天气泡动效
- 花环风格的统计卡片设计
- 支持拖拽表情包贴纸

### 🔐 用户系统（仅 master 分支）
- 用户注册和登录
- 数据持久化存储（SQLite）
- 支持未登录状态下的本地体验

## 🚀 快速开始

### 方式一：直接使用（推荐）

根据您的需求选择：

| 需求 | 推荐版本 | 访问地址 |
|------|---------|---------|
| 快速体验、本地使用 | PWA 版本 | https://hong-red.github.io/memory-ai-companion/ |
| 正式使用、数据同步 | 完整版本 | http://81.70.191.44:3000 |

### 方式二：本地运行

#### 运行 PWA 版本（main 分支）

```bash
# 克隆 main 分支
git clone -b main https://github.com/hong-red/memory-ai-companion.git
cd memory-ai-companion

# 直接用浏览器打开 index.html
# 或启动本地服务器
npx serve .
```

#### 运行完整版本（master 分支）

```bash
# 克隆 master 分支
git clone -b master https://github.com/hong-red/memory-ai-companion.git
cd memory-ai-companion

# 启动后端服务
cd server
npm install
npm start

# 访问应用
# 打开浏览器访问 http://localhost:3000
```

### 方式三：Docker 部署（仅 master 分支）

```bash
git clone -b master https://github.com/hong-red/memory-ai-companion.git
cd memory-ai-companion
docker-compose up -d
```

## ⚙️ 配置说明

### 获取 API Key

1. 访问 [Moonshot AI](https://platform.moonshot.cn/) 注册账号
2. 在控制台创建 API Key
3. 在应用设置页面填入 API Key

### 环境变量（仅 master 分支后端）

创建 `server/.env` 文件：

```env
PORT=3000
JWT_SECRET=your-secret-key
NODE_ENV=production
```

## 🛠️ 技术栈

### 前端（两个分支相同）
- 纯 HTML5 / CSS3 / JavaScript（ES6+）
- 响应式设计，支持桌面端和移动端
- CSS 动画和过渡效果
- LocalStorage 本地缓存（main 分支）

### 后端（仅 master 分支）
- Node.js + Express
- SQLite3 数据库
- JWT 身份认证
- RESTful API 设计

### 部署
- GitHub Pages（main 分支 PWA 版本）
- PM2 进程管理（master 分支）
- Nginx 反向代理（可选）
- Docker 容器化支持

## 📱 响应式设计

应用完美适配各种设备：
- 💻 桌面端（>1024px）：完整三栏布局
- 📱 平板端（768px-1024px）：自适应布局
- 📲 手机端（<768px）：优化触控体验，花环卡片自动调整大小

## 🎯 使用指南

### 创建自定义角色

1. 点击"角色"标签进入角色管理页
2. 点击"创建新角色"按钮
3. 填写角色名称（必填）
4. 选择快速模板（可选）：
   - **友好伙伴**：温暖、善于倾听的朋友
   - **导师/老师**：经验丰富、耐心指导
   - **心理咨询师**：专业、共情力强
   - **领域专家**：专业、严谨的知识型
5. 根据需要修改系统提示词
6. 点击保存

💡 **提示**：系统会自动确保提示词包含身份声明，让 AI 能正确回答"你是谁"。

### 开始对话

1. 选择或创建一个 AI 角色
2. 进入聊天界面
3. 输入消息开始对话
4. AI 会记住你们的对话历史

### 记录日记

1. 点击"日记"标签
2. 点击"写日记"按钮
3. 选择日期、心情，填写标题和内容
4. 或使用"从对话生成"功能自动创建

## 🔄 更新日志

### v1.1.0 (2026-04-18)
- ✨ 新增角色创建模板功能
- ✨ 自动身份声明确保 AI 正确回答
- 🎨 优化花环卡片移动端显示
- 🐛 修复数据库初始化问题
- 🐛 修复聊天消息发送问题

### v1.0.0 (2026-04-17)
- ✨ 首次发布
- ✨ 智能对话功能
- ✨ 角色管理系统
- ✨ 日记记录功能
- ✨ 用户系统
- ✨ 界面个性化设置

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 License

MIT License

---

Made with ❤️ by hong-red

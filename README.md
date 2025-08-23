# BabyDraw 🎨

一个基于AI的儿童绘画应用，支持语音输入和文本输入，自动生成可爱的卡通风格绘画。

## ✨ 特性

- 🎤 **语音输入**: 支持语音描述，自动转换为文字
- ✏️ **文本输入**: 直接输入文字描述
- 🎨 **AI绘画生成**: 基于描述自动生成卡通风格的绘画
- 📱 **响应式设计**: 支持桌面和移动设备
- 💾 **历史记录**: 保存和查看历史绘画作品
- ⚡ **智能缓存**: 避免重复调用AI模型，提升响应速度
- 🔄 **步骤展示**: 展示绘画生成的中间步骤

## 🏗️ 技术架构

### 前端
- **框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS
- **语言**: TypeScript
- **图标**: Lucide React
- **状态管理**: React Hooks

### 后端
- **框架**: FastAPI + Python 3.11+
- **AI框架**: LangChain + LangGraph
- **包管理**: uv
- **API文档**: 自动生成的OpenAPI文档

### AI模型
- **语音识别**: 中文语音转文字模型
- **图像生成**: 中文文字生成图片模型
- **风格**: 专为儿童设计的卡通风格

## 🚀 快速开始

### 环境要求

- Node.js 18+
- Python 3.11+
- uv (Python包管理器)

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd babydraw
```

2. **启动后端服务**
```bash
cd backend
uv sync
uv run python start.py
```

后端服务将在 `http://localhost:8000` 启动

3. **启动前端服务**
```bash
cd frontend
npm install
npm run dev
```

前端服务将在 `http://localhost:3000` 启动

### 配置说明

在启动服务前，请确保配置了相应的AI模型API密钥：

1. 复制后端配置文件：
```bash
cp backend/.env.example backend/.env
```

2. 编辑 `backend/.env` 文件，填入相应的API密钥

## 📖 使用指南

1. **选择输入模式**：点击顶部的语音或文字图标切换输入模式

2. **语音输入**：
   - 点击录音按钮开始录音
   - 说出你想要绘画的内容描述
   - 点击停止按钮结束录音
   - 系统会自动识别语音并生成绘画

3. **文字输入**：
   - 在文本框中输入描述
   - 点击生成按钮创建绘画

4. **查看历史**：点击历史按钮查看之前生成的绘画作品

5. **重置**：点击重置按钮清空当前内容，开始新的创作

## 🎯 项目结构

```
babydraw/
├── frontend/                 # 前端应用
│   ├── src/
│   │   ├── app/             # Next.js 应用路由
│   │   ├── components/      # React 组件
│   │   ├── hooks/           # 自定义 Hooks
│   │   ├── services/        # API 服务
│   │   ├── types/           # TypeScript 类型定义
│   │   └── lib/             # 工具函数
│   ├── public/              # 静态资源
│   └── package.json
├── backend/                  # 后端API
│   ├── src/
│   │   ├── api/             # API 路由
│   │   ├── services/        # 业务逻辑
│   │   ├── models/          # 数据模型
│   │   └── utils/           # 工具函数
│   ├── start.py             # 启动文件
│   └── pyproject.toml
├── docs/                     # 项目文档
├── LICENSE                   # 许可证
└── README.md                # 项目说明
```

## 🔧 开发指南

### 前端开发

```bash
cd frontend
npm run dev          # 开发模式
npm run build        # 构建生产版本
npm run start        # 启动生产服务
npm run lint         # 代码检查
```

### 后端开发

```bash
cd backend
uv run python start.py              # 启动开发服务器
uv run python -m pytest             # 运行测试
uv run python -m black .            # 代码格式化
uv run python -m flake8 .           # 代码检查
```

### API 文档

后端启动后，可以访问以下地址查看API文档：
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 🎨 功能特色

### 智能缓存系统
- 语音识别结果缓存，避免重复识别相同音频
- 绘画结果缓存，相同描述直接返回缓存结果
- 自动清理过期缓存，优化存储空间

### 用户体验优化
- 实时状态反馈，显示处理进度
- 响应式设计，适配各种设备
- 优雅的加载动画和错误处理

### 安全性
- 输入验证和清理
- API速率限制
- 错误信息脱敏

## 🤝 贡献指南

我们欢迎所有形式的贡献！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 代码规范

- 前端：遵循 ESLint 和 Prettier 配置
- 后端：遵循 PEP 8 Python 代码规范
- 提交信息：使用清晰的提交信息描述更改

## 📄 许可证

本项目采用 [Apache License 2.0](LICENSE) 许可证。

## 🙏 致谢

- 感谢所有开源项目的贡献者
- 感谢AI模型提供商的技术支持
- 感谢社区用户的反馈和建议

## 📞 联系我们

如果您有任何问题或建议，请通过以下方式联系我们：

- 提交 Issue
- 发送邮件
- 加入讨论群

---

**BabyDraw** - 让每个孩子都能成为小画家！ 🎨✨
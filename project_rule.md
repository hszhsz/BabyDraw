# BabyDraw 项目技术架构文档

## 项目概述

BabyDraw 是一款专为 5-8 岁儿童设计的简笔画教学 Web 应用。通过语音转文字和文字生成图片的 AI 技术，分四个步骤教会小朋友画简笔画。

## 技术选型

### 后端技术栈

- **Python 3.11+**: 主要编程语言
- **FastAPI**: 现代、快速的 Web 框架，支持自动 API 文档生成
- **LangChain**: AI 应用开发框架，用于集成大语言模型
- **LangGraph**: 构建有状态的多参与者应用程序
- **uv**: 现代 Python 包管理器，替代 pip 和 virtualenv
- **SQLite/PostgreSQL**: 数据库存储
- **Redis**: 缓存系统
- **Pydantic**: 数据验证和序列化

### 前端技术栈

- **Node.js 18+**: JavaScript 运行时
- **React 18**: 用户界面库
- **Next.js 14**: React 全栈框架
- **Tailwind CSS**: 实用优先的 CSS 框架
- **TypeScript**: 类型安全的 JavaScript
- **Zustand**: 轻量级状态管理
- **React Hook Form**: 表单处理
- **Framer Motion**: 动画库

### AI 模型选择

#### 语音转文字 (ASR)
- **阿里云语音识别**: 支持中文儿童语音识别
- **百度语音识别**: 高精度中文语音识别
- **讯飞语音识别**: 专业的中文语音技术

#### 文字生成图片 (Text-to-Image)
- **通义万相**: 阿里云的图像生成模型
- **文心一格**: 百度的 AI 艺术创作平台
- **Stable Diffusion**: 开源图像生成模型

## 系统架构

### 整体架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Next.js) │────│   后端 (FastAPI) │────│   AI 服务       │
│   - React UI    │    │   - API Gateway │    │   - 语音识别     │
│   - 画布组件     │    │   - 业务逻辑     │    │   - 图像生成     │
│   - 语音录制     │    │   - 数据处理     │    │   - 模型调用     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   数据存储       │
                    │   - SQLite      │
                    │   - Redis       │
                    │   - 文件存储     │
                    └─────────────────┘
```

### 核心功能模块

#### 1. 用户界面模块
- **画布组件**: 显示生成的简笔画和分步教学
- **语音输入**: 录音按钮和语音可视化
- **文字输入**: 备用文字输入方式
- **历史记录**: 查看和管理历史画作

#### 2. 语音处理模块
- **音频录制**: 浏览器 MediaRecorder API
- **音频预处理**: 降噪和格式转换
- **语音识别**: 调用第三方 ASR 服务
- **结果处理**: 文本清理和验证

#### 3. 图像生成模块
- **提示词优化**: 将用户输入转换为适合的绘画提示
- **分步骤生成**: 生成完整图和分步教学图
- **图像后处理**: 尺寸调整和格式优化
- **缓存管理**: 避免重复生成相同内容

#### 4. 数据管理模块
- **用户数据**: 用户信息和偏好设置
- **历史记录**: 画作历史和元数据
- **缓存系统**: Redis 缓存热点数据
- **文件存储**: 图片和音频文件管理

## 数据库设计

### 主要数据表

```sql
-- 用户表
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 画作记录表
CREATE TABLE drawings (
    id INTEGER PRIMARY KEY,
    user_id INTEGER,
    title VARCHAR(100),
    description TEXT,
    prompt TEXT,
    image_url VARCHAR(255),
    steps_images JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 缓存表
CREATE TABLE cache (
    id INTEGER PRIMARY KEY,
    cache_key VARCHAR(255) UNIQUE,
    content TEXT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 设计

### RESTful API 端点

```
POST /api/v1/speech/recognize     # 语音识别
POST /api/v1/images/generate      # 图像生成
GET  /api/v1/drawings             # 获取历史记录
POST /api/v1/drawings             # 保存新画作
GET  /api/v1/drawings/{id}        # 获取特定画作
DEL  /api/v1/drawings/{id}        # 删除画作
GET  /api/v1/cache/{key}          # 缓存查询
POST /api/v1/cache                # 缓存存储
```

## 缓存策略

### 多层缓存架构

1. **浏览器缓存**: 静态资源和已生成图片
2. **CDN 缓存**: 图片和静态文件分发
3. **应用缓存**: Redis 缓存热点数据
4. **数据库缓存**: 查询结果缓存

### 缓存键设计

```python
# 图像生成缓存
image_cache_key = f"image:{hash(prompt)}:{style}:{size}"

# 语音识别缓存
speech_cache_key = f"speech:{hash(audio_content)}:{language}"

# 用户历史缓存
user_history_key = f"user:{user_id}:drawings"
```

## 部署架构

### 开发环境
- **前端**: Next.js 开发服务器 (localhost:3000)
- **后端**: FastAPI 开发服务器 (localhost:8000)
- **数据库**: 本地 SQLite
- **缓存**: 本地 Redis

### 生产环境
- **容器化**: Docker + Docker Compose
- **反向代理**: Nginx
- **数据库**: PostgreSQL
- **缓存**: Redis Cluster
- **文件存储**: 对象存储服务

## 安全考虑

1. **API 安全**: JWT 认证和 CORS 配置
2. **数据验证**: Pydantic 模型验证
3. **文件上传**: 文件类型和大小限制
4. **敏感信息**: 环境变量管理
5. **儿童隐私**: 符合儿童在线隐私保护法规

## 性能优化

1. **图片优化**: WebP 格式和懒加载
2. **代码分割**: Next.js 动态导入
3. **CDN 加速**: 静态资源分发
4. **数据库优化**: 索引和查询优化
5. **缓存策略**: 多层缓存减少 AI 调用

## 监控和日志

1. **应用监控**: 性能指标和错误追踪
2. **API 监控**: 响应时间和成功率
3. **用户行为**: 使用统计和用户体验
4. **系统日志**: 结构化日志记录

## 开发规范

1. **代码规范**: ESLint + Prettier (前端), Black + isort (后端)
2. **提交规范**: Conventional Commits
3. **分支策略**: Git Flow
4. **测试覆盖**: 单元测试和集成测试
5. **文档维护**: API 文档和代码注释

---

*最后更新: 2024年12月*
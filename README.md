# WayBlog

一个基于 Next.js 16、Prisma 和 PostgreSQL 的现代个人博客系统，包含公开前台、管理后台和 RESTful API。

## 技术栈

| 分类     | 技术                                           |
| -------- | ---------------------------------------------- |
| 框架     | Next.js 16 (App Router)                        |
| 前端     | React 19 + TypeScript                          |
| 样式     | Tailwind CSS 4                                 |
| ORM      | Prisma 7 + PostgreSQL 16                       |
| 认证     | NextAuth v5 (Credentials + JWT)                |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| 校验     | Zod 4                                          |
| 包管理   | pnpm                                           |

## 功能特性

### 内容管理

- 📝 **文章管理** — 创建、编辑、删除、发布 / 草稿、置顶
- 📁 **分类管理** — 增删改查
- 🏷️ **标签管理** — 增删改查，多对多关联文章
- 🔗 **友链管理** — 增删改查，自定义排序

### 前台展示

- 🏠 首页 — 文章列表、置顶文章、分页
- 📄 文章详情 — Markdown 渲染、代码高亮、目录导航、上/下篇
- 📂 分类页 / 标签页 — 分类/标签下的文章列表
- 📅 归档页 — 按时间线展示所有文章
- 🔍 搜索 — 全文搜索文章
- 👤 关于 / 🤝 友链 — 静态内容页

### 系统能力

- 🔐 鉴权 — 管理员登录、Middleware 路由保护、API 认证守卫
- 📊 统计 — 文章浏览量（PV/UV）、后台仪表盘概览
- 🤖 AI 辅助写作 — 支持文章润色、字段优化、分类和标签建议，可切换阿里百炼或 Ollama
- 🖼️ 图片上传 — 本地存储到 `public/uploads`
- 🌓 主题切换 — 亮色 / 暗色 / 跟随系统
- 🛡️ 限流 — 基于 Redis 的跨实例 Rate Limiter
- 🌐 SEO — Metadata、OpenGraph、RSS Feed、Sitemap、Robots、JSON-LD

## 环境要求

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## 快速开始

### 1. 克隆仓库并安装依赖

```bash
git clone <your-repo-url>
cd WayBlog
pnpm install
```

### 2. 启动 PostgreSQL 与 Redis

```bash
docker compose up -d postgres redis
```

> PostgreSQL 默认端口映射为 `6432:5432`，Redis 默认端口映射为 `6381:6379`，避免和本机其他项目 Redis 冲突。

### 3. 配置环境变量

```bash
cp .env.example .env      # Linux / macOS / Git Bash
```

```powershell
Copy-Item .env.example .env   # Windows PowerShell
```

打开 `.env`，按需修改数据库密码、`NEXTAUTH_SECRET`、管理员账号等。

如果需要启用 AI 写作功能，推荐先配置阿里百炼：

```env
AI_PROVIDER="aliyun-bailian"
AI_TIMEOUT_MS=120000
DASHSCOPE_API_KEY="your-dashscope-api-key"
DASHSCOPE_BASE_URL="https://dashscope.aliyuncs.com/compatible-mode/v1"
DASHSCOPE_MODEL="qwen3.6-plus"
```

如果想切回本地 Ollama，将 `AI_PROVIDER` 改为 `ollama`，并启用对应配置：

```env
AI_PROVIDER="ollama"
AI_TIMEOUT_MS=120000
OLLAMA_BASE_URL="http://127.0.0.1:11434"
OLLAMA_MODEL="qwen2.5:1.5b"
```

### 4. 初始化数据库

```bash
pnpm db:generate    # 生成 Prisma Client
pnpm db:migrate     # 执行数据库迁移
pnpm db:seed        # 填充初始数据（管理员账号）
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问：

- 前台：`http://localhost:3610`
- 后台：`http://localhost:3610/admin`

管理员初始账号由 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 配置。

## 常用命令

| 命令               | 说明                             |
| ------------------ | -------------------------------- |
| `pnpm dev`         | 启动开发服务器 (端口 3610)       |
| `pnpm build`       | 构建生产版本                     |
| `pnpm start`       | 启动生产服务器                   |
| `pnpm lint`        | ESLint 代码检查                  |
| `pnpm format`      | Prettier 格式化                  |
| `pnpm db:generate` | 生成 Prisma Client               |
| `pnpm db:migrate`  | 执行数据库迁移                   |
| `pnpm db:push`     | 同步 Schema 到数据库（跳过迁移） |
| `pnpm db:seed`     | 填充种子数据                     |
| `pnpm db:studio`   | 打开 Prisma Studio 可视化管理    |

## 项目结构

```
WayBlog/
├── prisma/
│   ├── schema.prisma          # 数据模型定义
│   ├── migrations/            # 数据库迁移文件
│   └── seed.mts               # 种子数据脚本
├── public/
│   └── uploads/               # 上传文件存储目录
├── scripts/
│   └── dev.mjs                # 开发服务器启动脚本
├── docs/                      # 项目文档
│   ├── requirements.md        #   需求说明
│   ├── design.md              #   系统设计
│   ├── database.md            #   数据库设计
│   ├── api.md                 #   API 文档
│   └── tasks.md               #   整理清单
└── src/
    ├── proxy.ts               # NextAuth Proxy（后台路由保护，Next.js 16 约定）
    ├── types/
    │   └── index.ts           # 全局类型定义
    ├── lib/
    │   ├── auth.ts            # NextAuth 完整配置（含 Prisma）
    │   ├── auth.config.ts     # NextAuth 核心配置（Edge Runtime 安全）
    │   ├── auth-guard.ts      # API 路由认证守卫
    │   ├── api/               # Route Handler 通用辅助（鉴权、JSON 校验、路由参数）
    │   ├── posts/             # 文章查询、后台写入服务、浏览量服务
    │   ├── taxonomies/        # 分类/标签查询与后台服务
    │   ├── friend-links/      # 友链查询与后台服务
    │   ├── pages/             # 单页内容查询
    │   ├── search/            # 全文搜索服务
    │   ├── stats/             # 后台统计服务
    │   ├── prisma.ts          # Prisma Client 单例
    │   ├── rate-limit.ts      # 滑动窗口限流器
    │   ├── response.ts        # HTTP 响应构造工具
    │   ├── site.ts            # 站点配置
    │   ├── utils.ts           # 通用工具函数
    │   └── validations.ts     # Zod 校验 Schema
    ├── components/
    │   ├── admin/             # 后台表单组件、编辑器 Hook 与管理页复用逻辑
    │   ├── layout/            # 布局组件（Header、Sidebar、Footer、主题切换）
    │   ├── post/              # 文章相关组件（卡片、目录、Markdown 渲染）
    │   ├── seo/               # SEO 组件（JSON-LD）
    │   └── ui/                # 通用 UI 组件（分页）
    └── app/
        ├── layout.tsx         # 根布局
        ├── globals.css        # 全局样式
        ├── not-found.tsx      # 404 页面
        ├── robots.ts          # Robots.txt
        ├── sitemap.ts         # Sitemap
        ├── feed.xml/          # RSS Feed
        ├── (public)/          # 前台页面（Route Group，不影响 URL）
        │   ├── layout.tsx     #   前台布局（Header + Footer）
        │   ├── page.tsx       #   首页
        │   ├── posts/         #   文章列表 & 详情
        │   ├── categories/    #   分类页
        │   ├── tags/          #   标签页
        │   ├── archives/      #   归档页
        │   ├── search/        #   搜索页
        │   ├── about/         #   关于页
        │   └── friends/       #   友链页
        ├── admin/             # 后台管理
        │   ├── layout.tsx     #   后台布局（Sidebar + Header）
        │   ├── login/         #   登录页
        │   ├── dashboard/     #   仪表盘
        │   ├── posts/         #   文章管理（列表 / 新建 / 编辑）
        │   ├── categories/    #   分类管理
        │   ├── tags/          #   标签管理
        │   └── friend-links/  #   友链管理
        └── api/               # RESTful API (Route Handlers)
            ├── auth/          #   认证（NextAuth）
            ├── posts/         #   文章 CRUD + 浏览量
            ├── categories/    #   分类 CRUD
            ├── tags/          #   标签 CRUD
            ├── friend-links/  #   友链 CRUD
            ├── search/        #   全文搜索
            ├── stats/         #   统计数据
            └── upload/        #   文件上传
```

## 环境变量

| 变量                 | 说明                                            | 默认值                                              |
| -------------------- | ----------------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`       | PostgreSQL 连接字符串                           | —                                                   |
| `REDIS_URL`          | Redis 连接字符串，用于限流和浏览量 UV 去重      | `redis://localhost:6381/0`                          |
| `REDIS_KEY_PREFIX`   | Redis key 前缀，用于隔离不同项目                | `wayblog`                                           |
| `PORT`               | 本地开发与生产启动端口                          | `3610`                                              |
| `NEXTAUTH_URL`       | 站点 URL（认证回调）                            | `http://localhost:3610`                             |
| `NEXTAUTH_SECRET`    | JWT 签名密钥                                    | —                                                   |
| `SITE_NAME`          | 站点名称                                        | `Way`                                               |
| `SITE_DESCRIPTION`   | 站点描述                                        | `A Journey of Code and Thought`                     |
| `SITE_URL`           | 站点公开 URL                                    | `http://localhost:3610`                             |
| `ADMIN_EMAIL`        | 管理员邮箱（seed 用）                           | —                                                   |
| `ADMIN_PASSWORD`     | 管理员密码（seed 用）                           | —                                                   |
| `UPLOAD_MAX_SIZE`    | 上传文件大小限制（bytes）                       | `5242880` (5MB)                                     |
| `UPLOAD_DIR`         | 上传目录                                        | `public/uploads`                                    |
| `UPLOAD_ALLOWED_TYPES` | 允许上传的 MIME 类型，逗号分隔                | `image/jpeg,image/png,image/gif,image/webp`         |
| `RATE_LIMIT_LOGIN`   | 登录接口每分钟/IP 限流次数                     | `5`                                                 |
| `RATE_LIMIT_VIEWS`   | 浏览量接口每秒/IP/文章限流次数                 | `1`                                                 |
| `RATE_LIMIT_SEARCH`  | 搜索接口每分钟/IP 限流次数                     | `30`                                                |
| `RATE_LIMIT_API`     | 通用 API 每分钟/IP 限流次数                    | `60`                                                |
| `AI_PROVIDER`        | AI 服务提供商，可选 `aliyun-bailian` / `ollama` | `aliyun-bailian`                                    |
| `AI_TIMEOUT_MS`      | AI 请求超时时间（毫秒）                         | `120000`                                            |
| `DASHSCOPE_API_KEY`  | 阿里百炼 API Key                                | —                                                   |
| `DASHSCOPE_BASE_URL` | 阿里百炼兼容接口地址                            | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `DASHSCOPE_MODEL`    | 阿里百炼模型名                                  | `qwen3.6-plus`                                      |
| `OLLAMA_BASE_URL`    | Ollama 服务地址                                 | `http://127.0.0.1:11434`                            |
| `OLLAMA_MODEL`       | Ollama 模型名                                   | `qwen2.5:1.5b`                                      |

完整配置见 [.env.example](./.env.example)。

## AI 模块结构

AI 写作能力已经拆分为清晰的服务分层：

- `src/lib/ai/service.ts`：AI 业务统一入口，负责串联提示词、provider 与结果归一化
- `src/lib/ai/prompts/*`：按任务组织提示词构建，例如全文优化与单字段优化
- `src/lib/ai/providers/*`：百炼与 Ollama 的 provider 适配层
- `src/lib/ai/normalizers/*`：模型输出清洗、JSON 提取与结果归一化
- `src/app/api/ai/optimize`、`src/app/api/ai/field`：保持轻量的 AI Route Handler

默认 provider 由 `.env` 中的 `AI_PROVIDER` 控制：

- 使用阿里百炼时，配置 `DASHSCOPE_API_KEY`，并可通过 `DASHSCOPE_MODEL` 切换模型
- 使用 Ollama 时，配置 `OLLAMA_BASE_URL` 与 `OLLAMA_MODEL`
- 两种 provider 共用 `AI_TIMEOUT_MS` 超时设置

管理后台文章编辑页仍使用同一套 AI 能力，但底层已改为通过 service 层调用 provider，无需在前端绑定某个特定模型实现。

## 已知说明

- 运行项目前需要先启动 Docker Desktop，否则 PostgreSQL 容器不会起来。
- 图片上传当前为本地存储，适合单机部署；后续可切换至 MinIO / OSS。
- Prisma Client 输出到仓库根部 `generated/prisma`，该目录已在 `.gitignore` 中忽略，首次克隆需执行 `pnpm db:generate`。
- Rate Limiter 与浏览量 UV 去重依赖 Redis；部署时必须配置可用的 `REDIS_URL`，多实例可共享同一 Redis key 空间。

## 文档

- [需求说明](./docs/requirements.md)
- [系统设计](./docs/design.md)
- [数据库设计](./docs/database.md)
- [API 文档](./docs/api.md)
- [整理清单](./docs/tasks.md)

## License

MIT

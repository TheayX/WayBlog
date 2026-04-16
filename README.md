# WayBlog

一个基于 Next.js 16、Prisma 和 PostgreSQL 的现代个人博客系统，包含公开前台、管理后台和 RESTful API。

## 技术栈

| 分类 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 前端 | React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| ORM | Prisma 7 + PostgreSQL 16 |
| 认证 | NextAuth v5 (Credentials + JWT) |
| Markdown | react-markdown + remark-gfm + rehype-highlight |
| 校验 | Zod 4 |
| 包管理 | pnpm |

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
- 🛡️ 限流 — 基于内存的滑动窗口 Rate Limiter
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

### 2. 启动 PostgreSQL

```bash
docker compose up -d postgres
```

> 默认端口映射为 `6432:5432`，数据库名/用户名均为 `wayblog`。

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

- 前台：`http://localhost:3333`
- 后台：`http://localhost:3333/admin`

管理员初始账号由 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD` 配置。

## 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 (端口 3333) |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm format` | Prettier 格式化 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:push` | 同步 Schema 到数据库（跳过迁移） |
| `pnpm db:seed` | 填充种子数据 |
| `pnpm db:studio` | 打开 Prisma Studio 可视化管理 |

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
    ├── generated/prisma/      # Prisma Client（自动生成，已 gitignore）
    ├── types/
    │   └── index.ts           # 全局类型定义
    ├── lib/
    │   ├── auth.ts            # NextAuth 完整配置（含 Prisma）
    │   ├── auth.config.ts     # NextAuth 核心配置（Edge Runtime 安全）
    │   ├── auth-guard.ts      # API 路由认证守卫
    │   ├── prisma.ts          # Prisma Client 单例
    │   ├── rate-limit.ts      # 滑动窗口限流器
    │   ├── response.ts        # HTTP 响应构造工具
    │   ├── site.ts            # 站点配置
    │   ├── utils.ts           # 通用工具函数
    │   └── validations.ts     # Zod 校验 Schema
    ├── components/
    │   ├── admin/             # 后台表单组件
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

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接字符串 | — |
| `NEXTAUTH_URL` | 站点 URL（认证回调） | `http://localhost:3333` |
| `NEXTAUTH_SECRET` | JWT 签名密钥 | — |
| `SITE_NAME` | 站点名称 | `Way` |
| `SITE_DESCRIPTION` | 站点描述 | `A Journey of Code and Thought` |
| `SITE_URL` | 站点公开 URL | `http://localhost:3333` |
| `ADMIN_EMAIL` | 管理员邮箱（seed 用） | — |
| `ADMIN_PASSWORD` | 管理员密码（seed 用） | — |
| `AI_PROVIDER` | 当前 AI 提供方，支持 `aliyun-bailian` / `ollama` | `aliyun-bailian` |
| `AI_TIMEOUT_MS` | AI 请求超时时间（毫秒） | `120000` |
| `DASHSCOPE_API_KEY` | 阿里百炼 API Key | — |
| `DASHSCOPE_BASE_URL` | 阿里百炼兼容模式 Base URL | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| `DASHSCOPE_MODEL` | 阿里百炼模型名 | `qwen3.6-plus` |
| `OLLAMA_BASE_URL` | Ollama 服务地址 | `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Ollama 模型名 | `qwen2.5:1.5b` |
| `UPLOAD_MAX_SIZE` | 上传文件大小限制（bytes） | `5242880` (5MB) |
| `UPLOAD_DIR` | 上传目录 | `public/uploads` |

完整配置见 [.env.example](./.env.example)。

## AI 配置说明

项目的 AI 能力统一通过服务层选择 provider，接口层不直接依赖具体模型实现。

- 推荐方案：阿里百炼 `qwen3.6-plus`，适合当前在线调用场景
- 本地方案：Ollama，适合离线调试或本地自托管
- 切换方式：只改 `.env` 中的 `AI_PROVIDER`，不需要再改业务代码
- 互斥方式：当前使用哪一套，就保留对应配置；另一套配置可以直接注释掉

当前 AI 功能覆盖：

- 文章整体优化
- 标题、Slug、摘要、正文单字段优化
- 分类推荐
- 标签推荐

## 已知说明

- 运行项目前需要先启动 Docker Desktop，否则 PostgreSQL 容器不会起来。
- 图片上传当前为本地存储，适合单机部署；后续可切换至 MinIO / OSS。
- Prisma Client 输出到 `src/generated/prisma`，该目录已在 `.gitignore` 中忽略，首次克隆需执行 `pnpm db:generate`。
- Rate Limiter 基于内存实现，进程重启后计数器重置，适合单实例部署。

## 文档

- [需求说明](./docs/requirements.md)
- [系统设计](./docs/design.md)
- [数据库设计](./docs/database.md)
- [API 文档](./docs/api.md)
- [整理清单](./docs/tasks.md)

## License

MIT

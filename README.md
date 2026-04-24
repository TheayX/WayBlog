# WayBlog

WayBlog 是一个基于 Next.js、Prisma 和 PostgreSQL 的个人博客系统，面向单管理员场景，包含公开前台、管理后台、全文搜索、浏览量统计和 AI 辅助写作。

## 功能特性

- 文章、分类、标签、友链管理
- Markdown 渲染、代码高亮、目录导航、上一篇/下一篇
- PostgreSQL 全文搜索、RSS、sitemap、robots、JSON-LD
- NextAuth 登录鉴权、后台路由保护、Redis 限流
- PV / UV 统计与后台仪表盘
- 本地图片上传
- AI 辅助写作，支持阿里百炼或 Ollama

## 技术栈

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4
- Prisma 7 / PostgreSQL
- NextAuth v5
- Redis
- Zod
- pnpm

## 环境要求

- Node.js 20+
- pnpm 9+
- Docker Desktop

## 快速开始

```bash
pnpm install
docker compose up -d postgres redis
```

复制环境变量模板：

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

初始化数据库：

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

启动开发服务器：

```bash
pnpm dev
```

默认访问地址：

- 前台：`http://localhost:3610`
- 后台：`http://localhost:3610/admin`

管理员初始账号由 `.env` 中的 `ADMIN_EMAIL` 和 `ADMIN_PASSWORD` 决定。

## 配置约定

- 运行环境和敏感信息放在 `.env` / `.env.example`，例如 `DATABASE_URL`、`REDIS_URL`、`NEXTAUTH_SECRET`、`SITE_URL`、AI Key。
- 公开站点资料和文案放在 [src/config/site.ts](./src/config/site.ts)，例如品牌名、站点描述、公开邮箱、GitHub 链接、首页和页脚文案。
- `SITE_URL` 继续保留在环境变量中，因为它会随本地、测试和正式部署地址变化。

## 常用命令

| Command | Description |
| --- | --- |
| `pnpm dev` | 启动开发服务器 |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 运行 ESLint |
| `pnpm test` | 运行单元测试 |
| `pnpm format` | 格式化源码 |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:migrate` | 执行数据库迁移 |
| `pnpm db:seed` | 写入种子数据 |
| `pnpm db:studio` | 打开 Prisma Studio |

## 项目结构

```text
WayBlog/
├── docs/                  # 需求、设计、API、数据库文档
├── prisma/                # Prisma schema、迁移和种子脚本
├── public/                # 静态资源和上传目录
├── scripts/               # 本地开发与测试脚本
└── src/
    ├── app/               # Next.js App Router 页面与 API
    ├── components/        # UI、布局、文章和后台组件
    ├── lib/               # 领域查询、服务、鉴权、缓存和工具
    └── types/             # 全局类型
```

## 文档

- [需求说明](./docs/core/requirements.md)
- [系统设计](./docs/core/design.md)
- [API 文档](./docs/core/api.md)
- [数据库设计](./docs/core/database.md)
- [任务清单](./docs/core/tasks.md)
- [项目结构说明](./docs/guides/structure.md)

配置项以 [.env.example](./.env.example) 为准；部署、数据库能力和运行边界见 `docs/`。

## 说明

- 默认端口是 `3610`。
- PostgreSQL 默认映射到宿主机 `6432`。
- Redis 默认映射到宿主机 `6381`。
- 图片默认保存在 `public/uploads`，适合单机部署。
- Prisma Client 输出到仓库根部 `generated/prisma`，该目录不提交。

## License

MIT

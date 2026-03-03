# WayBlog

一个基于 Next.js 16、Prisma 和 PostgreSQL 的个人博客系统，包含公开前台、管理后台和一组内容管理 API。

## 技术栈

- Next.js 16 + App Router
- React 19 + TypeScript
- Prisma 7 + PostgreSQL
- NextAuth v5（Credentials + JWT）
- Tailwind CSS 4
- react-markdown + remark-gfm + rehype-highlight
- pnpm

## 当前功能

- 文章管理：创建、编辑、删除、发布、置顶
- 分类管理：增删改查
- 标签管理：增删改查
- 友链管理：增删改查
- 前台页面：首页、文章详情、分类页、标签页、归档、搜索、关于、友链
- Markdown 渲染：GFM、代码高亮、目录、上一篇/下一篇
- SEO：Metadata、RSS、sitemap、robots、JSON-LD
- 鉴权：管理员登录、后台路由保护、受保护 API
- 浏览统计：文章浏览量、后台统计概览
- 图片上传：本地存储到 `public/uploads`
- 主题切换：亮色 / 暗色

## 环境要求

- Node.js 20+
- pnpm 9+
- Docker Desktop

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动 PostgreSQL

```bash
docker compose up -d postgres
```

默认数据库端口映射为 `6432`。

### 3. 配置环境变量

```bash
cp .env.example .env
```

如果你在 Windows PowerShell 下执行：

```powershell
Copy-Item .env.example .env
```

### 4. 初始化数据库

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

### 5. 启动开发服务器

```bash
pnpm dev
```

访问：

- 前台：`http://localhost:3333`
- 后台：`http://localhost:3333/admin`

管理员初始账号来自 `.env` 中的以下字段：

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

## 常用命令

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm db:generate
pnpm db:migrate
pnpm db:push
pnpm db:seed
pnpm db:studio
```

## 项目结构

```text
src/
  app/
    (public)/          前台页面
    admin/             后台页面
    api/               Route Handlers
    feed.xml/          RSS
    sitemap.ts         Sitemap
    robots.ts          Robots
    layout.tsx         根布局
    proxy.ts           后台路由保护
  components/
    admin/             后台表单与编辑器
    layout/            头部、侧边栏、主题切换
    post/              文章相关组件
    seo/               SEO 组件
    ui/                通用 UI 组件
  lib/
    api.ts             API 响应工具
    auth.ts            NextAuth 配置
    auth-guard.ts      API 鉴权
    prisma.ts          Prisma 单例
    rate-limit.ts      限流
    utils.ts           通用工具函数
    validations.ts     Zod 校验
prisma/
  schema.prisma        数据模型
  migrations/          数据库迁移
  seed.mts             种子脚本
docs/
  requirements.md
  design.md
  database.md
  api.md
  tasks.md
```

## 已知说明

- 运行项目前需要先启动 Docker Desktop，否则 PostgreSQL 容器不会起来。
- 图片上传当前为本地存储，适合单机部署。
- Prisma Client 输出到 `src/generated/prisma`，该目录已在 `.gitignore` 中忽略。

## 文档

- [需求说明](./docs/requirements.md)
- [系统设计](./docs/design.md)
- [数据库设计](./docs/database.md)
- [API 文档](./docs/api.md)
- [整理清单](./docs/tasks.md)

## License

MIT

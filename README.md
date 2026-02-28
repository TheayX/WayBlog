# Way — 个人技术博客

一个使用 Next.js 构建的现代个人博客系统。

## 技术栈

- **框架**: Next.js 16 (App Router, React 19, TypeScript)
- **样式**: Tailwind CSS 4
- **数据库**: PostgreSQL 16 + Prisma ORM
- **认证**: NextAuth.js v5 (Credentials + JWT)
- **编辑**: Markdown (react-markdown + GFM + 代码高亮)
- **包管理**: pnpm

## 功能

- ✅ 文章管理 (CRUD / Markdown / 分类 / 标签 / 置顶)
- ✅ 后台管理面板 (仪表盘 / 文章 / 分类 / 标签 / 友链)
- ✅ 前台展示 (首页 / 详情 / 归档 / 搜索 / 关于 / 友链)
- ✅ 暗色模式 (next-themes, 无闪烁)
- ✅ 响应式设计 (移动端 / 平板 / 桌面)
- ✅ 图片上传 (本地存储)
- ✅ 浏览量统计 (PV/UV)
- ✅ 限流保护

## 快速开始

### 前置要求

- Node.js 20+
- pnpm 9+
- Docker Desktop (用于 PostgreSQL)

### 1. 克隆并安装

```bash
git clone https://github.com/your-username/WayBlog.git
cd WayBlog
pnpm install
```

### 2. 启动数据库

```bash
docker compose up -d postgres
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的配置
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

访问 [http://localhost:3333](http://localhost:3333) 查看前台，访问 [http://localhost:3333/admin](http://localhost:3333/admin) 进入后台。

默认管理员账号见 `.env` 中的 `ADMIN_EMAIL` / `ADMIN_PASSWORD`。

## 项目结构

```
src/
├── app/
│   ├── (public)/       # 前台页面 (首页/文章/归档/搜索/关于/友链)
│   ├── admin/          # 后台管理页面
│   └── api/            # API 路由
├── components/
│   ├── admin/          # 后台组件
│   ├── layout/         # 布局组件 (Header/Footer/Sidebar)
│   ├── post/           # 文章组件 (PostCard/TOC/MarkdownRenderer)
│   └── ui/             # 通用 UI 组件
├── lib/                # 工具函数/认证/数据库
└── types/              # TypeScript 类型定义
```

## 文档

详细文档位于 `docs/` 目录：

- [需求文档](docs/requirements.md)
- [设计文档](docs/design.md)
- [数据库设计](docs/database.md)
- [API 文档](docs/api.md)
- [任务清单](docs/tasks.md)

## 许可证

MIT

# WayBlog 项目结构说明

本文档说明仓库目录职责、主要模块边界和新增文件时的放置原则。README 只保留简略结构，详细约定以本文档为准。

## 顶层目录

```text
WayBlog/
├── docs/              # 项目文档
├── prisma/            # Prisma schema、迁移和种子脚本
├── public/            # 静态资源和上传文件
├── scripts/           # 本地开发、测试等工程脚本
└── src/               # 应用源码
```

### `docs/`

- `requirements.md`：需求和边界
- `design.md`：系统设计和模块关系
- `api.md`：接口约定
- `database.md`：数据库模型、迁移和搜索能力说明
- `tasks.md`：阶段性整理记录
- `structure.md`：目录结构和放置规则

### `prisma/`

- `schema.prisma`：Prisma 数据模型
- `migrations/`：数据库迁移
- `seed.mts`：初始化数据

Prisma Client 输出到仓库根部 `generated/prisma`，不放在 `src/` 内，也不提交到仓库。

### `public/`

公开静态资源目录。当前上传文件默认写入 `public/uploads/{yyyy-MM}/`。

### `scripts/`

工程辅助脚本：

- `dev.mjs`：本地开发启动辅助
- `test.mjs`：跨平台收集并运行 `*.test.ts`

## `src/` 目录

```text
src/
├── app/               # Next.js App Router 页面和 API
├── components/        # 可复用 React 组件
├── lib/               # 领域逻辑、基础设施、服务和工具
├── types/             # 全局共享类型
└── proxy.ts           # 后台路由保护
```

## `src/app/`

`app/` 只承载路由、页面和 Route Handler，不直接堆业务查询细节。

```text
src/app/
├── (public)/          # 前台页面
├── admin/             # 后台页面
├── api/               # API Route Handlers
├── feed.xml/          # RSS
├── layout.tsx         # 根布局
├── sitemap.ts         # Sitemap
└── robots.ts          # Robots
```

### 前台页面

前台页面位于 `src/app/(public)/`，主要通过 `src/lib/*/queries.ts` 读取公开数据。

前台页面不应直接引入 Prisma，也不应自行拼接“只读已发布文章”等可见性规则。

### 后台页面

后台页面位于 `src/app/admin/`。后台交互页通常是 Client Component，通过 API 调用后台能力。

文章编辑页允许在 Server Component 中读取后台编辑数据，但查询仍应放在 `src/lib/posts/queries.ts`。

### API 路由

API 位于 `src/app/api/`：

- `api/posts`：公开文章读取
- `api/posts/[id]/views`：公开浏览量记录
- `api/admin/posts`：后台文章列表和创建
- `api/admin/posts/[id]`：后台文章更新和删除
- `api/categories`、`api/tags`、`api/friend-links`：分类、标签、友链接口
- `api/search`：公开搜索
- `api/stats`：后台统计
- `api/upload`：后台上传
- `api/ai/*`：后台 AI 能力

Route Handler 应保持薄层：参数解析、鉴权、校验、调用 service/query、返回统一响应。

## `src/components/`

```text
src/components/
├── admin/             # 后台表单、Hook 和管理页复用组件
├── layout/            # 前台/后台布局组件
├── post/              # 文章展示相关组件
├── seo/               # SEO 输出组件
└── ui/                # 通用 UI 组件
```

放置原则：

- 只服务后台的组件放 `components/admin/`
- 文章展示组件放 `components/post/`
- 布局导航类组件放 `components/layout/`
- 跨业务通用 UI 放 `components/ui/`
- 不把数据库查询或持久化逻辑放进组件

## `src/lib/`

`lib/` 是业务边界最重要的目录，按职责分为基础设施、领域查询、后台服务和客户端辅助。

```text
src/lib/
├── admin/             # 后台客户端请求辅助
├── ai/                # AI service、prompt、provider、normalizer
├── api/               # Route Handler 通用辅助
├── auth/              # 登录凭据处理和审计
├── posts/             # 文章查询、后台服务、浏览量服务
├── taxonomies/        # 分类/标签查询和后台服务
├── friend-links/      # 友链查询和后台服务
├── pages/             # 单页内容查询
├── search/            # 搜索查询构造和搜索服务
├── stats/             # 后台统计服务
├── prisma.ts          # Prisma Client 单例
├── redis.ts           # Redis Client 单例
├── rate-limit.ts      # Redis 限流器
├── response.ts        # API 响应工具
├── validations.ts     # Zod schema
└── utils.ts           # 通用工具
```

### 查询与服务命名

- `queries.ts`：公开读取或页面读取，通常只读
- `admin-service.ts`：后台写入、冲突检查、删除等管理能力
- `service.ts`：领域服务或聚合服务
- `*-client.ts`：浏览器端调用 API 的辅助函数

### 数据访问规则

- Prisma 只应出现在 `src/lib/*`、认证入口或 seed 脚本中
- 公开页查询必须固定公开可见性，例如只读取已发布文章
- 后台写操作必须经过鉴权、Zod 校验和业务冲突检查
- API 响应统一通过 `src/lib/response.ts`

## `src/types/`

存放跨模块共享类型。仅在多个模块都会引用时放到这里；局部页面或局部服务使用的类型应就近定义。

## 测试文件

测试文件使用 `*.test.ts` 后缀，并尽量与被测模块放在相同目录。

示例：

```text
src/lib/search/query.ts
src/lib/search/query.test.ts
```

`pnpm test` 会通过 `scripts/test.mjs` 自动收集 `src/**/*.test.ts`。

## 新增代码放置建议

- 新公开页面：放 `src/app/(public)/...`，数据读取放 `src/lib/*/queries.ts`
- 新后台页面：放 `src/app/admin/...`，复用 `components/admin/` 和 `lib/admin/`
- 新后台接口：优先放 `src/app/api/admin/...`
- 新公开接口：放 `src/app/api/...`，必须明确公开可见性边界
- 新数据库写入逻辑：放对应领域的 `admin-service.ts` 或 `service.ts`
- 新 AI 能力：按任务拆到 `src/lib/ai/prompts`、`providers`、`normalizers` 和 `service.ts`
- 新通用组件：确认是否真的跨业务复用，再放 `components/ui/`

## 不建议的做法

- 在页面或组件里直接写 Prisma 查询
- 在公开 API 中通过参数控制草稿/后台数据可见性
- 为了兼容旧路径保留重复 API
- 把一次性页面状态抽成过度通用的配置式 CRUD
- 在前端注入数据库生成的 HTML

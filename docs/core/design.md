# WayBlog 系统设计

## 总体结构

WayBlog 是一个单体 Next.js 应用，前台页面、后台页面和 API 路由都在同一个仓库中。

```text
Browser
  -> Next.js App Router
     -> Public Pages
     -> Admin Pages
     -> API Route Handlers
     -> Domain Services / Queries
     -> Prisma
     -> PostgreSQL
```

## 设计原则

- 单体优先：降低部署和维护复杂度
- 服务端优先：公开内容页尽量由服务端直接查库渲染
- 客户端最小化：后台交互页再使用客户端组件
- 工具轻量化：优先使用 Next.js、Prisma、Zod、NextAuth 自带能力
- 薄路由优先：Route Handler 只负责鉴权、校验和响应组装，业务查询与写入下沉到 `lib/*/service.ts` 或 `lib/*/queries.ts`

## 路由划分

### 公开路由

- `/`
- `/posts/[slug]`
- `/pages/[slug]`
- `/categories/[slug]`
- `/tags`
- `/tags/[slug]`
- `/archives`
- `/search`
- `/about`（兼容旧入口，重定向到 `/pages/about`）
- `/friends`

### 后台路由

- `/admin/login`
- `/admin/dashboard`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/[id]/edit`
- `/admin/pages`
- `/admin/pages/new`
- `/admin/pages/[id]/edit`
- `/admin/categories`
- `/admin/tags`
- `/admin/friend-links`
- `/admin/settings`

### API 路由

- `/api/auth/[...nextauth]`
- `/api/admin/account`
- `/api/posts`
- `/api/admin/posts`
- `/api/admin/posts/[id]`
- `/api/admin/pages`
- `/api/admin/pages/[id]`
- `/api/admin/categories`
- `/api/admin/categories/[id]`
- `/api/admin/tags`
- `/api/admin/tags/[id]`
- `/api/admin/friend-links`
- `/api/admin/friend-links/[id]`
- `/api/posts/[id]/views`
- `/api/search`
- `/api/stats`
- `/api/upload`

## 渲染策略

### 动态服务端页面

以下页面当前使用按请求渲染，减少构建期对数据库的硬依赖：

- 首页
- 文章详情页
- 分类页
- 标签页
- 归档页
- 关于页
- 友链页
- RSS
- sitemap

### 静态或客户端页面

- 后台管理页主要为客户端交互页面
- 搜索页通过服务端壳 + `Suspense` 包裹客户端搜索组件实现

## 鉴权设计

- 使用 NextAuth v5
- 登录方式为 `Credentials`
- Session 策略为 JWT
- `src/proxy.ts` 保护 `/admin/:path*`
- API 写操作通过 `src/lib/api/admin.ts` 中的 `requireAdminAccess()` 统一保护，底层仍复用 NextAuth 会话

## 数据访问

### 公开内容页

公开内容页仍然由 Server Component 直接渲染，但不再在页面中直接调用 Prisma。
页面通过 `src/lib/*/queries.ts` 读取数据，例如：

- `src/lib/posts/queries.ts`：公开文章列表、文章详情、归档、RSS、sitemap 所需文章数据
- `src/lib/taxonomies/queries.ts`：公开分类/标签读取
- `src/lib/friend-links/queries.ts`：公开友链读取
- `src/lib/pages/queries.ts`：公开单页内容读取与导航单页查询

这样可以把“只读取已发布文章”“公开页排序规则”“SEO 所需字段”等边界固定在查询层，而不是散落在页面组件里。

### 后台页面

后台页面通过 `fetch('/api/admin/...')` 或受保护的后台接口调用 Route Handlers，便于统一鉴权和输入校验。

后台页面的重复列表拉取、保存和删除逻辑集中在：

- `src/components/admin/use-admin-resource-list.ts`
- `src/lib/admin/client.ts`
- `src/lib/admin/post-client.ts`

文章编辑页拆分为字段状态、元数据加载、AI 协调和 UI 区块，避免单个表单组件继续承担所有职责。

设置页单独负责当前管理员的资料维护和密码修改，不承担多账号或复杂权限模型。

### API 与服务层

API Route Handler 保持轻量，主要负责：

- 读取路径参数或查询参数
- 执行 Zod 校验
- 执行登录鉴权
- 调用对应 service / query
- 通过 `src/lib/response.ts` 返回统一 JSON 响应

当前主要服务层：

- `src/lib/posts/admin-service.ts`：文章后台列表、创建、更新、删除、slug 冲突检查，供 `/api/admin/posts*` 调用
- `src/lib/posts/views-service.ts`：文章浏览量、PV/UV 聚合
- `src/lib/taxonomies/admin-service.ts`：分类/标签后台 CRUD 和冲突检查
- `src/lib/friend-links/admin-service.ts`：友链后台 CRUD
- `src/lib/search/service.ts`：站内搜索查询、高亮和结果组装
- `src/lib/stats/service.ts`：后台仪表盘统计聚合

## Markdown 方案

- `react-markdown`
- `remark-gfm`
- `rehype-highlight`
- `rehype-sanitize`
- `rehype-slug`

能力包括：

- GFM
- 代码高亮
- 标题锚点
- XSS 基础过滤

## 搜索方案

- 搜索范围覆盖已发布文章的标题、正文、分类和标签
- 查询按关键词匹配实现，每个关键词都必须至少命中一个字段
- 搜索摘要在应用层生成结构化高亮片段，前端不注入 HTML
- 搜索结果按字段权重排序，再以发布时间倒序兜底
- 搜索接口带有限流

## 统计方案

- 每次文章详情页访问会调用 `/api/posts/[id]/views`
- 使用 `PageView` 记录按日聚合的 PV/UV
- `Post.viewCount` 保存总浏览量
- UV 去重采用 Redis Set 按天记录，同一访客在多实例部署下也只计一次 UV

## 上传方案

- 文件类型限制：jpg、png、gif、webp
- 文件大小限制：默认 5MB
- 存储位置：`public/uploads/{yyyy-MM}/`
- 返回可直接用于 Markdown 的 URL

## 代码组织

- `app/`：路由与页面
- `components/`：可复用组件
- `lib/`：鉴权、Prisma、校验、API 工具、限流、领域查询与服务层
- `prisma/`：schema、迁移、种子数据

## 当前设计边界

- 适合单机部署
- 多实例部署需要共享 PostgreSQL 与 Redis，并通过 `REDIS_KEY_PREFIX` 隔离不同环境的运行期 key
- 不适合大规模图片存储
- 搜索能力当前针对个人博客体量优化，不包含独立搜索引擎的高级召回能力

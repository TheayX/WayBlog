# WayBlog 系统设计

## 总体结构

WayBlog 是一个单体 Next.js 应用，前台页面、后台页面和 API 路由都在同一个仓库中。

```text
Browser
  -> Next.js App Router
     -> Public Pages
     -> Admin Pages
     -> API Route Handlers
     -> Prisma
     -> PostgreSQL
```

## 设计原则

- 单体优先：降低部署和维护复杂度
- 服务端优先：公开内容页尽量由服务端直接查库渲染
- 客户端最小化：后台交互页再使用客户端组件
- 工具轻量化：优先使用 Next.js、Prisma、Zod、NextAuth 自带能力

## 路由划分

### 公开路由

- `/`
- `/posts/[slug]`
- `/categories/[slug]`
- `/tags`
- `/tags/[slug]`
- `/archives`
- `/search`
- `/about`
- `/friends`

### 后台路由

- `/admin/login`
- `/admin/dashboard`
- `/admin/posts`
- `/admin/posts/new`
- `/admin/posts/[id]/edit`
- `/admin/categories`
- `/admin/tags`
- `/admin/friend-links`

### API 路由

- `/api/auth/[...nextauth]`
- `/api/posts`
- `/api/posts/[id]`
- `/api/posts/[id]/views`
- `/api/categories`
- `/api/categories/[id]`
- `/api/tags`
- `/api/tags/[id]`
- `/api/friend-links`
- `/api/friend-links/[id]`
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
- API 写操作通过 `requireAuth()` 保护

## 数据访问

### 公开内容页

公开内容页通常直接在 Server Component 中调用 Prisma，避免额外的 HTTP 请求。

### 后台页面

后台页面通过 `fetch('/api/...')` 调用 Route Handlers，便于统一鉴权和输入校验。

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

- 使用 PostgreSQL 全文搜索
- 通过 raw SQL 查询 `to_tsquery`、`ts_rank`、`ts_headline`
- 目前只搜索已发布文章
- 搜索接口带有限流

## 统计方案

- 每次文章详情页访问会调用 `/api/posts/[id]/views`
- 使用 `PageView` 记录按日聚合的 PV/UV
- `Post.viewCount` 保存总浏览量
- UV 去重当前采用内存缓存，适合单机部署

## 上传方案

- 文件类型限制：jpg、png、gif、webp
- 文件大小限制：默认 5MB
- 存储位置：`public/uploads/{yyyy-MM}/`
- 返回可直接用于 Markdown 的 URL

## 代码组织

- `app/`：路由与页面
- `components/`：可复用组件
- `lib/`：鉴权、Prisma、校验、API 工具、限流
- `prisma/`：schema、迁移、种子数据

## 当前设计边界

- 适合单机部署
- 不适合多实例共享 UV 内存缓存
- 不适合大规模图片存储
- 搜索精度受 PostgreSQL 当前配置限制

# WayBlog — API 接口文档

> 版本：v1.0 | 更新日期：2026-02-28 | 状态：待确认

---

## 1. 通用约定

### 1.1 Base URL

| 环境 | URL |
|------|-----|
| 开发 | `http://localhost:3000/api` |
| 生产 | `https://yourdomain.com/api` |

### 1.2 请求格式

- Content-Type: `application/json`（文件上传除外）
- 文件上传使用 `multipart/form-data`

### 1.3 认证方式

- 使用 **NextAuth Session Cookie**（JWT 策略）
- 需认证的接口标记为 🔒
- 未认证访问受保护接口返回 `401`

### 1.4 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从 1 开始） |
| `pageSize` | number | 10 | 每页条数（最大 50） |

### 1.5 通用响应格式

**成功**：

```json
{
  "data": { ... },
  "total": 100,       // 分页接口包含
  "page": 1,          // 分页接口包含
  "pageSize": 10      // 分页接口包含
}
```

**错误**：

```json
{
  "error": "错误描述信息",
  "details": { ... }   // 可选，字段校验详情
}
```

### 1.6 HTTP 状态码

| 状态码 | 含义 |
|--------|------|
| 200 | 成功 |
| 201 | 创建成功 |
| 204 | 删除成功（无内容） |
| 400 | 请求参数错误 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 409 | 冲突（如 slug 重复） |
| 413 | 文件过大 |
| 429 | 请求过于频繁（限流） |
| 500 | 服务器内部错误 |

---

## 2. 认证 API

由 **NextAuth.js** 内置提供，无需手动实现。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/auth/session` | 获取当前 Session |
| POST | `/api/auth/signin/credentials` | 邮箱+密码登录 |
| POST | `/api/auth/signout` | 退出登录 |
| GET | `/api/auth/csrf` | 获取 CSRF Token |

---

## 3. 文章 API

### 3.1 获取文章列表

```
GET /api/posts
```

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 10 |
| `status` | string | 否 | `DRAFT` / `PUBLISHED`（🔒 仅管理员可传 DRAFT） |
| `categoryId` | string | 否 | 按分类筛选 |
| `tagId` | string | 否 | 按标签筛选 |
| `pinned` | boolean | 否 | 仅返回置顶文章 |

**权限说明**：
- 未认证：只返回 `status = PUBLISHED` 的文章
- 已认证（管理员）：可查看所有状态文章

**成功响应** `200`：

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "文章标题",
      "slug": "article-slug",
      "excerpt": "文章摘要...",
      "coverImage": "/uploads/2026-02/cover.webp",
      "status": "PUBLISHED",
      "pinned": false,
      "publishedAt": "2026-02-28T00:00:00.000Z",
      "viewCount": 42,
      "category": {
        "id": "uuid",
        "name": "技术",
        "slug": "tech"
      },
      "tags": [
        { "id": "uuid", "name": "Next.js", "slug": "nextjs" }
      ],
      "createdAt": "2026-02-28T00:00:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "pageSize": 10
}
```

**排序规则**：`pinned DESC, publishedAt DESC`（置顶优先，然后按发布时间倒序）

---

### 3.2 获取单篇文章

```
GET /api/posts/[id]
```

**路径参数**：

| 参数 | 类型 | 说明 |
|------|------|------|
| `id` | string | 文章 ID（UUID） |

**成功响应** `200`：

```json
{
  "data": {
    "id": "uuid",
    "title": "文章标题",
    "slug": "article-slug",
    "content": "# 完整 Markdown 内容...",
    "excerpt": "摘要",
    "coverImage": "/uploads/2026-02/cover.webp",
    "status": "PUBLISHED",
    "pinned": false,
    "publishedAt": "2026-02-28T00:00:00.000Z",
    "viewCount": 42,
    "author": {
      "id": "uuid",
      "name": "博主名",
      "avatar": null
    },
    "category": {
      "id": "uuid",
      "name": "技术",
      "slug": "tech"
    },
    "tags": [
      { "id": "uuid", "name": "Next.js", "slug": "nextjs" }
    ],
    "createdAt": "2026-02-28T00:00:00.000Z",
    "updatedAt": "2026-02-28T00:00:00.000Z"
  }
}
```

**错误**：`404` 文章不存在

> **备注**：前台文章详情页通过 Server Component 直接调用 Prisma（按 `slug` 查询），不走此 API。此端点主要供后台编辑使用。

---

### 3.3 创建文章 🔒

```
POST /api/posts
```

**Request Body**：

```json
{
  "title": "文章标题",
  "slug": "article-slug",
  "content": "# Markdown 内容",
  "excerpt": "摘要（可选）",
  "coverImage": "/uploads/2026-02/cover.webp",
  "status": "DRAFT",
  "pinned": false,
  "categoryId": "uuid 或 null",
  "tagIds": ["uuid1", "uuid2"]
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `title` | string | ✅ | 1-255 字符 |
| `slug` | string | ✅ | 1-255 字符，仅允许 `[a-z0-9-]`，UNIQUE |
| `content` | string | 否 | — |
| `excerpt` | string | 否 | ≤ 500 字符 |
| `coverImage` | string | 否 | 合法 URL 路径 |
| `status` | string | 否 | `DRAFT` / `PUBLISHED`，默认 `DRAFT` |
| `pinned` | boolean | 否 | 默认 `false` |
| `categoryId` | string | 否 | 有效的 Category UUID |
| `tagIds` | string[] | 否 | 有效的 Tag UUID 数组 |

**业务逻辑**：
- 若 `status = PUBLISHED` 且 `publishedAt` 为空，自动设置 `publishedAt = now()`
- `slug` 重复返回 `409`

**成功响应** `201`：返回完整 Post 对象

**错误**：`400` 参数校验失败 / `409` slug 重复

---

### 3.4 更新文章 🔒

```
PUT /api/posts/[id]
```

**Request Body**：同创建，所有字段可选（partial update）。

**业务逻辑**：
- 草稿改为发布：自动设置 `publishedAt`（若为空）
- 发布改为草稿：保留 `publishedAt` 不清空

**成功响应** `200`：返回更新后的完整 Post 对象

**错误**：`400` / `404` / `409`

---

### 3.5 删除文章 🔒

```
DELETE /api/posts/[id]
```

**业务逻辑**：
- 级联删除关联的 PageView 记录
- 自动解除 Tag 关联

**成功响应** `204`：无返回内容

**错误**：`404` 文章不存在

---

### 3.6 记录文章浏览量

```
POST /api/posts/[id]/views
```

**认证**：不需要（公开）

**Request Body**：无（服务端从请求头提取 IP 和 User-Agent）

**业务逻辑**：
1. 获取请求 IP（`X-Real-IP` / `X-Forwarded-For`）
2. 计算当前日期
3. 查找或创建 `PageView` 记录（`postId + date` 唯一）
4. PV 计数 +1
5. 检查 IP 是否今日首次访问（内存缓存），若是则 UV +1
6. 同步更新 `Post.viewCount`

**成功响应** `200`：

```json
{
  "data": {
    "viewCount": 43
  }
}
```

**限流**：每 IP 每篇文章每秒最多 1 次

---

## 4. 分类 API

### 4.1 获取分类列表

```
GET /api/categories
```

**认证**：不需要

**成功响应** `200`：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "技术",
      "slug": "tech",
      "description": "技术文章",
      "postCount": 15,
      "createdAt": "2026-02-28T00:00:00.000Z"
    }
  ]
}
```

> `postCount` 通过 `_count` 聚合查询获取，仅统计已发布文章。

---

### 4.2 创建分类 🔒

```
POST /api/categories
```

**Request Body**：

```json
{
  "name": "分类名称",
  "slug": "category-slug",
  "description": "分类描述（可选）"
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `name` | string | ✅ | 1-100 字符，UNIQUE |
| `slug` | string | ✅ | 1-100 字符，`[a-z0-9-]`，UNIQUE |
| `description` | string | 否 | ≤ 500 字符 |

**成功响应** `201`：返回 Category 对象

**错误**：`400` / `409`

---

### 4.3 更新分类 🔒

```
PUT /api/categories/[id]
```

**Request Body**：同创建，所有字段可选。

**成功响应** `200`：返回更新后的 Category 对象

---

### 4.4 删除分类 🔒

```
DELETE /api/categories/[id]
```

**业务逻辑**：
- 删除分类后，原属于该分类的文章 `categoryId` 设为 `NULL`（不级联删除文章）

**成功响应** `204`

**错误**：`404`

---

## 5. 标签 API

### 5.1 获取标签列表

```
GET /api/tags
```

**认证**：不需要

**成功响应** `200`：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Next.js",
      "slug": "nextjs",
      "postCount": 8,
      "createdAt": "2026-02-28T00:00:00.000Z"
    }
  ]
}
```

---

### 5.2 创建标签 🔒

```
POST /api/tags
```

**Request Body**：

```json
{
  "name": "标签名称",
  "slug": "tag-slug"
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `name` | string | ✅ | 1-100 字符，UNIQUE |
| `slug` | string | ✅ | 1-100 字符，`[a-z0-9-]`，UNIQUE |

**成功响应** `201`

---

### 5.3 更新标签 🔒

```
PUT /api/tags/[id]
```

**Request Body**：同创建，所有字段可选。

**成功响应** `200`

---

### 5.4 删除标签 🔒

```
DELETE /api/tags/[id]
```

**业务逻辑**：自动解除与文章的多对多关联（不影响文章本身）

**成功响应** `204`

---

## 6. 图片上传 API

### 6.1 上传图片 🔒

```
POST /api/upload
```

**Content-Type**：`multipart/form-data`

**Form 字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `file` | File | 图片文件 |

**校验规则**：
- 大小：≤ 5MB
- 格式：`image/jpeg`, `image/png`, `image/gif`, `image/webp`

**成功响应** `201`：

```json
{
  "data": {
    "url": "/uploads/2026-02/a1b2c3d4-e5f6-7890.webp",
    "filename": "a1b2c3d4-e5f6-7890.webp",
    "size": 204800
  }
}
```

**存储路径**：`public/uploads/{yyyy-MM}/{uuid}.{ext}`

**错误**：
- `400` 无文件或格式不支持
- `413` 文件过大

---

## 7. 搜索 API

### 7.1 搜索文章

```
GET /api/search
```

**认证**：不需要

**Query 参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `q` | string | ✅ | 搜索关键词（1-100 字符） |
| `page` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页条数，默认 10 |

**成功响应** `200`：

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "文章标题",
      "slug": "article-slug",
      "highlight": "...包含<mark>关键词</mark>的摘要片段...",
      "publishedAt": "2026-02-28T00:00:00.000Z",
      "category": {
        "name": "技术",
        "slug": "tech"
      },
      "tags": [
        { "name": "Next.js", "slug": "nextjs" }
      ]
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 10
}
```

**实现**：
- 使用 `to_tsquery('simple', ...)` 构建查询
- 使用 `ts_rank` 按相关度排序
- 使用 `ts_headline` 生成高亮摘要
- 仅搜索 `status = PUBLISHED` 的文章

**限流**：每 IP 每分钟最多 30 次

---

## 8. 友链 API

### 8.1 获取友链列表

```
GET /api/friend-links
```

**认证**：不需要

**成功响应** `200`：

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "友站名称",
      "url": "https://example.com",
      "avatar": "https://example.com/avatar.png",
      "description": "友站描述",
      "sortOrder": 0
    }
  ]
}
```

**排序**：`sortOrder ASC, createdAt DESC`

---

### 8.2 创建友链 🔒

```
POST /api/friend-links
```

**Request Body**：

```json
{
  "name": "友站名称",
  "url": "https://example.com",
  "avatar": "https://example.com/avatar.png",
  "description": "友站描述",
  "sortOrder": 0
}
```

| 字段 | 类型 | 必填 | 校验规则 |
|------|------|------|----------|
| `name` | string | ✅ | 1-100 字符 |
| `url` | string | ✅ | 合法 URL |
| `avatar` | string | 否 | 合法 URL |
| `description` | string | 否 | ≤ 500 字符 |
| `sortOrder` | number | 否 | 整数，默认 0 |

**成功响应** `201`

---

### 8.3 更新友链 🔒

```
PUT /api/friend-links/[id]
```

**Request Body**：同创建，所有字段可选。

**成功响应** `200`

---

### 8.4 删除友链 🔒

```
DELETE /api/friend-links/[id]
```

**成功响应** `204`

---

## 9. 统计 API

### 9.1 获取仪表盘统计 🔒

```
GET /api/stats
```

**成功响应** `200`：

```json
{
  "data": {
    "totalPosts": 25,
    "totalPublished": 20,
    "totalDrafts": 5,
    "totalCategories": 4,
    "totalTags": 12,
    "totalViews": 1580,
    "recentViews": [
      { "date": "2026-02-28", "pv": 45, "uv": 30 },
      { "date": "2026-02-27", "pv": 52, "uv": 35 },
      { "date": "2026-02-26", "pv": 38, "uv": 25 }
    ],
    "topPosts": [
      {
        "id": "uuid",
        "title": "最热文章",
        "slug": "hot-post",
        "viewCount": 120
      }
    ]
  }
}
```

| 字段 | 说明 |
|------|------|
| `totalPosts` | 文章总数 |
| `totalPublished` | 已发布数 |
| `totalDrafts` | 草稿数 |
| `totalCategories` | 分类数 |
| `totalTags` | 标签数 |
| `totalViews` | 总浏览量 |
| `recentViews` | 最近 30 天每日 PV/UV |
| `topPosts` | 浏览量 Top 5 文章 |

---

## 10. RSS & Sitemap

### 10.1 RSS Feed

```
GET /feed.xml
```

**Content-Type**：`application/xml; charset=utf-8`

**格式**：RSS 2.0

**内容**：最近 20 篇已发布文章，包含 title / link / description / pubDate / guid

**实现**：Next.js Route Handler (`src/app/feed.xml/route.ts`)

---

### 10.2 Sitemap

```
GET /sitemap.xml
```

**Content-Type**：`application/xml`

**实现**：Next.js 内置 `sitemap.ts` 约定

**包含 URL**：
- `/` — 首页
- `/posts/[slug]` — 所有已发布文章
- `/categories/[slug]` — 所有分类
- `/tags/[slug]` — 所有标签
- `/archives` — 归档
- `/about` — 关于
- `/friends` — 友链

---

### 10.3 Robots.txt

```
GET /robots.txt
```

**实现**：Next.js 内置 `robots.ts` 约定

**内容**：

```
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: https://yourdomain.com/sitemap.xml
```

---

## 11. 前台页面数据获取说明

以下页面**不走 API Route**，而是通过 Server Component 直接调用 Prisma 查询（更高效，避免额外网络请求）：

| 页面 | 数据获取方式 |
|------|-------------|
| 首页文章列表 | Server Component → `prisma.post.findMany(...)` |
| 文章详情 | Server Component → `prisma.post.findUnique({ where: { slug } })` |
| 分类/标签筛选 | Server Component → Prisma 查询 |
| 归档 | Server Component → Prisma 按年月分组 |
| About | Server Component → `prisma.page.findUnique({ where: { slug: 'about' } })` |
| 友链 | Server Component → `prisma.friendLink.findMany(...)` |
| 搜索 | Server Component → Prisma raw SQL 全文检索（或调用搜索 API） |

**后台页面** 全部使用 Client Component + `fetch('/api/...')` 调用 API Route。

---

## 12. Rate Limiting 策略

| 端点 | 限制 |
|------|------|
| `POST /api/auth/signin` | 5 次/分钟/IP（防暴力破解） |
| `POST /api/posts/[id]/views` | 1 次/秒/IP/文章（防刷浏览量） |
| `GET /api/search` | 30 次/分钟/IP |
| 其他 API | 60 次/分钟/IP |

**实现方案**：基于内存的滑动窗口计数器（MVP 足够，不引入 Redis）。


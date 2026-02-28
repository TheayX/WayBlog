# WayBlog — 数据库设计文档

> 版本：v1.0 | 更新日期：2026-02-28 | 状态：待确认

---

## 1. 实体关系概览

```
┌──────────┐ 1    N ┌──────────┐ M    N ┌──────────┐
│   User   │───────→│   Post   │←──────→│   Tag    │
└──────────┘        └──────────┘        └──────────┘
                         │ N                  (通过 _PostToTag 隐式关联表)
                         │
                    1    │
                ┌────────┘
                ▼
           ┌──────────┐
           │ Category  │
           └──────────┘

┌──────────┐ N    1 ┌──────────┐
│ PageView │───────→│   Post   │
└──────────┘        └──────────┘

┌──────────────┐    ┌──────────┐
│  FriendLink  │    │   Page   │    (独立表，无外键关联)
└──────────────┘    └──────────┘
```

**关系说明**：

| 关系 | 类型 | 说明 |
|------|------|------|
| User → Post | 一对多 | 一个用户创建多篇文章（实际只有 1 个管理员） |
| Category → Post | 一对多 | 一个分类包含多篇文章，文章可不属于任何分类 |
| Post ↔ Tag | 多对多 | 通过 Prisma 隐式关联表 `_PostToTag` 实现 |
| Post → PageView | 一对多 | 每篇文章每天一条 PV/UV 统计记录 |
| FriendLink | 独立 | 友情链接，无外键关联 |
| Page | 独立 | 自定义页面（About 等），无外键关联 |

---

## 2. 表定义

### 2.1 User（管理员用户表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | — | 登录邮箱 |
| `passwordHash` | VARCHAR(255) | NOT NULL | — | bcrypt 加密密码 |
| `name` | VARCHAR(100) | NOT NULL | — | 显示名称 |
| `avatar` | VARCHAR(500) | NULLABLE | `NULL` | 头像 URL |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | TIMESTAMP | NOT NULL | `auto update` | 更新时间 |

**索引**：
- `User_email_key` — UNIQUE 索引

---

### 2.2 Post（文章表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `title` | VARCHAR(255) | NOT NULL | — | 文章标题 |
| `slug` | VARCHAR(255) | UNIQUE, NOT NULL | — | URL 标识符 |
| `content` | TEXT | NOT NULL | `''` | Markdown 正文内容 |
| `excerpt` | VARCHAR(500) | NULLABLE | `NULL` | 摘要（为空时前台截取 content 前 200 字） |
| `coverImage` | VARCHAR(500) | NULLABLE | `NULL` | 封面图 URL |
| `status` | ENUM(PostStatus) | NOT NULL | `'DRAFT'` | 文章状态：DRAFT / PUBLISHED |
| `pinned` | BOOLEAN | NOT NULL | `false` | 是否置顶 |
| `publishedAt` | TIMESTAMP | NULLABLE | `NULL` | 发布时间（发布时设置，草稿为空） |
| `viewCount` | INTEGER | NOT NULL | `0` | 总浏览量（冗余字段，从 PageView 汇总同步） |
| `authorId` | UUID | FK → User.id, NOT NULL | — | 作者 ID |
| `categoryId` | UUID | FK → Category.id, NULLABLE | `NULL` | 分类 ID（可不分类） |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | TIMESTAMP | NOT NULL | `auto update` | 更新时间 |

> `search_vector` (tsvector) 列通过 raw SQL migration 添加，不在 Prisma Schema 中定义。

**索引**：
- `Post_slug_key` — UNIQUE 索引
- `Post_status_publishedAt_idx` — 复合索引（列表查询优化：`WHERE status = 'PUBLISHED' ORDER BY publishedAt DESC`）
- `Post_categoryId_idx` — 索引（分类筛选）
- `Post_authorId_idx` — 索引（作者筛选）
- `Post_search_vector_idx` — GIN 索引（全文检索）
- `Post_pinned_publishedAt_idx` — 复合索引（置顶 + 时间排序）

---

### 2.3 Category（分类表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | — | 分类名称 |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | — | URL 标识符 |
| `description` | VARCHAR(500) | NULLABLE | `NULL` | 分类描述 |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |

**索引**：
- `Category_name_key` — UNIQUE 索引
- `Category_slug_key` — UNIQUE 索引

---

### 2.4 Tag（标签表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `name` | VARCHAR(100) | UNIQUE, NOT NULL | — | 标签名称 |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | — | URL 标识符 |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |

**索引**：
- `Tag_name_key` — UNIQUE 索引
- `Tag_slug_key` — UNIQUE 索引

---

### 2.5 _PostToTag（文章-标签隐式关联表）

> 由 Prisma 自动生成和管理，无需手动创建。

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `A` | UUID | FK → Post.id | 文章 ID |
| `B` | UUID | FK → Tag.id | 标签 ID |

**索引**：
- `_PostToTag_AB_unique` — UNIQUE (A, B)
- `_PostToTag_B_index` — 索引 (B)

---

### 2.6 PageView（页面浏览统计表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `postId` | UUID | FK → Post.id, NOT NULL | — | 文章 ID |
| `date` | DATE | NOT NULL | — | 统计日期 |
| `pvCount` | INTEGER | NOT NULL | `0` | 当日页面浏览量 |
| `uvCount` | INTEGER | NOT NULL | `0` | 当日独立访客数 |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | TIMESTAMP | NOT NULL | `auto update` | 更新时间 |

**索引**：
- `PageView_postId_date_key` — UNIQUE (postId, date)（每篇文章每天一条记录）
- `PageView_postId_idx` — 索引（按文章查询）

**UV 去重逻辑**（应用层实现，不存明细）：
- 服务端获取请求 IP + User-Agent
- 使用内存缓存（Map 或简单对象）记录 `{postId}:{date}:{ip_hash}` 是否已计数
- 已存在 → 只增 PV；不存在 → PV + UV 都增加
- 每日零点清理缓存（或使用 TTL）

---

### 2.7 FriendLink（友链表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `name` | VARCHAR(100) | NOT NULL | — | 站点名称 |
| `url` | VARCHAR(500) | NOT NULL | — | 站点 URL |
| `avatar` | VARCHAR(500) | NULLABLE | `NULL` | 站点图标 |
| `description` | VARCHAR(500) | NULLABLE | `NULL` | 站点描述 |
| `sortOrder` | INTEGER | NOT NULL | `0` | 排序权重（越小越靠前） |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |

**索引**：
- `FriendLink_sortOrder_idx` — 索引（排序查询）

---

### 2.8 Page（自定义页面表）

| 字段 | 类型 | 约束 | 默认值 | 说明 |
|------|------|------|--------|------|
| `id` | UUID | PK | `uuid_generate_v4()` | 主键 |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | — | URL 标识符（如 `about`） |
| `title` | VARCHAR(255) | NOT NULL | — | 页面标题 |
| `content` | TEXT | NOT NULL | `''` | Markdown 内容 |
| `createdAt` | TIMESTAMP | NOT NULL | `now()` | 创建时间 |
| `updatedAt` | TIMESTAMP | NOT NULL | `auto update` | 更新时间 |

**索引**：
- `Page_slug_key` — UNIQUE 索引

---

## 3. Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── 枚举 ───

enum PostStatus {
  DRAFT
  PUBLISHED
}

// ─── 模型 ───

model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  name         String
  avatar       String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  posts Post[]
}

model Post {
  id          String     @id @default(uuid())
  title       String
  slug        String     @unique
  content     String     @default("")
  excerpt     String?
  coverImage  String?
  status      PostStatus @default(DRAFT)
  pinned      Boolean    @default(false)
  publishedAt DateTime?
  viewCount   Int        @default(0)

  authorId   String
  author     User      @relation(fields: [authorId], references: [id])
  categoryId String?
  category   Category? @relation(fields: [categoryId], references: [id])
  tags       Tag[]     // Prisma 隐式多对多

  pageViews PageView[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // search_vector tsvector 列通过 raw SQL migration 管理

  @@index([status, publishedAt])
  @@index([pinned, publishedAt])
  @@index([categoryId])
  @@index([authorId])
}

model Category {
  id          String   @id @default(uuid())
  name        String   @unique
  slug        String   @unique
  description String?
  createdAt   DateTime @default(now())

  posts Post[]
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique
  slug      String   @unique
  createdAt DateTime @default(now())

  posts Post[] // Prisma 隐式多对多
}

model PageView {
  id        String   @id @default(uuid())
  postId    String
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  date      DateTime @db.Date
  pvCount   Int      @default(0)
  uvCount   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([postId, date])
  @@index([postId])
}

model FriendLink {
  id          String   @id @default(uuid())
  name        String
  url         String
  avatar      String?
  description String?
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())

  @@index([sortOrder])
}

model Page {
  id        String   @id @default(uuid())
  slug      String   @unique
  title     String
  content   String   @default("")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

## 4. tsvector 全文检索（Raw SQL Migration）

Prisma 不原生支持 `tsvector` 类型，需要通过手动 SQL migration 来添加。

### 4.1 创建 migration

在 `prisma migrate dev` 生成初始 migration 后，手动创建一个新 migration：

```bash
mkdir -p prisma/migrations/20260228000001_add_search_vector
```

### 4.2 migration.sql

```sql
-- prisma/migrations/20260228000001_add_search_vector/migration.sql

-- 1. 添加 search_vector 列
ALTER TABLE "Post" ADD COLUMN "search_vector" tsvector;

-- 2. 创建 GIN 索引
CREATE INDEX "Post_search_vector_idx" ON "Post" USING GIN ("search_vector");

-- 3. 创建触发器函数
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 创建触发器
CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, content ON "Post"
  FOR EACH ROW
  EXECUTE FUNCTION post_search_vector_update();

-- 5. 填充已有数据的 search_vector
UPDATE "Post" SET search_vector =
  setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(content, '')), 'B');
```

**说明**：
- `'simple'` 分词配置：适用于多语言，中文按字拆分（后续可升级为 `zhparser`）
- `setweight('A')` 标题权重高，`setweight('B')` 内容权重低
- 触发器仅在 `title` 或 `content` 字段变更时触发，减少不必要的计算

---

## 5. Seed 脚本

```typescript
// prisma/seed.ts (伪代码，描述种子数据结构)

// 1. 创建管理员
User: {
  email: process.env.ADMIN_EMAIL,
  passwordHash: bcrypt.hash(process.env.ADMIN_PASSWORD, 12),
  name: "博主名",
  avatar: null
}

// 2. 创建示例分类
Categories: [
  { name: "技术", slug: "tech", description: "技术文章" },
  { name: "生活", slug: "life", description: "生活随笔" },
  { name: "学习", slug: "learning", description: "学习笔记" }
]

// 3. 创建示例标签
Tags: [
  { name: "JavaScript", slug: "javascript" },
  { name: "TypeScript", slug: "typescript" },
  { name: "React",      slug: "react" },
  { name: "Next.js",    slug: "nextjs" },
  { name: "PostgreSQL",  slug: "postgresql" }
]

// 4. 创建示例文章
Post: {
  title: "欢迎来到 WayBlog",
  slug: "welcome-to-wayblog",
  content: "# 欢迎\n\n这是第一篇文章...",
  status: "PUBLISHED",
  publishedAt: new Date(),
  categoryId: → "技术",
  tags: → ["Next.js", "TypeScript"]
}

// 5. 创建 About 页面
Page: {
  slug: "about",
  title: "关于我",
  content: "# 关于我\n\n在这里介绍自己..."
}
```

---

## 6. 数据量预估与扩展考虑

| 表 | MVP 期间预估 | 1 年后预估 | 说明 |
|---|---|---|---|
| User | 1 | 1 | 始终单管理员 |
| Post | 10-30 | 100-300 | 个人博客正常频率 |
| Category | 3-5 | 5-10 | 不会很多 |
| Tag | 10-20 | 30-50 | 中等增长 |
| PageView | ~300/月 | ~3,600/年 | 每篇文章每天 1 行 |
| FriendLink | 5-10 | 10-20 | 少量 |
| Page | 1-2 | 2-5 | 极少 |

> 数据量级较小，PostgreSQL 完全能够胜任。当前索引策略已足够，无需分表或读写分离。


# WayBlog — 系统设计文档

> 版本：v1.0 | 更新日期：2026-02-28 | 状态：待确认

---

## 1. 架构概览

```
┌──────────┐    HTTPS     ┌────────────────┐         ┌──────────────────────┐
│  Browser  │ ──────────→ │  Nginx / Caddy  │ ──────→ │  Next.js Standalone  │
│  (访客/   │ ←────────── │  (反代 + TLS)   │ ←────── │  (Node.js 服务)      │
│   博主)   │             └────────────────┘         │                      │
└──────────┘                                          │  ┌─ App Router ────┐ │
                                                      │  │ Server Comp.    │ │
                                                      │  │ Client Comp.    │ │
                                                      │  │ API Routes      │ │
                                                      │  └─────────────────┘ │
                                                      │         │            │
                                                      └─────────┼────────────┘
                                                                │ Prisma ORM
                                                                ▼
                                                      ┌──────────────────┐
                                                      │   PostgreSQL 16  │
                                                      │  (Docker 容器)    │
                                                      └──────────────────┘
```

**设计原则**：
- **单体全栈**：前后端在同一个 Next.js 项目中，降低部署和维护复杂度
- **SSG 优先**：文章等内容页使用 ISR 静态生成，后台页面使用 CSR
- **渐进增强**：MVP 先跑通核心流程，后续按需迭代增强

---

## 2. 技术选型

| 技术 | 选择 | 理由 | 备选方案 |
|------|------|------|----------|
| 框架 | **Next.js 15 (App Router)** | SSR/SSG/ISR 一体、API Routes 无需额外后端、React 生态 | Nuxt 3, Remix |
| 语言 | **TypeScript** | 类型安全、Prisma 类型推导、IDE 补全 | JavaScript |
| 数据库 | **PostgreSQL 16** | 功能全、内置全文检索、JSON 支持、云服务兼容好 | MySQL, SQLite |
| ORM | **Prisma** | 类型安全、自动迁移、直观 Schema 语法 | Drizzle, TypeORM |
| CSS | **Tailwind CSS 4** | 实用优先、原子类、暗色模式内置支持 | CSS Modules, styled-components |
| 认证 | **NextAuth.js v5 (Auth.js)** | Next.js 深度集成、JWT Session、Credentials Provider | Lucia, 自建 |
| Markdown | **react-markdown + rehype 插件** | 轻量、可扩展、Server Component 友好 | MDX, next-mdx-remote |
| 主题 | **next-themes** | 暗色模式实现标准方案、无闪烁 | 自建 |
| 包管理 | **pnpm** | 快速、磁盘高效 | npm, yarn |
| 部署 | **Docker + VPS** | 灵活可控、一键部署 | Vercel, Cloudflare |

---

## 3. 项目目录结构

```
WayBlog/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (public)/                 # 前台路由组（不影响 URL）
│   │   │   ├── layout.tsx            # 前台公共 Layout (Header + Footer)
│   │   │   ├── page.tsx              # 首页 — 文章列表
│   │   │   ├── posts/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # 文章详情页
│   │   │   ├── categories/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # 分类文章列表
│   │   │   ├── tags/
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx      # 标签文章列表
│   │   │   ├── archives/
│   │   │   │   └── page.tsx          # 归档页
│   │   │   ├── search/
│   │   │   │   └── page.tsx          # 搜索页
│   │   │   ├── about/
│   │   │   │   └── page.tsx          # 关于页
│   │   │   └── friends/
│   │   │       └── page.tsx          # 友链页
│   │   │
│   │   ├── admin/                    # 后台路由组
│   │   │   ├── layout.tsx            # 后台 Layout (Sidebar + AuthGuard)
│   │   │   ├── page.tsx              # 重定向到 dashboard
│   │   │   ├── login/
│   │   │   │   └── page.tsx          # 登录页
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx          # 仪表盘（统计概览）
│   │   │   ├── posts/
│   │   │   │   ├── page.tsx          # 文章列表管理
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx      # 新建文章
│   │   │   │   └── [id]/
│   │   │   │       └── edit/
│   │   │   │           └── page.tsx  # 编辑文章
│   │   │   ├── categories/
│   │   │   │   └── page.tsx          # 分类管理
│   │   │   ├── tags/
│   │   │   │   └── page.tsx          # 标签管理
│   │   │   └── friend-links/
│   │   │       └── page.tsx          # 友链管理
│   │   │
│   │   ├── api/                      # API Route Handlers
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts      # NextAuth 端点
│   │   │   ├── posts/
│   │   │   │   ├── route.ts          # GET (列表) / POST (创建)
│   │   │   │   └── [id]/
│   │   │   │       ├── route.ts      # GET / PUT / DELETE
│   │   │   │       └── views/
│   │   │   │           └── route.ts  # POST (记录浏览)
│   │   │   ├── categories/
│   │   │   │   ├── route.ts          # GET / POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PUT / DELETE
│   │   │   ├── tags/
│   │   │   │   ├── route.ts          # GET / POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PUT / DELETE
│   │   │   ├── upload/
│   │   │   │   └── route.ts          # POST (图片上传)
│   │   │   ├── search/
│   │   │   │   └── route.ts          # GET (搜索)
│   │   │   ├── friend-links/
│   │   │   │   ├── route.ts          # GET / POST
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts      # PUT / DELETE
│   │   │   └── stats/
│   │   │       └── route.ts          # GET (仪表盘统计)
│   │   │
│   │   ├── feed.xml/
│   │   │   └── route.ts              # RSS Feed
│   │   ├── sitemap.ts                # Sitemap 生成
│   │   ├── robots.ts                 # Robots.txt 生成
│   │   ├── layout.tsx                # 根 Layout (html, body, ThemeProvider)
│   │   ├── globals.css               # Tailwind 全局样式
│   │   └── not-found.tsx             # 404 页面
│   │
│   ├── components/
│   │   ├── ui/                       # 通用 UI 组件
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── Toast.tsx
│   │   ├── layout/                   # 布局组件
│   │   │   ├── Header.tsx            # 前台顶部导航
│   │   │   ├── Footer.tsx            # 前台底部
│   │   │   ├── AdminSidebar.tsx      # 后台侧边栏
│   │   │   └── ThemeToggle.tsx       # 主题切换按钮
│   │   ├── post/                     # 文章相关组件
│   │   │   ├── PostCard.tsx          # 文章列表卡片
│   │   │   ├── PostList.tsx          # 文章列表容器
│   │   │   ├── MarkdownRenderer.tsx  # Markdown 渲染器
│   │   │   ├── MarkdownEditor.tsx    # Markdown 编辑器 (textarea + preview)
│   │   │   ├── TOC.tsx              # 目录组件
│   │   │   └── PostNavigation.tsx    # 上/下篇导航
│   │   ├── admin/                    # 后台专用组件
│   │   │   ├── PostForm.tsx          # 文章表单（新建/编辑共用）
│   │   │   ├── CategoryForm.tsx      # 分类表单
│   │   │   ├── TagForm.tsx           # 标签表单
│   │   │   ├── FriendLinkForm.tsx    # 友链表单
│   │   │   ├── ImageUploader.tsx     # 图片上传组件
│   │   │   └── StatsCards.tsx        # 仪表盘统计卡片
│   │   └── seo/                      # SEO 组件
│   │       └── JsonLd.tsx            # JSON-LD 结构化数据
│   │
│   ├── lib/                          # 工具库
│   │   ├── prisma.ts                 # PrismaClient 单例
│   │   ├── auth.ts                   # NextAuth 配置
│   │   ├── auth-guard.ts             # API 认证中间件
│   │   ├── markdown.ts               # Markdown 解析/TOC 提取工具
│   │   ├── search.ts                 # 全文检索工具函数
│   │   ├── upload.ts                 # 文件上传工具函数
│   │   ├── rate-limit.ts             # Rate Limiting 工具
│   │   └── utils.ts                  # 通用工具 (slugify, formatDate, cn, ...)
│   │
│   └── types/                        # TypeScript 类型定义
│       └── index.ts                  # 公共类型（PostWithRelations, ApiResponse, ...）
│
├── prisma/
│   ├── schema.prisma                 # Prisma Schema
│   ├── migrations/                   # 数据库迁移文件
│   └── seed.ts                       # 种子数据脚本
│
├── public/
│   └── uploads/                      # 图片上传目录（MVP 本地存储）
│
├── docker/
│   ├── Dockerfile                    # Next.js 多阶段构建
│   ├── docker-compose.yml            # 编排 (next-app + postgres)
│   ├── nginx.conf                    # Nginx 反代配置（或 Caddyfile）
│   └── backup.sh                     # PostgreSQL 备份脚本
│
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD 流水线
│
├── .env.example                      # 环境变量模板
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── package.json
└── README.md
```

---

## 4. 页面路由表

### 4.1 前台路由

| 路由 | 页面 | 渲染策略 | 说明 |
|------|------|----------|------|
| `/` | 首页 | ISR (60s) | 文章列表，分页 |
| `/posts/[slug]` | 文章详情 | ISR (60s) + `generateStaticParams` | Markdown 渲染 + TOC |
| `/categories/[slug]` | 分类文章列表 | ISR (60s) | 按分类筛选 |
| `/tags/[slug]` | 标签文章列表 | ISR (60s) | 按标签筛选 |
| `/archives` | 归档 | ISR (60s) | 按年/月分组 |
| `/search` | 搜索 | SSR (动态) | 关键词搜索 |
| `/about` | 关于 | ISR (3600s) | 静态内容，低频更新 |
| `/friends` | 友链 | ISR (3600s) | 友链列表 |
| `/feed.xml` | RSS | 动态 Route Handler | XML 输出 |
| `/sitemap.xml` | Sitemap | Next.js 内置 | XML 输出 |
| `/robots.txt` | Robots | Next.js 内置 | 纯文本 |

### 4.2 后台路由

| 路由 | 页面 | 渲染策略 | 认证 |
|------|------|----------|------|
| `/admin/login` | 登录页 | CSR | ❌ |
| `/admin/dashboard` | 仪表盘 | CSR | ✅ |
| `/admin/posts` | 文章管理列表 | CSR | ✅ |
| `/admin/posts/new` | 新建文章 | CSR | ✅ |
| `/admin/posts/[id]/edit` | 编辑文章 | CSR | ✅ |
| `/admin/categories` | 分类管理 | CSR | ✅ |
| `/admin/tags` | 标签管理 | CSR | ✅ |
| `/admin/friend-links` | 友链管理 | CSR | ✅ |

---

## 5. 核心组件设计

### 5.1 MarkdownEditor（后台文章编辑器）

```
┌─────────────────────────────────────────────────────┐
│  工具栏 (加粗/斜体/链接/图片上传/标题/代码块)         │
├────────────────────────┬────────────────────────────┤
│                        │                            │
│   Markdown 源码        │   实时预览                  │
│   (textarea)           │   (MarkdownRenderer)       │
│                        │                            │
│                        │                            │
├────────────────────────┴────────────────────────────┤
│  元信息区域                                          │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ ┌──────────┐   │
│  │ 分类选择 │ │ 标签多选 │ │ Slug  │ │ 封面图片  │   │
│  └─────────┘ └─────────┘ └───────┘ └──────────┘   │
│  ┌─────────┐ ┌─────────┐ ┌───────────────┐        │
│  │ 状态     │ │ 置顶    │ │ 摘要 (excerpt)│        │
│  └─────────┘ └─────────┘ └───────────────┘        │
│                                    [ 保存草稿 ] [ 发布 ] │
└─────────────────────────────────────────────────────┘
```

- **数据流**：textarea `onChange` → 更新 state → MarkdownRenderer 重新渲染预览
- **图片插入**：点击工具栏图片按钮 → 弹出上传对话框 → 调用 `POST /api/upload` → 获取 URL → 插入 `![](url)` 到光标位置

### 5.2 MarkdownRenderer（Markdown 渲染器）

**处理流水线**：

```
Markdown 字符串
    ↓
react-markdown
    ├── remarkGfm          (GFM 支持)
    ├── remarkMath          (数学公式, 迭代)
    ├── rehypeHighlight     (代码高亮)
    ├── rehypeSanitize      (XSS 防护)
    └── rehypeSlug          (标题添加 id, 用于 TOC 锚点)
    ↓
React 组件树
```

### 5.3 TOC 目录组件

**提取算法**：
1. 使用 `unified` + `remark-parse` 解析 Markdown AST
2. 遍历 AST 提取 `heading` 节点（h2 ~ h4）
3. 生成嵌套树结构 `{ id, text, level, children }`
4. 渲染为可点击锚点链接列表

**滚动高亮**：
- 使用 `IntersectionObserver` 监听各标题元素
- 当标题进入视口时更新高亮状态

### 5.4 前台 Layout

```
┌────────────────────────────────────────────────┐
│  Header                                        │
│  ┌──────┐  Home  Archive  Tags  About  Search  │
│  │ Logo │                            🌙/☀️     │
│  └──────┘                                      │
├────────────────────────────────────────────────┤
│                                                │
│  Main Content                                  │
│  (由子路由填充)                                  │
│                                                │
├────────────────────────────────────────────────┤
│  Footer                                        │
│  © 2026 WayBlog · RSS · GitHub                 │
└────────────────────────────────────────────────┘
```

---

## 6. 状态管理策略

| 场景 | 方案 |
|------|------|
| 文章列表、详情等数据获取 | **Server Component** 直接调用 Prisma（不走 API），零客户端 JS |
| 后台列表数据 | **fetch API** 调用 Route Handler（后台全部 CSR） |
| 主题切换 | **next-themes** `useTheme` hook（Client Component） |
| Markdown 编辑器状态 | **React useState**（Client Component，仅编辑页） |
| 搜索输入 | **React useState** + `useRouter` 跳转 |
| Toast 通知 | **React Context** 或轻量状态库（如 `sonner`） |

> **原则**：不引入全局状态管理库（Redux / Zustand），保持简单。

---

## 7. 认证流程

```
用户访问 /admin/*
       │
       ▼
  middleware.ts 检查
  NextAuth Session
       │
  ┌────┴────┐
  │有 Session│──→ 放行，进入后台页面
  └────┬────┘
       │无 Session
       ▼
  重定向到 /admin/login
       │
  用户输入邮箱+密码 → POST /api/auth/callback/credentials
       │
       ▼
  NextAuth Credentials Provider
  → 查询 User 表 → bcrypt.compare
       │
  ┌────┴────┐
  │验证通过  │──→ 签发 JWT → Set Cookie → 重定向到 /admin/dashboard
  └────┬────┘
       │验证失败
       ▼
  返回错误提示
```

**NextAuth 配置要点**：
- Provider: `CredentialsProvider`
- Session strategy: `jwt`
- JWT secret: 从环境变量 `NEXTAUTH_SECRET` 读取
- Callbacks: `jwt` 和 `session` 回调注入用户 ID

**Middleware 路由保护**：
- 匹配路径：`/admin/:path*`（排除 `/admin/login`）
- 未认证 → redirect `/admin/login`

---

## 8. 图片上传流程

```
[后台编辑器] 点击上传按钮
       │
       ▼
  <input type="file"> 选择文件
       │
       ▼
  前端校验（大小 ≤ 5MB, 格式白名单）
       │
       ▼
  FormData → POST /api/upload
       │
       ▼
  服务端校验 → 生成唯一文件名 (uuid + 原始扩展名)
       │
       ▼
  写入 public/uploads/{yyyy-MM}/{uuid}.{ext}
       │
       ▼
  返回 { url: "/uploads/2026-02/abc123.webp" }
       │
       ▼
  插入 Markdown: ![图片描述](/uploads/2026-02/abc123.webp)
```

**文件命名策略**：`/uploads/{年-月}/{uuid}.{ext}`，按月分目录，避免单目录文件过多。

**MVP 后迭代**：抽象 `StorageProvider` 接口：

```typescript
interface StorageProvider {
  upload(file: Buffer, filename: string): Promise<string>  // 返回 URL
  delete(url: string): Promise<void>
}

// 实现：
// - LocalStorageProvider  (MVP)
// - MinIOStorageProvider  (迭代)
// - OSSStorageProvider    (迭代)
```

---

## 9. 搜索实现方案

### 9.1 MVP 方案：PostgreSQL tsvector

**索引创建**（通过 Prisma raw SQL migration）：

```sql
-- 添加 search_vector 列
ALTER TABLE "Post" ADD COLUMN "search_vector" tsvector;

-- 创建 GIN 索引
CREATE INDEX "Post_search_vector_idx" ON "Post" USING GIN ("search_vector");

-- 创建触发器函数：INSERT/UPDATE 时自动更新 search_vector
CREATE OR REPLACE FUNCTION post_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.content, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER post_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Post"
  FOR EACH ROW EXECUTE FUNCTION post_search_vector_update();
```

**查询**：

```sql
SELECT id, title, slug,
       ts_headline('simple', content, query, 'MaxFragments=2, MaxWords=30') AS highlight
FROM "Post",
     to_tsquery('simple', 'keyword1 & keyword2') AS query
WHERE status = 'PUBLISHED'
  AND search_vector @@ query
ORDER BY ts_rank(search_vector, query) DESC
LIMIT 10 OFFSET 0;
```

> **注意**：`simple` 分词器对中文按单字拆分，搜索"数据库"需要用户输入完整词汇才能命中。后续可升级。

### 9.2 迭代方案

升级路径：`simple` → `zhparser`（PostgreSQL 扩展）→ Meilisearch（独立搜索引擎）

---

## 10. SEO 策略

### 10.1 Metadata 规划

| 页面 | title | description |
|------|-------|-------------|
| 首页 | `{站点名} — {副标题}` | 站点描述 |
| 文章详情 | `{文章标题} — {站点名}` | `{excerpt}` 或截取前 160 字 |
| 分类页 | `{分类名} — {站点名}` | `{分类描述}` |
| 标签页 | `#{标签名} — {站点名}` | `关于 {标签名} 的所有文章` |
| 归档 | `文章归档 — {站点名}` | 固定描述 |
| 关于 | `关于我 — {站点名}` | 固定描述 |

### 10.2 JSON-LD

文章详情页输出 `Article` 结构化数据：

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "文章标题",
  "description": "文章摘要",
  "image": "封面图 URL",
  "datePublished": "2026-02-28T00:00:00Z",
  "dateModified": "2026-02-28T00:00:00Z",
  "author": {
    "@type": "Person",
    "name": "博主名"
  }
}
```

### 10.3 ISR 策略

- 文章详情页：`generateStaticParams` 预生成所有已发布文章 + `revalidate: 60`
- 列表页（首页/分类/标签）：`revalidate: 60`
- 静态页面（About / Friends）：`revalidate: 3600`
- 后台页面：不做静态生成，纯 CSR

### 10.4 Open Graph

每个页面输出：
- `og:title` / `og:description` / `og:url` / `og:type`
- 文章页额外输出 `og:image`（封面图）
- `twitter:card: summary_large_image`

---

## 11. 暗色模式实现

```
next-themes ThemeProvider
    │
    ├── 包裹 RootLayout (<html> 标签)
    ├── attribute="class" → Tailwind `dark:` 前缀生效
    ├── defaultTheme="system" → 跟随系统偏好
    ├── storageKey="theme" → localStorage 持久化
    │
    └── 防闪烁：ThemeProvider 在 <head> 注入内联 <script>
        → 页面渲染前读取 localStorage 并设置 class
```

**Tailwind 配置**：

```typescript
// tailwind.config.ts
export default {
  darkMode: 'class',
  // ...
}
```

---

## 12. 部署架构

### 12.1 Docker Compose 编排

```yaml
# docker-compose.yml (概要)
services:
  app:
    build: ./docker/Dockerfile
    ports: ["3000:3000"]
    env_file: .env
    depends_on: [postgres]
    volumes: ["./public/uploads:/app/public/uploads"]  # 持久化上传文件
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: wayblog
      POSTGRES_USER: wayblog
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

volumes:
  pgdata:
```

### 12.2 Dockerfile（多阶段构建）

```
Stage 1: deps     → 安装依赖
Stage 2: builder  → next build (standalone output)
Stage 3: runner   → 仅复制 standalone + static + public，精简镜像
```

关键：`next.config.ts` 设置 `output: 'standalone'`。

### 12.3 Nginx 反代

```
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        alias /path/to/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

### 12.4 CI/CD (GitHub Actions)

```
触发: push to main
  │
  ├── Lint (eslint)
  ├── Type Check (tsc --noEmit)
  │
  ├── Build Docker Image
  ├── Push to Registry (Docker Hub / GHCR)
  │
  └── SSH to VPS
      ├── docker compose pull
      ├── docker compose up -d
      └── prisma migrate deploy
```

### 12.5 备份策略

```bash
# backup.sh — 每日 cron 执行
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker exec wayblog-postgres pg_dump -U wayblog wayblog > /backups/wayblog_${DATE}.sql
gzip /backups/wayblog_${DATE}.sql
# 保留最近 30 天，删除旧备份
find /backups -name "*.sql.gz" -mtime +30 -delete
```

Cron: `0 3 * * * /path/to/backup.sh`（每天凌晨 3 点）

### 12.6 监控

| 工具 | 用途 |
|------|------|
| **Uptime Kuma** | HTTP 端点健康检查，宕机告警（Telegram / 邮件） |
| **Docker logs** | `docker compose logs -f app` 查看应用日志 |
| **可选：Loki + Grafana** | 日志聚合与可视化（迭代阶段） |

---

## 13. 环境变量规划

**核心配置**：

| 变量 | 说明 | 示例值 | 备注 |
|------|------|--------|------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://wayblog:pass@localhost:5432/wayblog` | 生产环境使用内网地址 |
| `NEXTAUTH_URL` | NextAuth 回调地址 | 开发：`http://localhost:3000`<br>生产：`https://yourdomain.com` | 必须与实际访问地址一致 |
| `NEXTAUTH_SECRET` | JWT 签名密钥 | `openssl rand -base64 32` 生成 | **≥32 字符，绝对保密** |
| `SITE_NAME` | 站点名称 | `Way` | 显示在页面标题、Footer |
| `SITE_DESCRIPTION` | 站点描述 | `A Journey of Code and Thought` | 用于首页 meta description |
| `SITE_URL` | 站点完整 URL | `https://yourdomain.com` | RSS/Sitemap/OG 标签使用 |
| `ADMIN_EMAIL` | 管理员邮箱 | `way20031208@gmail.com` | 仅用于 seed 脚本初始化 |
| `ADMIN_PASSWORD` | 初始密码 | 自定义强密码 | seed 后可在后台修改 |
| `ADMIN_NAME` | 管理员显示名 | `Way` | 文章作者名 |

**上传配置**：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `UPLOAD_MAX_SIZE` | `5242880` (5MB) | 单文件大小上限（字节） |
| `UPLOAD_DIR` | `public/uploads` | 本地存储目录 |
| `UPLOAD_ALLOWED_TYPES` | `image/jpeg,image/png,image/gif,image/webp` | 允许的 MIME 类型 |

**限流配置**：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `RATE_LIMIT_LOGIN` | `5` | 登录接口：5 次/分钟/IP |
| `RATE_LIMIT_VIEWS` | `1` | 浏览量记录：1 次/秒/IP |
| `RATE_LIMIT_SEARCH` | `30` | 搜索接口：30 次/分钟/IP |
| `RATE_LIMIT_API` | `60` | 其他 API：60 次/分钟/IP |

> 完整的 `.env.example` 文件已在项目根目录创建，包含所有配置项和注释。

---

## 14. 日志策略

### 14.1 应用日志

| 级别 | 场景 | 示例 |
|------|------|------|
| `info` | 正常业务事件 | 文章发布、用户登录成功 |
| `warn` | 可能异常但不影响服务 | 限流触发、上传格式被拒 |
| `error` | 影响业务的异常 | 数据库连接失败、未捕获错误 |

**MVP 方案**：直接使用 `console.log` / `console.warn` / `console.error`，通过 Docker 容器日志收集。

**日志格式**（建议 JSON 格式，便于后续接入日志系统）：

```
{"level":"info","time":"2026-02-28T12:00:00Z","msg":"Post published","postId":"uuid","slug":"my-post"}
{"level":"error","time":"2026-02-28T12:01:00Z","msg":"Database connection failed","error":"..."}
```

### 14.2 Docker 日志管理

```yaml
# docker-compose.yml 中 app 服务添加
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "5"
```

### 14.3 迭代方案

| 阶段 | 方案 |
|------|------|
| MVP | Docker logs + logrotate |
| 迭代一 | 引入 `pino`（高性能 JSON logger），替换 console |
| 迭代二 | Loki + Grafana（日志聚合 + 可视化查询） |
| 迭代三 | Sentry（错误追踪 + 告警） |

---

## 15. 安全加固检查清单

| # | 检查项 | 状态 |
|---|--------|------|
| 1 | Markdown 渲染使用 `rehype-sanitize` 过滤 HTML | ⬜ |
| 2 | 密码使用 `bcrypt`（cost ≥ 12）存储 | ⬜ |
| 3 | API 写操作全部要求认证 | ⬜ |
| 4 | 登录接口 Rate Limiting（5 次/分钟/IP） | ⬜ |
| 5 | 图片上传严格校验文件类型和大小 | ⬜ |
| 6 | HTTPS 启用，HTTP 自动跳转 | ⬜ |
| 7 | `NEXTAUTH_SECRET` 使用强随机字符串（≥ 32 字符） | ⬜ |
| 8 | 数据库密码不硬编码，通过环境变量注入 | ⬜ |
| 9 | `/admin/` 和 `/api/` 在 `robots.txt` 中禁止爬取 | ⬜ |
| 10 | 响应头安全配置（`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`） | ⬜ |
| 11 | Prisma 参数化查询（天然防 SQL 注入） | ⬜ |
| 12 | `npm audit` / `pnpm audit` 无高危漏洞 | ⬜ |

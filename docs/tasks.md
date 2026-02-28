# WayBlog — 任务清单（里程碑拆分）

> 版本：v1.0 | 更新日期：2026-02-28 | 状态：待确认

---

## 总体里程碑规划

| 里程碑 | 名称 | 目标 | 预计周期 |
|--------|------|------|----------|
| M0 | 项目初始化 | 工程骨架搭建、开发环境就绪 | 1 天 |
| M1 | 后端核心 | 数据库 + API + 认证 | 3–4 天 |
| M2 | 后台管理 | 文章 / 分类 / 标签 / 友链 CRUD 页面 | 3–4 天 |
| M3 | 前台展示 | 首页 / 详情 / 分类 / 标签 / 归档 / 搜索 / About / 友链 | 4–5 天 |
| M4 | SEO & 运营 | RSS / Sitemap / JSON-LD / 浏览量统计 / 仪表盘 | 2–3 天 |
| M5 | 部署上线 | Docker / CI/CD / 域名 / HTTPS / 备份 / 监控 | 2–3 天 |
| M6 | 迭代增强 | 评论 / 编辑器升级 / 图片云存储 / 高级搜索 | 持续 |

> 总计 MVP（M0–M5）：约 **15–20 天**（单人开发）

---

## M0 — 项目初始化

| # | 任务 | 验收标准 |
|---|------|----------|
| M0-01 | 使用 `create-next-app` 初始化项目（Next.js 15, App Router, TypeScript, Tailwind CSS 4, pnpm） | `pnpm dev` 可运行，访问 `localhost:3000` 看到默认页 |
| M0-02 | 配置 ESLint + Prettier（Conventional Commits 规范） | `pnpm lint` 通过，格式化无报错 |
| M0-03 | 配置 `.env.example` 环境变量模板 | 文件包含所有必要变量（DATABASE_URL, NEXTAUTH_SECRET, SITE_* 等） |
| M0-04 | 初始化 Prisma，配置 PostgreSQL 数据源 | `prisma/schema.prisma` 文件存在，`datasource db` 指向 PostgreSQL |
| M0-05 | 创建 `docker-compose.yml`（postgres 服务） | `docker compose up postgres` 可启动数据库，`psql` 可连接 |
| M0-06 | 搭建项目目录结构（`src/app/`, `src/components/`, `src/lib/`, `src/types/`） | 目录结构与 design.md 第 3 节一致 |
| M0-07 | 配置 Git 仓库 + `.gitignore` + 分支策略（`main` + `dev`） | 初始 commit 推送成功，`dev` 分支已创建 |
| M0-08 | 安装核心依赖：`next-auth@5`, `prisma`, `@prisma/client`, `react-markdown`, `next-themes`, `bcryptjs`, `zod` | `package.json` 中依赖存在，`pnpm install` 无报错 |

---

## M1 — 后端核心（数据库 + API + 认证）

### M1.1 数据库

| # | 任务 | 验收标准 |
|---|------|----------|
| M1-01 | 编写完整 Prisma Schema（User, Post, Category, Tag, PageView, FriendLink, Page） | `prisma validate` 通过，模型与 database.md 第 3 节一致 |
| M1-02 | 执行 `prisma migrate dev`，生成初始迁移 | 数据库中所有表已创建，字段/索引/约束正确 |
| M1-03 | 创建 tsvector 手动迁移（search_vector 列 + GIN 索引 + 触发器） | 插入文章后 `search_vector` 自动填充，GIN 索引存在 |
| M1-04 | 编写 `prisma/seed.ts`（管理员 + 示例分类/标签/文章 + About 页面） | `prisma db seed` 执行成功，数据库中有种子数据 |
| M1-05 | 创建 `src/lib/prisma.ts` PrismaClient 单例 | 开发环境热重载不产生多余数据库连接 |

### M1.2 认证

| # | 任务 | 验收标准 |
|---|------|----------|
| M1-06 | 配置 NextAuth v5（Credentials Provider, JWT Session） | `/api/auth/session` 返回正确 session 或 null |
| M1-07 | 实现登录：邮箱 + 密码 → bcrypt 校验 → 签发 JWT | 使用种子数据的管理员账号可成功登录，session cookie 已设置 |
| M1-08 | 创建 `src/lib/auth-guard.ts` API 认证中间件 | 未认证调用 POST/PUT/DELETE API 返回 `401` |
| M1-09 | 配置 `middleware.ts` 路由保护（`/admin/*` 排除 `/admin/login`） | 未登录访问 `/admin/dashboard` 重定向到 `/admin/login` |

### M1.3 API 端点

| # | 任务 | 验收标准 |
|---|------|----------|
| M1-10 | 实现文章 CRUD API（`/api/posts`, `/api/posts/[id]`）含 Zod 校验 | curl/Postman 测试：创建、查询、更新、删除文章均成功，参数校验生效 |
| M1-11 | 实现分类 CRUD API（`/api/categories`, `/api/categories/[id]`） | CRUD 正常，删除分类后文章 `categoryId` 为 null |
| M1-12 | 实现标签 CRUD API（`/api/tags`, `/api/tags/[id]`） | CRUD 正常，删除标签后关联自动解除 |
| M1-13 | 实现图片上传 API（`POST /api/upload`）含文件校验 | 上传 ≤5MB 的 jpg/png/gif/webp 成功，返回 URL；超大文件返回 413；非法格式返回 400 |
| M1-14 | 实现搜索 API（`GET /api/search`）使用 tsvector | 搜索关键词返回匹配文章列表 + 高亮摘要 |
| M1-15 | 实现友链 CRUD API（`/api/friend-links`, `/api/friend-links/[id]`） | CRUD 正常，列表按 sortOrder 排序 |
| M1-16 | 实现统计 API（`GET /api/stats`） | 返回文章数、分类数、标签数、浏览量汇总、最近 30 天 PV/UV、Top 5 文章 |
| M1-17 | 实现浏览量记录 API（`POST /api/posts/[id]/views`） | 调用后 PV +1，同 IP 同日只增加一次 UV |
| M1-18 | 实现 Rate Limiting 中间件（`src/lib/rate-limit.ts`） | 超过限流阈值返回 `429`，正常请求不受影响 |

---

## M2 — 后台管理页面

### M2.1 布局与认证

| # | 任务 | 验收标准 |
|---|------|----------|
| M2-01 | 实现 `/admin/login` 登录页（邮箱 + 密码表单） | 输入正确凭据后跳转到 `/admin/dashboard`；错误凭据显示提示 |
| M2-02 | 实现 `/admin/layout.tsx` 后台 Layout（AdminSidebar + AuthGuard） | 左侧显示侧边栏导航（仪表盘/文章/分类/标签/友链），未登录自动跳转 |

### M2.2 文章管理

| # | 任务 | 验收标准 |
|---|------|----------|
| M2-03 | 实现 `/admin/posts` 文章管理列表（表格展示 + 状态筛选 + 分页） | 显示标题、状态、分类、发布时间、操作按钮；支持按状态筛选和翻页 |
| M2-04 | 实现 `MarkdownEditor` 组件（textarea + 实时预览，左右分栏） | 左侧输入 Markdown，右侧实时渲染预览，支持基础工具栏 |
| M2-05 | 实现 `ImageUploader` 组件（选择文件 → 上传 → 返回 URL） | 点击上传按钮可选择图片，上传成功后显示预览和 URL |
| M2-06 | 实现 `PostForm` 组件（新建/编辑共用：标题/Slug/内容/摘要/封面/分类/标签/置顶/状态） | 所有字段可正确填写，Slug 自动生成且可手动修改 |
| M2-07 | 实现 `/admin/posts/new` 新建文章页 | 填写表单 → 保存草稿 / 发布 → 跳转到文章列表并看到新文章 |
| M2-08 | 实现 `/admin/posts/[id]/edit` 编辑文章页 | 加载已有数据 → 修改 → 保存 → 数据更新成功 |

### M2.3 分类 / 标签 / 友链管理

| # | 任务 | 验收标准 |
|---|------|----------|
| M2-09 | 实现 `/admin/categories` 分类管理页（列表 + 新建 / 编辑 / 删除） | CRUD 操作正常，显示每个分类关联的文章数 |
| M2-10 | 实现 `/admin/tags` 标签管理页（列表 + 新建 / 编辑 / 删除） | CRUD 操作正常，显示每个标签关联的文章数 |
| M2-11 | 实现 `/admin/friend-links` 友链管理页（列表 + 新建 / 编辑 / 删除 + 排序） | CRUD + 排序操作正常 |

### M2.4 UI 基础组件

| # | 任务 | 验收标准 |
|---|------|----------|
| M2-12 | 实现通用 UI 组件（Button, Input, Textarea, Select, Modal, Badge, Pagination, Skeleton, Toast） | 组件可复用，支持暗色模式，样式一致 |

---

## M3 — 前台展示页面

### M3.1 布局与主题

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-01 | 实现根 Layout（`next-themes` ThemeProvider、全局字体、全局样式） | 页面无主题闪烁，Tailwind `dark:` 类正常生效 |
| M3-02 | 实现前台 Layout（Header: Logo + 导航 + 主题切换；Footer: 版权 + RSS + GitHub） | Header 导航可点击跳转，主题按钮可切换亮/暗色，响应式适配 |
| M3-03 | 实现 `ThemeToggle` 组件 | 切换主题后 `localStorage` 持久化，刷新后保持选择 |

### M3.2 文章列表与详情

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-04 | 实现 `PostCard` 组件（封面、标题、摘要、分类、标签、日期、浏览量） | 卡片样式美观，响应式布局，暗色模式正常 |
| M3-05 | 实现首页 `/` 文章列表（分页、置顶优先、ISR 60s） | 显示已发布文章列表，置顶文章在最前，翻页正常 |
| M3-06 | 实现 `MarkdownRenderer` 组件（GFM + 代码高亮 + sanitize + 标题锚点） | GFM 表格/任务列表正常渲染，代码块有语法高亮，HTML 被过滤 |
| M3-07 | 实现文章详情页 `/posts/[slug]`（ISR + generateStaticParams） | Markdown 内容正确渲染，显示元信息（作者/日期/分类/标签/浏览量） |
| M3-08 | 实现 `TOC` 目录组件（h2–h4 提取，桌面端右侧固定，滚动高亮） | 桌面端右侧显示目录，点击锚点平滑滚动，当前章节高亮；移动端隐藏 |
| M3-09 | 实现 `PostNavigation` 上一篇/下一篇组件 | 文章底部显示前后文章链接，首尾文章只显示一侧 |

### M3.3 分类 / 标签 / 归档

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-10 | 实现分类文章列表页 `/categories/[slug]`（ISR 60s） | 显示指定分类下的已发布文章，分页正常 |
| M3-11 | 实现标签文章列表页 `/tags/[slug]`（ISR 60s） | 显示指定标签下的已发布文章，分页正常 |
| M3-12 | 实现归档页 `/archives`（按年/月分组展示，ISR 60s） | 文章按年/月分组，点击文章标题可跳转到详情 |

### M3.4 搜索

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-13 | 实现搜索页 `/search`（输入框 + 结果列表 + 分页） | 输入关键词后展示匹配结果，关键词高亮，无结果时显示提示 |

### M3.5 静态页面

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-14 | 实现 About 页面 `/about`（从 Page 表读取 Markdown 内容渲染） | 显示关于我信息，Markdown 渲染正常 |
| M3-15 | 实现友链页面 `/friends`（卡片式展示友链列表） | 友链按 sortOrder 排序，卡片显示名称/描述/图标，点击跳转 |
| M3-16 | 实现 404 页面 | 访问不存在的路由显示自定义 404 页面，有返回首页按钮 |

### M3.6 响应式设计

| # | 任务 | 验收标准 |
|---|------|----------|
| M3-17 | 全站响应式适配（手机 / 平板 / 桌面） | 在 375px / 768px / 1280px 宽度下布局正常、可读性好 |
| M3-18 | 移动端 Header 汉堡菜单 | 小屏幕下导航折叠为汉堡菜单，点击展开/收起 |

---

## M4 — SEO & 运营功能

### M4.1 SEO

| # | 任务 | 验收标准 |
|---|------|----------|
| M4-01 | 为所有页面配置 Metadata（title / description / og:* / twitter:card） | 查看每个页面源码，`<head>` 中包含正确的 meta 标签 |
| M4-02 | 文章详情页输出 JSON-LD 结构化数据（Article schema） | Google 结构化数据测试工具验证通过 |
| M4-03 | 实现 `/feed.xml` RSS Feed（Route Handler, RSS 2.0） | 浏览器或 RSS 阅读器可正确解析，包含最近 20 篇文章 |
| M4-04 | 实现 `/sitemap.xml`（Next.js 内置 sitemap.ts） | 包含所有公开页面 URL，`lastmod` 正确 |
| M4-05 | 实现 `/robots.txt`（Next.js 内置 robots.ts） | 允许 `/`，禁止 `/admin/` 和 `/api/`，包含 Sitemap 地址 |

### M4.2 浏览量统计

| # | 任务 | 验收标准 |
|---|------|----------|
| M4-06 | 文章详情页加载时自动调用浏览量记录 API | 每次访问文章，PV +1；同 IP 同日首次访问 UV +1 |
| M4-07 | 文章详情页展示总浏览量 | 页面上显示 `👁 {viewCount} 次浏览` |

### M4.3 仪表盘

| # | 任务 | 验收标准 |
|---|------|----------|
| M4-08 | 实现 `/admin/dashboard` 仪表盘（统计卡片 + 最近 30 天 PV/UV 趋势 + Top 5 文章） | 数据正确展示，数字与数据库一致 |

---

## M5 — 部署上线

### M5.1 Docker 化

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-01 | 编写 `Dockerfile`（多阶段构建：deps → build → runner） | `docker build` 成功，镜像大小 < 300MB |
| M5-02 | 完善 `docker-compose.yml`（app + postgres + volumes） | `docker compose up` 一键启动全部服务，应用可访问 |
| M5-03 | 配置 `next.config.ts` 设置 `output: 'standalone'` | standalone 构建产物中包含 server.js |
| M5-04 | 配置 uploads 目录持久化（Docker volume 挂载） | 容器重启后上传的图片仍然存在 |

### M5.2 反代 & HTTPS

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-05 | 编写 Nginx 配置（反代 Next.js + 静态文件直出 + gzip/brotli） | 通过 Nginx 访问站点，`/uploads/` 直出静态文件，响应有 `Content-Encoding: gzip` |
| M5-06 | 配置 Let's Encrypt 自动 HTTPS（Certbot 或 acme.sh） | 浏览器访问 `https://yourdomain.com` 证书有效，HTTP 自动跳转 HTTPS |
| M5-07 | 域名 DNS 解析配置 | 域名 A 记录指向 VPS IP，解析生效 |

### M5.3 CI/CD

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-08 | 编写 GitHub Actions workflow（lint → type check → build → deploy） | push 到 `main` 后自动触发流水线，全部 step 通过 |
| M5-09 | 配置 SSH 部署到 VPS（docker compose pull + up + migrate） | CI 执行后 VPS 上服务自动更新 |
| M5-10 | 配置 GitHub Secrets（SSH_KEY, VPS_HOST, DB_PASSWORD 等） | workflow 中敏感变量通过 secrets 注入，不硬编码 |

### M5.4 备份

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-11 | 编写 `backup.sh` 数据库备份脚本 | 手动执行后 `/backups/` 生成 `.sql.gz` 文件，可恢复 |
| M5-12 | 配置 Cron Job 每日自动备份（保留最近 30 天） | `crontab -l` 可看到备份任务，备份文件按日期命名 |
| M5-13 | 备份恢复测试 | 用备份文件恢复到空数据库后，数据完整，应用正常运行 |

### M5.5 监控

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-14 | 部署 Uptime Kuma（Docker 容器），配置 HTTP 健康检查 | Uptime Kuma 仪表盘显示站点在线状态，宕机时发送告警 |
| M5-15 | 配置告警通知渠道（Telegram / 邮件 至少一种） | 手动停止应用后收到告警通知 |
| M5-16 | 配置 Docker 日志持久化（logging driver + logrotate） | `docker compose logs app` 可查看历史日志，日志文件不会无限增长 |

### M5.6 上线验收

| # | 任务 | 验收标准 |
|---|------|----------|
| M5-17 | 全站冒烟测试 | 以下操作全部通过：登录 → 新建/编辑/删除文章 → 前台浏览 → 搜索 → RSS → Sitemap → 主题切换 |
| M5-18 | 性能检测（Lighthouse） | 桌面端 LCP < 2.5s，Performance 评分 ≥ 90 |
| M5-19 | 安全检查 | HTTPS 正常、`/admin/` robots 禁止、API 写操作需认证、无 XSS 漏洞 |
| M5-20 | SEO 验证 | Google Search Console 提交 sitemap，无索引错误 |

---

## M6 — 迭代增强（MVP 后，按需推进）

| # | 任务 | 验收标准 | 优先级 |
|---|------|----------|--------|
| M6-01 | 集成 Giscus 评论系统 | 文章详情页底部显示 Giscus 评论组件，可通过 GitHub 登录后评论 | P2 |
| M6-02 | 编辑器升级为 Milkdown / ByteMD | 后台编辑器从纯 textarea 升级为所见即所得 Markdown 编辑器 | P2 |
| M6-03 | 图片存储抽象 `StorageProvider` 接口 | 实现 `LocalStorageProvider` 和至少一个云存储（MinIO / 阿里云 OSS），可通过环境变量切换 | P2 |
| M6-04 | 中文搜索升级（zhparser 或 Meilisearch） | 中文搜索准确度显著提升，支持词语级别匹配 | P2 |
| M6-05 | 集成 Umami 站点统计 | 独立 Umami 实例运行，前台嵌入追踪代码，可查看流量分析 | P3 |
| M6-06 | Newsletter 邮件订阅 | 用户可输入邮箱订阅，新文章发布后自动发送通知邮件 | P3 |
| M6-07 | 文章批量操作（批量删除、批量修改状态） | 后台文章列表支持多选 + 批量操作 | P3 |
| M6-08 | 文章导入/导出（Markdown 文件） | 可导出所有文章为 `.md` 文件压缩包，可批量导入 `.md` 文件 | P3 |
| M6-09 | 自定义页面管理（除 About 外可新增更多页面） | 后台可创建/编辑/删除自定义页面，前台按 slug 路由访问 | P3 |
| M6-10 | CDN 加速（静态资源 + 图片） | 静态资源通过 CDN 分发，LCP 进一步降低 | P3 |

---

## 任务依赖关系

```
M0 (项目初始化)
 └──→ M1 (后端核心)
       ├──→ M2 (后台管理)
       │     └──→ M4.3 (仪表盘)
       └──→ M3 (前台展示)
             └──→ M4.1 (SEO) + M4.2 (浏览量)
                   └──→ M5 (部署上线)
                         └──→ M6 (迭代增强)
```

---

## 注意事项

1. **先 M1 后 M2/M3**：API 和数据库是基础，后台和前台可并行开发但都依赖 M1
2. **M2 和 M3 可交叉进行**：如果想尽早看到前台效果，可以先做 M3 部分任务
3. **每个里程碑完成后做一次自测**：确保该阶段的功能全部通过验收标准
4. **M5 部署应在本地开发完全通过后再进行**：避免在服务器上调试
5. **M6 的任务按实际需求优先级动态调整**：不必全部实现


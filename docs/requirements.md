# WayBlog — 需求规格说明书

> 版本：v1.0 | 更新日期：2026-02-28 | 状态：待确认

---

## 1. 项目概述

| 项目名 | WayBlog |
|--------|---------|
| 定位 | 个人技术博客（单作者） |
| 目标用户 | **博主**（后台管理）+ **访客**（前台阅读） |
| 技术栈 | Next.js 15 (App Router) + TypeScript + PostgreSQL + Prisma + Tailwind CSS |
| 部署方式 | Docker + VPS 自托管 |

---

## 2. 术语表

| 术语 | 说明 |
|------|------|
| Post | 博客文章 |
| Category | 文章分类（扁平结构，一篇文章属于一个分类） |
| Tag | 文章标签（多对多，一篇文章可有多个标签） |
| Slug | URL 友好标识符，如 `my-first-post` |
| PV | Page View，页面浏览量 |
| UV | Unique Visitor，独立访客数（同 IP + 同日去重） |
| ISR | Incremental Static Regeneration，增量静态再生成 |
| SSG | Static Site Generation，静态站点生成 |
| tsvector | PostgreSQL 全文检索向量类型 |
| TOC | Table of Contents，文章目录 |
| GFM | GitHub Flavored Markdown |

---

## 3. 功能需求（MVP）

### FR-01 文章管理

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-01.1 | 后台可创建、编辑、删除文章 | P0 |
| FR-01.2 | 文章使用 **纯 Markdown 文本框 + 实时预览**（左右分栏） | P0 |
| FR-01.3 | 文章状态支持 **草稿 (DRAFT)** 和 **已发布 (PUBLISHED)** | P0 |
| FR-01.4 | 支持文章**置顶**（pinned），置顶文章在列表中优先展示 | P0 |
| FR-01.5 | 支持自定义 **slug**（默认由标题自动生成） | P0 |
| FR-01.6 | 支持设置**摘要 (excerpt)** 和 **封面图 (coverImage)** | P1 |
| FR-01.7 | 发布时记录 `publishedAt` 时间，草稿该字段为空 | P0 |

### FR-02 分类与标签

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-02.1 | 分类为**扁平结构**（非树形），每篇文章可属于 **0 或 1 个**分类 | P0 |
| FR-02.2 | 标签为**多对多**，每篇文章可关联 **0 ~ N 个**标签 | P0 |
| FR-02.3 | 后台可对分类、标签进行 CRUD 操作 | P0 |
| FR-02.4 | 分类和标签各有独立的 slug，用于 URL 路由 | P0 |

### FR-03 前台文章展示

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-03.1 | 首页展示已发布文章列表（卡片形式），支持**分页**（每页 10 篇） | P0 |
| FR-03.2 | 置顶文章始终显示在列表最前方 | P0 |
| FR-03.3 | 支持按**分类**筛选文章（`/categories/[slug]`） | P0 |
| FR-03.4 | 支持按**标签**筛选文章（`/tags/[slug]`） | P0 |
| FR-03.5 | 文章详情页展示完整 Markdown 渲染内容 | P0 |
| FR-03.6 | 文章详情页右侧显示**自动生成的 TOC 目录**，滚动时高亮当前章节 | P1 |
| FR-03.7 | 文章详情页底部显示**上一篇 / 下一篇**导航 | P1 |

### FR-04 搜索

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-04.1 | 支持按关键词搜索文章（搜索范围：标题 + 正文） | P0 |
| FR-04.2 | 使用 PostgreSQL `tsvector` + `tsquery` 实现全文检索 | P0 |
| FR-04.3 | 搜索结果返回**高亮摘要**（`ts_headline`） | P1 |
| FR-04.4 | 搜索结果支持分页 | P0 |

> **MVP 限制**：使用 `simple` 分词配置，中文搜索以字为粒度拆分，体验有限但可用。后续迭代可升级 zhparser 或 Meilisearch。

### FR-05 认证与权限

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-05.1 | 系统仅有**单个管理员**角色，无多用户注册 | P0 |
| FR-05.2 | 管理员通过**邮箱 + 密码**登录（NextAuth Credentials Provider） | P0 |
| FR-05.3 | `/admin/*` 下所有路由需要登录才能访问，未登录自动跳转登录页 | P0 |
| FR-05.4 | API 写操作（POST/PUT/DELETE）需要认证，读操作公开 | P0 |
| FR-05.5 | Session 使用 **JWT** 策略，无需服务端 Session 存储 | P0 |

### FR-06 Markdown 渲染

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-06.1 | 支持 **GFM**（表格、任务列表、删除线等） | P0 |
| FR-06.2 | **代码块语法高亮**（`rehype-highlight`） | P0 |
| FR-06.3 | 图片正常渲染（支持本地上传路径和外部 URL） | P0 |
| FR-06.4 | Markdown 内容经过 **sanitize** 处理，防止 XSS | P0 |

### FR-07 响应式设计与暗色模式

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-07.1 | 使用 Tailwind CSS **移动优先**设计，适配手机 / 平板 / 桌面 | P0 |
| FR-07.2 | 支持**暗色 / 亮色**主题切换（`next-themes`） | P0 |
| FR-07.3 | 主题偏好持久化到 `localStorage`，刷新不闪烁 | P0 |

### FR-08 图片上传

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-08.1 | 后台提供图片上传功能 | P0 |
| FR-08.2 | MVP 阶段图片存储到**本地 `public/uploads/` 目录** | P0 |
| FR-08.3 | 单文件大小限制 **≤ 5MB** | P0 |
| FR-08.4 | 允许格式：`jpg / jpeg / png / gif / webp` | P0 |
| FR-08.5 | 上传后返回可访问 URL，可一键插入 Markdown | P1 |

### FR-09 RSS / Sitemap / Robots

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-09.1 | 提供 `/feed.xml`，遵循 **RSS 2.0** 规范 | P0 |
| FR-09.2 | 提供 `/sitemap.xml`，动态生成所有已发布文章 URL | P0 |
| FR-09.3 | 提供 `/robots.txt`，允许搜索引擎抓取 | P0 |

### FR-10 SEO

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-10.1 | 文章页使用 **SSG + ISR**（`revalidate: 60`），首页/列表页同理 | P0 |
| FR-10.2 | 每个页面生成正确的 `<title>` / `<meta description>` / `og:*` 标签 | P0 |
| FR-10.3 | 文章页输出 **JSON-LD** 结构化数据（`Article` schema） | P1 |
| FR-10.4 | URL 结构使用语义化 slug（`/posts/[slug]`） | P0 |

### FR-11 浏览量统计

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-11.1 | 用户访问文章详情页时自动记录 PV | P0 |
| FR-11.2 | 按天汇总 PV/UV（同 IP + 同日 = 1 UV） | P0 |
| FR-11.3 | 文章详情页展示**总浏览量** | P1 |
| FR-11.4 | 后台仪表盘展示整站统计概览 | P1 |

### FR-12 文章归档

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-12.1 | 提供 `/archives` 页面，按**年 / 月**分组展示所有已发布文章 | P0 |

### FR-13 About 页面与友链

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-13.1 | `/about` 页面展示博主自我介绍（内容存储在 Page 表中） | P0 |
| FR-13.2 | `/friends` 页面展示友情链接列表 | P1 |
| FR-13.3 | 后台可管理友链（增删改查 + 排序） | P1 |

### FR-14 文章目录 (TOC)

| 编号 | 需求 | 优先级 |
|------|------|--------|
| FR-14.1 | 从 Markdown 标题（h2 ~ h4）自动提取目录 | P1 |
| FR-14.2 | 桌面端在文章右侧固定展示 TOC，移动端隐藏 | P1 |
| FR-14.3 | 滚动页面时高亮当前所在章节 | P1 |

---

## 4. 迭代功能需求（MVP 后）

| 编号 | 功能 | 方案 | 优先级 |
|------|------|------|--------|
| FR-IT.1 | 评论系统 | 集成 **Giscus**（基于 GitHub Discussions） | P2 |
| FR-IT.2 | 所见即所得编辑器 | 替换为 **Milkdown** 或 **ByteMD** | P2 |
| FR-IT.3 | 图片存储升级 | 抽象 Storage 接口，支持切换 MinIO / 阿里云 OSS | P2 |
| FR-IT.4 | 高级搜索 | 中文分词（zhparser）或迁移到 **Meilisearch** | P2 |
| FR-IT.5 | 站点统计 | 集成 **Umami**（自托管，隐私友好） | P3 |
| FR-IT.6 | Newsletter | 邮件订阅功能 | P3 |

---

## 5. 非功能需求

### 5.1 性能

| 编号 | 需求 | 指标 |
|------|------|------|
| NFR-01 | 首屏加载性能 | LCP < 2.5s（桌面端） |
| NFR-02 | 文章页静态生成 | ISR `revalidate: 60`，冷启动后秒开 |
| NFR-03 | 图片懒加载 | 使用 Next.js `<Image>` 组件，自动 lazy loading |
| NFR-04 | 资源压缩 | gzip / brotli 压缩（Nginx/Caddy 配置） |

### 5.2 安全

| 编号 | 需求 | 方案 |
|------|------|------|
| NFR-05 | XSS 防护 | Markdown 渲染使用 `rehype-sanitize` | 
| NFR-06 | CSRF 防护 | NextAuth 内置 CSRF Token |
| NFR-07 | SQL 注入防护 | Prisma 参数化查询（天然防护） |
| NFR-08 | API 限流 | 中间件 Rate Limiting（如 60 req/min） |
| NFR-09 | HTTPS | Let's Encrypt 自动证书 |
| NFR-10 | 密码安全 | bcrypt hash 存储，不明文保存 |
| NFR-11 | 依赖安全 | CI 中执行 `npm audit`，定期更新依赖 |

### 5.3 可用性

| 编号 | 需求 |
|------|------|
| NFR-12 | 语义化 HTML 标签（article / nav / header / footer / main） |
| NFR-13 | 键盘可导航 |
| NFR-14 | 颜色对比度符合 WCAG 2.1 AA |

### 5.4 可维护性

| 编号 | 需求 |
|------|------|
| NFR-15 | TypeScript `strict` 模式 |
| NFR-16 | ESLint + Prettier 统一代码风格 |
| NFR-17 | Git 分支策略：`main`（生产）+ `dev`（开发）+ `feature/*` |
| NFR-18 | 有意义的 commit message（Conventional Commits） |

---

## 6. 约束条件

| 约束 | 说明 |
|------|------|
| 单管理员 | 不支持多用户注册、不支持多角色权限 |
| 本地图片存储 | MVP 不接入云 OSS，图片存 `public/uploads/` |
| PostgreSQL 全文检索 | MVP 不引入 Elasticsearch / Meilisearch |
| VPS 部署 | 不使用 Vercel / Cloudflare Pages（后续可选） |
| 中文搜索有限 | `simple` 分词对中文按字拆分，体验有限 |

---

## 7. 部署与运维需求

### 7.1 部署

| 编号 | 需求 | 方案 |
|------|------|------|
| OPS-01 | Docker 容器化 | Next.js 多阶段构建 + PostgreSQL 容器 |
| OPS-02 | 一键启动 | `docker compose up -d` 启动全部服务 |
| OPS-03 | 域名 + DNS | 自定义域名，A 记录指向 VPS |
| OPS-04 | HTTPS | Let's Encrypt 自动证书（Certbot / acme.sh） |
| OPS-05 | 反向代理 | Nginx / Caddy 反代 + 静态文件直出 + gzip/brotli |
| OPS-06 | CI/CD | GitHub Actions → lint → build → deploy（SSH 到 VPS） |

### 7.2 备份

| 编号 | 需求 | 方案 |
|------|------|------|
| OPS-07 | 数据库每日备份 | Cron + `pg_dump` + gzip，保留 30 天 |
| OPS-08 | 上传文件备份 | `public/uploads/` 目录定期同步到远程存储（或 VPS 快照） |
| OPS-09 | 备份恢复验证 | 至少手动测试一次恢复流程，确保可用 |

### 7.3 监控与日志

| 编号 | 需求 | 方案 |
|------|------|------|
| OPS-10 | 健康检查 | Uptime Kuma 监控 HTTP 端点，宕机告警 |
| OPS-11 | 告警通知 | Telegram / 邮件（至少一种渠道） |
| OPS-12 | 应用日志 | Docker 容器日志 + logrotate 防止磁盘溢出 |
| OPS-13 | 错误追踪 | MVP 使用 `console.error` + Docker logs；迭代可接入 Sentry |

---

## 8. 验收标准总览

| 类别 | 验收项 |
|------|--------|
| 功能完整性 | 所有 P0 功能需求通过手动测试 |
| 性能 | Lighthouse 桌面端 Performance ≥ 90，LCP < 2.5s |
| 安全 | HTTPS 有效、XSS 防护、API 认证、密码 bcrypt 存储 |
| SEO | Sitemap / RSS / Robots / JSON-LD / OG 标签齐全 |
| 部署 | Docker 一键启动、CI/CD 自动部署、备份已配置、监控已上线 |
| 响应式 | 手机 / 平板 / 桌面三端布局正常、暗色模式正常 |

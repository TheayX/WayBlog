# WayBlog 项目启动检查清单

> 生成日期：2026-02-28

---

## ✅ 已完成

### 📚 文档完善
- [x] `requirements.md` — 功能/非功能需求 + 部署运维 + 验收标准
- [x] `api.md` — 12 个 API 模块完整定义 + 限流策略
- [x] `database.md` — 8 张表设计 + Prisma Schema + 全文检索方案
- [x] `design.md` — 架构/技术选型/目录结构/部署方案 + 日志/安全策略
- [x] `tasks.md` — 6 个里程碑，70+ 条任务，每条都有验收标准
- [x] `branding.md` — 5 套站点名称方案对比 + 域名建议
- [x] `.env.example` — 完整环境变量模板 + 注释

---

## 🎯 已确认配置

| 配置项 | 确认值 | 说明 |
|--------|--------|------|
| **站点名** | `Way` | 方案 A：极简风格 |
| **副标题** | `A Journey of Code and Thought` | 代码与思考的旅途 |
| **管理员邮箱** | `way20031208@gmail.com` | 用于登录 + seed 脚本 |
| **管理员名称** | `Way` | 文章作者显示名 |
| **评论系统** | MVP 阶段不集成 | 迭代阶段（M6）可选 Giscus |
| **图片存储** | MVP 本地存储 | 迭代阶段（M6）可升级云存储 |

---

## ⏳ 待后续处理

| 事项 | 时间节点 | 备注 |
|------|----------|------|
| **域名购买** | M5 部署阶段 | 推荐 `.dev` 后缀，如 `imway.dev` / `wayto.dev` |
| **VPS 服务器** | M5 部署阶段 | 最低 1C2G，推荐 2C4G |
| **HTTPS 证书** | M5 部署阶段 | Let's Encrypt 自动签发 |
| **DNS 解析** | M5 部署阶段 | A 记录指向 VPS IP |
| **备案** | 根据实际情况 | 国内服务器需要，国外不需要 |

---

## 🚀 下一步：开始写代码

所有不确定点已明确，文档已完整，现在可以开始执行 `tasks.md` 中的任务。

### 推荐执行顺序

```
M0 项目初始化（1 天）
 ├─ 初始化 Next.js 项目
 ├─ 配置 Prisma + PostgreSQL
 ├─ 搭建目录结构
 └─ 安装核心依赖
       ↓
M1 后端核心（3-4 天）
 ├─ 数据库 Schema + Migration
 ├─ NextAuth 认证
 └─ API 端点实现
       ↓
M2 后台管理（3-4 天）
 ├─ 登录页 + Layout
 ├─ 文章 CRUD 页面
 └─ 分类/标签/友链管理
       ↓
M3 前台展示（4-5 天）
 ├─ 首页 + 文章详情
 ├─ 分类/标签/归档/搜索
 └─ 响应式 + 暗色模式
       ↓
M4 SEO & 运营（2-3 天）
 ├─ RSS / Sitemap / Robots
 ├─ 浏览量统计
 └─ 仪表盘
       ↓
M5 部署上线（2-3 天）
 ├─ Docker 化
 ├─ Nginx + HTTPS
 ├─ CI/CD + 备份 + 监控
 └─ 全站验收测试
       ↓
M6 迭代增强（持续）
 └─ 按需实现：评论/编辑器/云存储/高级搜索
```

---

## 📋 快速开始命令

当你准备好开始写代码时，按以下步骤启动项目：

### 1. 初始化项目（M0-01）
```bash
pnpm create next-app@latest wayblog --typescript --tailwind --app --use-pnpm
cd wayblog
```

### 2. 安装核心依赖（M0-08）
```bash
pnpm add @prisma/client next-auth@beta bcryptjs zod react-markdown rehype-highlight rehype-sanitize remark-gfm next-themes
pnpm add -D prisma @types/bcryptjs
```

### 3. 初始化 Prisma（M0-04）
```bash
pnpm dlx prisma init
```

### 4. 启动数据库（M0-05）
```bash
docker compose up -d postgres
```

### 5. 复制环境变量
```bash
cp .env.example .env
# 然后编辑 .env 填入真实值
```

### 6. 运行开发服务器（验收 M0-01）
```bash
pnpm dev
```

访问 `http://localhost:3000` 应该能看到页面。

---

## 🎨 品牌资源建议

如果需要设计 Logo，这里有一些思路：

### 配色方案（适合 Way）
```
主色调：深蓝 #1e40af（技术感）
辅助色：青色 #06b6d4（活力）
暗色模式主色：#3b82f6（亮蓝）
```

### Logo 创意
1. **路径符号**：`/` 或 `→` 结合 "Way" 字样
2. **极简字标**：纯文字 "WAY"，选用 Monospace 字体
3. **抽象图形**：分叉路口的简笔画

### 字体推荐
- **英文标题**：Inter / Poppins / Montserrat
- **英文正文**：Inter / System Font Stack
- **中文**：思源黑体 / 苹方 / 微软雅黑

（这些可以在 `layout.tsx` 中配置 Next.js 字体优化）

---

## 📞 后续沟通要点

如果开发过程中遇到以下情况，可以随时讨论：

- [ ] 某个功能需求不明确，需要补充细节
- [ ] 技术方案遇到障碍，需要调整设计
- [ ] 发现文档有遗漏或错误，需要更新
- [ ] MVP 范围需要调整（增加/删减功能）
- [ ] 想修改站点名称、副标题、配色等品牌元素

---

## ✨ 项目愿景

**目标**：打造一个简洁、高性能、SEO 友好的个人技术博客，记录代码与思考的旅程。

**核心价值观**：
- **简洁**：极简设计，专注内容
- **快速**：ISR 静态生成，秒开体验
- **开放**：RSS 订阅，开源友好
- **自由**：自托管，数据自主

---

**准备好了就说"开始写代码"，我会立即启动 M0 项目初始化！🚀**


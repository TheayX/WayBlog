# WayBlog 整理清单

## 已完成

- 公开前台页面可访问
- 后台管理页可访问
- 文章、分类、标签、友链 API 已实现
- 登录鉴权与后台路由保护已实现
- Markdown 渲染、TOC、上一篇/下一篇已实现
- 搜索、RSS、sitemap、robots 已实现
- 浏览量统计与后台统计已实现
- `pnpm lint` 可通过
- `pnpm build` 可通过

## 近期已做的整理

- 修复构建阶段对数据库的硬依赖
- 将 `middleware` 迁移为 `proxy`
- 统一部分 API 响应结构
- 修复查询参数布尔解析问题
- 清理前台主要页面中的乱码文案
- 删除无用的 `check.txt`
- 公开页、RSS、sitemap 的数据库读取已收敛到 `src/lib/*/queries.ts`
- 后台 API 已基本改为薄路由，业务逻辑下沉到 `src/lib/*/service.ts`
- 后台 CRUD 页面复用列表拉取、保存、删除客户端辅助
- 文章编辑表单已拆分字段状态、元数据加载、AI 辅助逻辑和 UI 区块
- 搜索、统计、浏览量接口已拆出 service 层
- 新增 GitHub Actions CI，自动执行 `pnpm lint`、`pnpm test`、`pnpm exec tsc --noEmit` 和 `pnpm build`
- 清理 `src/types` 中重构后不再引用的历史类型导出
- 将 Prisma Client 生成目录从 `src/generated/prisma` 迁移到仓库根部 `generated/prisma`
- 将 AI 提示词收敛为基础可用版，后续按真实失败案例渐进补充规则
- 在 Next 配置中补充基础安全响应头，暂不启用需要逐页验证的严格 CSP
- 完成核心服务、后台辅助和 AI 辅助模块的注释风格检查

## 仍建议继续整理

### 高优先级

- 清理后台页面和注释中的历史乱码
- 补齐搜索所依赖的数据库迁移说明
- 统一页面与接口中的中英文文案风格
- 为关键 API 增加最基本的自动化测试
- 后续根据部署环境补充 CI 中的数据库集成测试

### 中优先级

- 为 README 增加截图或演示说明

### 低优先级

- 优化种子脚本中的示例内容与编码
- 细化部署文档

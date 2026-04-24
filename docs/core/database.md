# WayBlog 数据库设计

## 数据源

- 数据库：PostgreSQL
- ORM：Prisma
- Schema 文件：[prisma/schema.prisma](/E:/myProgram/WayBlog/prisma/schema.prisma)

## 实体关系

```text
User 1 -> N Post
Category 1 -> N Post
Post N <-> N Tag
Post 1 -> N PageView
FriendLink 独立
Page 独立
```

## 主要模型

### User

管理员账户。

字段：

- `id`
- `email`
- `passwordHash`
- `name`
- `avatar`
- `createdAt`
- `updatedAt`

### Post

文章主体。

字段：

- `id`
- `title`
- `slug`
- `content`
- `excerpt`
- `coverImage`
- `status`
- `pinned`
- `publishedAt`
- `viewCount`
- `authorId`
- `categoryId`
- `createdAt`
- `updatedAt`

索引：

- `@@index([status, publishedAt])`
- `@@index([pinned, publishedAt])`
- `@@index([categoryId])`
- `@@index([authorId])`

### Category

文章分类。

字段：

- `id`
- `name`
- `slug`
- `description`
- `createdAt`

### Tag

文章标签。

字段：

- `id`
- `name`
- `slug`
- `createdAt`

### PageView

文章每日 PV / UV 聚合表。

字段：

- `id`
- `postId`
- `date`
- `pvCount`
- `uvCount`
- `createdAt`
- `updatedAt`

约束：

- `@@unique([postId, date])`
- `@@index([postId])`

### FriendLink

友链数据。

字段：

- `id`
- `name`
- `url`
- `avatar`
- `description`
- `sortOrder`
- `createdAt`

### Page

用于存储单页内容，目前主要用于 About 页。

字段：

- `id`
- `slug`
- `title`
- `content`
- `createdAt`
- `updatedAt`

## 删除策略

- 删除文章时，关联 `PageView` 级联删除
- 删除分类时，文章的 `categoryId` 置空
- 标签和文章通过隐式多对多关系解绑

## 当前实现说明

- Prisma Client 输出目录是仓库根部 `generated/prisma`
- 运行前需要先执行 `prisma generate`
- 种子脚本文件是 `prisma/seed.mts`

## Redis 运行时状态

Redis 不承载主业务数据，只保存运行期状态：

- 登录、搜索和浏览量接口的限流计数
- 文章浏览量 UV 的按天去重集合

本地 `docker-compose.yml` 默认提供 `wayblog-redis` 服务，并映射到宿主机 `6381`，避免和其他项目 Redis 冲突。应用通过 `REDIS_URL` 连接 Redis，并通过 `REDIS_KEY_PREFIX` 隔离 key 空间。

## 搜索相关说明

当前搜索接口使用应用层关键词匹配，不再依赖 PostgreSQL 专有搜索字段或触发器。

搜索边界包括：

- 仅搜索已发布文章
- 匹配范围覆盖标题、正文、分类名和标签名
- 搜索摘要由服务层按命中位置生成结构化高亮片段

如果后续重新引入新的数据库搜索索引或独立搜索引擎，应同步补充新的索引、同步机制和迁移说明。

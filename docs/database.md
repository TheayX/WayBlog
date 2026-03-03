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

- Prisma Client 输出目录是 `src/generated/prisma`
- 运行前需要先执行 `prisma generate`
- 种子脚本文件是 `prisma/seed.mts`

## 搜索相关说明

当前搜索接口使用 PostgreSQL 全文搜索，但 `schema.prisma` 中没有显式声明 `tsvector` 字段。

这意味着：

- 搜索能力依赖数据库中已有的额外搜索字段或 SQL 迁移
- 如果后续要正式维护这部分能力，建议补充专门的 SQL migration 文档和迁移文件说明

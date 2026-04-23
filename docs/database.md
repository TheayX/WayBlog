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

## 搜索相关说明

当前搜索接口使用 PostgreSQL 全文搜索，相关数据库能力在 `prisma/migrations/0_init/migration.sql` 中通过 SQL 显式维护。

搜索依赖包括：

- `Post.search_vector`：`tsvector` 类型字段，用于保存文章标题和正文的搜索向量
- `Post_search_vector_idx`：基于 `search_vector` 的 GIN 索引
- `post_search_vector_update()`：在文章标题或正文变更时更新搜索向量的触发器函数
- `post_search_vector_trigger`：挂载在 `Post` 表上的触发器
- 初始化迁移末尾会对已有文章执行一次 `search_vector` 回填

注意：`search_vector` 没有写入 `schema.prisma`，因为 Prisma schema 当前不直接表达这类 PostgreSQL 专有字段和触发器逻辑。后续如果调整搜索字段、权重或分词策略，应通过新的 SQL migration 显式维护，并同步更新本文档。

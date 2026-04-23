# WayBlog API 文档

## 通用约定

Base URL：

- 开发环境：`http://localhost:3610/api`

响应格式：

```json
{
  "data": {}
}
```

分页接口：

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

错误格式：

```json
{
  "error": "message"
}
```

部分校验错误会附带：

```json
{
  "error": "Validation failed",
  "details": {}
}
```

## 鉴权

- 登录由 NextAuth 处理
- 后台写操作接口需要登录
- 未登录时返回 `401`

## 文章接口

### `GET /api/posts`

查询参数：

- `page`
- `pageSize`
- `categoryId`
- `tagId`
- `pinned`

说明：

- 公开读取入口
- 始终只返回已发布文章
- 不接受 `status` 查询参数

### `POST /api/posts`

需要登录。

请求体字段：

- `title`
- `slug`
- `content`
- `excerpt`
- `coverImage`
- `status`
- `pinned`
- `categoryId`
- `tagIds`

### `GET /api/posts/[id]`

需要登录。

获取单篇文章编辑详情，主要供后台编辑页使用。该接口只返回编辑表单回填所需字段，不作为公开文章详情接口。

### `PUT /api/posts/[id]`

需要登录。

支持部分更新。

### `DELETE /api/posts/[id]`

需要登录。

成功时返回 `204`。

### `GET /api/admin/posts`

需要登录。

查询参数：

- `page`
- `pageSize`
- `status`
- `categoryId`
- `tagId`
- `pinned`

说明：

- 后台文章列表读取入口
- 可按状态筛选草稿或已发布文章

### `POST /api/posts/[id]/views`

公开接口。

作用：

- 记录文章浏览量
- 更新 `PageView`
- 更新 `Post.viewCount`

限流：

- 每个 IP 对同一篇文章每秒最多 1 次

## 分类接口

### `GET /api/categories`

返回分类列表及每个分类下的已发布文章数量。

### `POST /api/categories`

需要登录。

### `PUT /api/categories/[id]`

需要登录。

### `DELETE /api/categories/[id]`

需要登录。

成功时返回 `204`。

## 标签接口

### `GET /api/tags`

返回标签列表及每个标签下的已发布文章数量。

### `POST /api/tags`

需要登录。

### `PUT /api/tags/[id]`

需要登录。

### `DELETE /api/tags/[id]`

需要登录。

成功时返回 `204`。

## 友链接口

### `GET /api/friend-links`

返回按 `sortOrder` 排序的友链列表。

### `POST /api/friend-links`

需要登录。

### `PUT /api/friend-links/[id]`

需要登录。

### `DELETE /api/friend-links/[id]`

需要登录。

成功时返回 `204`。

## 搜索接口

### `GET /api/search`

查询参数：

- `q`
- `page`
- `pageSize`

说明：

- 仅搜索已发布文章
- 返回高亮摘要 `highlight`
- 带有分页信息

限流：

- 每个 IP 每分钟最多 30 次

## 统计接口

### `GET /api/stats`

需要登录。

返回内容包括：

- 文章总数
- 已发布数
- 草稿数
- 分类数
- 标签数
- 总浏览量
- 近 30 天 PV / UV
- 浏览量最高的文章

## 上传接口

### `POST /api/upload`

需要登录。

请求方式：

- `multipart/form-data`

字段：

- `file`

限制：

- 默认最大 5MB
- 仅允许 `image/jpeg`、`image/png`、`image/gif`、`image/webp`

返回：

- `url`
- `filename`
- `size`

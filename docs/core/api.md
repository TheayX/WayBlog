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
- 后台管理接口统一使用 `/api/admin/*`
- 后台写操作接口需要登录
- 未登录时返回 `401`

## 后台账号接口

### `GET /api/admin/account`

需要登录。

说明：

- 返回当前管理员的账号资料
- 用于后台设置页初始化展示

### `PUT /api/admin/account`

需要登录。

说明：

- 更新当前管理员的显示名称、邮箱等资料
- 当前项目采用单管理员模型，因此不提供多账号管理能力

### `PATCH /api/admin/account`

需要登录。

说明：

- 修改当前管理员密码
- 成功后仅返回结果，不负责扩展权限或角色变更能力

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

### `POST /api/admin/posts`

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

### `PUT /api/admin/posts/[id]`

需要登录。

支持部分更新。

### `DELETE /api/admin/posts/[id]`

需要登录。

成功时返回 `204`。

### `POST /api/posts/[id]/views`

公开接口。

作用：

- 记录文章浏览量
- 更新 `PageView`
- 更新 `Post.viewCount`

限流：

- 每个 IP 对同一篇文章每秒最多 1 次

## 分类接口

### `GET /api/admin/categories`

返回分类列表及每个分类下的已发布文章数量。

需要登录。

### `POST /api/admin/categories`

需要登录。

### `PUT /api/admin/categories/[id]`

需要登录。

### `DELETE /api/admin/categories/[id]`

需要登录。

成功时返回 `204`。

## 标签接口

### `GET /api/admin/tags`

返回标签列表及每个标签下的已发布文章数量。

需要登录。

### `POST /api/admin/tags`

需要登录。

### `PUT /api/admin/tags/[id]`

需要登录。

### `DELETE /api/admin/tags/[id]`

需要登录。

成功时返回 `204`。

## 友链接口

### `GET /api/admin/friend-links`

返回按 `sortOrder` 排序的友链列表。

需要登录。

### `POST /api/admin/friend-links`

需要登录。

### `PUT /api/admin/friend-links/[id]`

需要登录。

### `DELETE /api/admin/friend-links/[id]`

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
- 匹配标题、正文、分类和标签
- 返回结构化高亮摘要 `highlightSegments`
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

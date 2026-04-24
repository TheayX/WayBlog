import { z } from 'zod';

/**
 * 站内 slug 的统一格式约束。
 * 仅允许小写字母、数字和单个连字符分段，避免生成不稳定的公开路径。
 */
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * 将查询字符串中的布尔值标准化为真正的 boolean。
 * 主要用于路由处理器读取 search params 时兼容 `"true"` / `"false"` 文本。
 */
const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}, z.boolean());

/**
 * AI 优化接口里供模型参考的分类/标签选项结构。
 * 这里只保留最小可读字段，避免把无关数据暴露给提示词构造逻辑。
 */
const aiOptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
});

/**
 * 通用分页参数。
 * 供公开页列表、管理后台表格与搜索接口共享，统一限制页码和单页大小。
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

/**
 * 文章创建接口的输入约束。
 * 这里校验的是服务端真正接受的载荷，而不是表单交互过程中的临时状态。
 */
export const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  slug: z.string().min(1).max(255).regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  content: z.string().default(''),
  excerpt: z.string().max(500).nullable().optional(),
  coverImage: z.string().max(500).nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  pinned: z.boolean().default(false),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
});

/**
 * 文章更新接口约束。
 * 更新场景允许只提交发生变化的字段，因此直接复用创建 schema 的 partial 版本。
 */
export const updatePostSchema = createPostSchema.partial();

/**
 * 公开文章列表查询参数。
 * 公开入口不接受 status，服务端始终只返回已发布文章，避免调用方通过参数影响可见性边界。
 */
export const publicPostQuerySchema = paginationSchema
  .extend({
    categoryId: z.string().uuid().optional(),
    tagId: z.string().uuid().optional(),
    pinned: booleanQuerySchema.optional(),
  })
  .strict();

/**
 * 后台文章列表查询参数。
 * 该 schema 只用于已鉴权的管理端列表接口，因此允许按文章状态筛选。
 */
export const adminPostQuerySchema = publicPostQuerySchema
  .extend({
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  })
  .strict();

/** 后台分类创建接口约束。 */
export const createCategorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z.string().min(1).max(100).regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  description: z.string().max(500).nullable().optional(),
});

/** 分类更新允许按字段局部提交。 */
export const updateCategorySchema = createCategorySchema.partial();

/** 后台标签创建接口约束。 */
export const createTagSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z.string().min(1).max(100).regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
});

/** 标签更新允许局部字段变更。 */
export const updateTagSchema = createTagSchema.partial();

/** 后台友链创建接口约束。 */
export const createFriendLinkSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  url: z.string().url('请输入合法 URL'),
  avatar: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

/** 友链更新允许只提交调整过的字段。 */
export const updateFriendLinkSchema = createFriendLinkSchema.partial();

/** 后台单页创建接口约束。 */
export const createPageSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug 不能为空')
    .max(100)
    .regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  title: z.string().min(1, '标题不能为空').max(100),
  content: z.string().max(50000).default(''),
});

/** 单页更新允许局部字段变更。 */
export const updatePageSchema = createPageSchema.partial();

/** 管理员账号资料更新接口约束。 */
export const updateAccountProfileSchema = z.object({
  email: z.string().email('请输入合法邮箱').max(255),
  name: z.string().min(1, '昵称不能为空').max(100),
  avatar: z.string().url('请输入合法头像 URL').nullable().optional(),
});

/**
 * 管理员密码更新接口约束。
 * 新密码要求至少 8 位，避免把本地演示阶段的弱口令习惯带到后续部署中。
 */
export const updateAccountPasswordSchema = z.object({
  currentPassword: z.string().min(1, '请输入当前密码'),
  newPassword: z.string().min(8, '新密码至少 8 位').max(128),
});

/** 搜索接口查询参数。 */
export const searchSchema = paginationSchema.extend({
  q: z.string().min(1, '搜索关键词不能为空').max(100),
});

/**
 * AI 全文优化接口输入。
 * 包含正文、摘要、分类、标签及供提示词参考的候选项列表。
 */
export const aiOptimizeSchema = z.object({
  title: z.string().max(255).default(''),
  slug: z.string().max(255).default(''),
  content: z.string().min(1, '请先输入正文内容').max(30000),
  excerpt: z.string().max(500).default(''),
  categoryId: z.string().nullable().optional(),
  tagIds: z.array(z.string()).max(20).default([]),
  categories: z.array(aiOptionSchema).max(100).default([]),
  tags: z.array(aiOptionSchema).max(200).default([]),
});

/**
 * AI 单字段优化接口输入。
 * 在全文优化载荷基础上追加目标字段名，供路由处理器决定生成哪类提示词。
 */
export const aiFieldSchema = aiOptimizeSchema.extend({
  field: z.enum(['title', 'slug', 'content', 'excerpt', 'category', 'tags']),
});

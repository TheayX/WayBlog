import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const booleanQuerySchema = z.preprocess((value) => {
  if (value === undefined || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}, z.boolean());

const aiOptionSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(100),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

export const createPostSchema = z.object({
  title: z.string().min(1, '标题不能为空').max(255),
  slug: z
    .string()
    .min(1)
    .max(255)
    .regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  content: z.string().default(''),
  excerpt: z.string().max(500).nullable().optional(),
  coverImage: z.string().max(500).nullable().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
  pinned: z.boolean().default(false),
  categoryId: z.string().uuid().nullable().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updatePostSchema = createPostSchema.partial();

export const postQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  pinned: booleanQuerySchema.optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  description: z.string().max(500).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createTagSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
});

export const updateTagSchema = createTagSchema.partial();

export const createFriendLinkSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  url: z.string().url('请输入合法 URL'),
  avatar: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateFriendLinkSchema = createFriendLinkSchema.partial();

export const searchSchema = paginationSchema.extend({
  q: z.string().min(1, '搜索关键词不能为空').max(100),
});

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

export const aiFieldSchema = aiOptimizeSchema.extend({
  field: z.enum(['title', 'slug', 'content', 'excerpt', 'category', 'tags']),
});

import { z } from 'zod';

// ─── 通用 ───

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── 文章 ───

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

export const updatePostSchema = createPostSchema.partial();

export const postQuerySchema = paginationSchema.extend({
  status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
  categoryId: z.string().uuid().optional(),
  tagId: z.string().uuid().optional(),
  pinned: z.coerce.boolean().optional(),
});

// ─── 分类 ───

export const createCategorySchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z.string().min(1).max(100).regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
  description: z.string().max(500).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ─── 标签 ───

export const createTagSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  slug: z.string().min(1).max(100).regex(slugRegex, 'Slug 只能包含小写字母、数字和连字符'),
});

export const updateTagSchema = createTagSchema.partial();

// ─── 友链 ───

export const createFriendLinkSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100),
  url: z.string().url('请输入合法 URL'),
  avatar: z.string().url().nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  sortOrder: z.number().int().default(0),
});

export const updateFriendLinkSchema = createFriendLinkSchema.partial();

// ─── 搜索 ───

export const searchSchema = paginationSchema.extend({
  q: z.string().min(1, '搜索关键词不能为空').max(100),
});


import { PostStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type {
  createCategorySchema,
  createTagSchema,
  updateCategorySchema,
  updateTagSchema,
} from '@/lib/validations';
import type { z } from 'zod';

type CreateCategoryInput = z.infer<typeof createCategorySchema>;
type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
type CreateTagInput = z.infer<typeof createTagSchema>;
type UpdateTagInput = z.infer<typeof updateTagSchema>;

/**
 * 获取分类列表及已发布文章计数。
 *
 * postCount 只统计已发布文章，保证后台列表与公开页可见内容口径一致。
 */
export async function getCategoriesWithPublishedPostCount() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { status: PostStatus.PUBLISHED } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    postCount: category._count.posts,
    createdAt: category.createdAt,
  }));
}

/** 获取标签列表及已发布文章计数。 */
export async function getTagsWithPublishedPostCount() {
  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { status: PostStatus.PUBLISHED } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return tags.map((tag) => ({
    id: tag.id,
    name: tag.name,
    slug: tag.slug,
    postCount: tag._count.posts,
    createdAt: tag.createdAt,
  }));
}

/** 检查分类名称或 slug 是否冲突。 */
export async function categoryNameOrSlugExists(input: { name?: string; slug?: string }, excludeId?: string) {
  const conditions = [
    ...(input.name ? [{ name: input.name }] : []),
    ...(input.slug ? [{ slug: input.slug }] : []),
  ];

  if (conditions.length === 0) return false;

  const existing = await prisma.category.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: conditions,
    },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 检查标签名称或 slug 是否冲突。 */
export async function tagNameOrSlugExists(input: { name?: string; slug?: string }, excludeId?: string) {
  const conditions = [
    ...(input.name ? [{ name: input.name }] : []),
    ...(input.slug ? [{ slug: input.slug }] : []),
  ];

  if (conditions.length === 0) return false;

  const existing = await prisma.tag.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: conditions,
    },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 创建分类。 */
export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({ data: input });
}

/** 更新分类。 */
export async function updateCategory(id: string, input: UpdateCategoryInput) {
  return prisma.category.update({
    where: { id },
    data: input,
  });
}

/** 判断分类是否存在。 */
export async function categoryExists(id: string) {
  const existing = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 删除分类。 */
export async function deleteCategory(id: string) {
  return prisma.category.delete({ where: { id } });
}

/** 创建标签。 */
export async function createTag(input: CreateTagInput) {
  return prisma.tag.create({ data: input });
}

/** 更新标签。 */
export async function updateTag(id: string, input: UpdateTagInput) {
  return prisma.tag.update({
    where: { id },
    data: input,
  });
}

/** 判断标签是否存在。 */
export async function tagExists(id: string) {
  const existing = await prisma.tag.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 删除标签。 */
export async function deleteTag(id: string) {
  return prisma.tag.delete({ where: { id } });
}

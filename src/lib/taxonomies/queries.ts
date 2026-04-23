import { PostStatus } from '@generated/prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * 获取公开分类页使用的分类基础信息。
 *
 * 这里只读取公开展示与 SEO 所需字段，文章列表另由 posts 查询层负责，
 * 避免分类实体查询和文章分页查询在页面中混杂。
 */
export async function getPublicCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, description: true },
  });
}

/**
 * 获取公开标签页使用的标签基础信息。
 *
 * 标签详情页和元数据入口共用这份查询，保证页面标题、描述和文章列表使用同一个标签边界。
 */
export async function getPublicTagBySlug(slug: string) {
  return prisma.tag.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
}

/**
 * 获取公开标签总览页所需的标签列表。
 *
 * 计数只统计已发布文章，避免公开页标签数量与读者实际可访问内容不一致。
 */
export async function getPublicTagsWithPostCount() {
  return prisma.tag.findMany({
    include: {
      _count: {
        select: {
          posts: { where: { status: PostStatus.PUBLISHED } },
        },
      },
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * 获取 sitemap 使用的公开分类 slug 列表。
 */
export async function getPublicCategorySlugs() {
  return prisma.category.findMany({
    select: { slug: true },
  });
}

/**
 * 获取 sitemap 使用的公开标签 slug 列表。
 */
export async function getPublicTagSlugs() {
  return prisma.tag.findMany({
    select: { slug: true },
  });
}

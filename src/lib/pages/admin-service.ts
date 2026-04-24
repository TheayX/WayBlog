import { prisma } from '@/lib/prisma';
import type { createPageSchema, updatePageSchema } from '@/lib/validations';
import type { z } from 'zod';

type CreatePageInput = z.infer<typeof createPageSchema>;
type UpdatePageInput = z.infer<typeof updatePageSchema>;

export interface AdminPageEditorData {
  id: string;
  slug: string;
  title: string;
  content: string;
}

/**
 * 获取后台单页列表。
 *
 * 当前项目的单页内容规模很小，直接返回标题、slug 与更新时间即可满足后台管理，
 * 不需要像文章列表那样引入分页和额外聚合信息。
 */
export async function getAdminPages() {
  return prisma.page.findMany({
    select: {
      id: true,
      slug: true,
      title: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * 获取后台单页编辑数据。
 *
 * 这里只返回编辑表单真正需要的字段，避免把创建时间等无关信息带进表单状态。
 */
export async function getAdminPageEditorData(id: string): Promise<AdminPageEditorData | null> {
  return prisma.page.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      title: true,
      content: true,
    },
  });
}

/** 检查单页 slug 是否冲突。 */
export async function pageSlugExists(slug: string, excludeId?: string) {
  const existing = await prisma.page.findFirst({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 判断单页是否存在。 */
export async function pageExists(id: string) {
  const existing = await prisma.page.findUnique({
    where: { id },
    select: { id: true },
  });

  return Boolean(existing);
}

/** 创建单页。 */
export async function createPage(input: CreatePageInput) {
  return prisma.page.create({ data: input });
}

/** 更新单页。 */
export async function updatePage(id: string, input: UpdatePageInput) {
  return prisma.page.update({
    where: { id },
    data: input,
  });
}

/** 删除单页。 */
export async function deletePage(id: string) {
  return prisma.page.delete({ where: { id } });
}

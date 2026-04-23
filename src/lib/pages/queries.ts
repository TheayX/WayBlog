import { prisma } from '@/lib/prisma';

/**
 * 获取公开单页内容。
 *
 * 当前仅关于页使用，但后续如果增加更多公开单页，也可以沿用同一入口，
 * 避免页面组件直接持有 Page 表查询。
 */
export async function getPublicPageBySlug(slug: string) {
  return prisma.page.findUnique({
    where: { slug },
  });
}

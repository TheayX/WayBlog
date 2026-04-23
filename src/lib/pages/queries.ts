import { unstable_cache } from 'next/cache';
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from '@/lib/cache';
import { prisma } from '@/lib/prisma';

/**
 * 获取公开单页内容。
 *
 * 当前仅关于页使用，但后续如果增加更多公开单页，也可以沿用同一入口，
 * 避免页面组件直接持有 Page 表查询。
 */
export const getPublicPageBySlug = unstable_cache(
  async (slug: string) => {
    return prisma.page.findUnique({
      where: { slug },
    });
  },
  ['public-page-by-slug'],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ['public-pages'] },
);

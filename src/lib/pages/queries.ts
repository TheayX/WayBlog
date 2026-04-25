import { unstable_cache } from 'next/cache';
import { PUBLIC_CONTENT_REVALIDATE_SECONDS } from '@/lib/cache';
import { prisma } from '@/lib/prisma';
import type { PublicNavigationPage } from '@/lib/pages/shared';

/**
 * 获取公开单页内容。
 *
 * 单页已经统一进入前台“页面”菜单与公开路由，
 * 查询层直接按 slug 暴露内容，避免页面组件自己接触数据库细节。
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

/**
 * 获取前台导航中的单页列表。
 *
 * 所有单页都会自动进入“页面”下拉，因此这里直接返回最小导航字段，
 * 并按后台维护的排序值升序排列，保证前后台认知一致。
 */
export const getPublicNavigationPages = unstable_cache(
  async (): Promise<PublicNavigationPage[]> => {
    return prisma.page.findMany({
      select: {
        slug: true,
        title: true,
        sortOrder: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  },
  ['public-navigation-pages'],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ['public-pages'] },
);

/** sitemap 只需要公开单页的路径与更新时间。 */
export const getPublicSitemapPages = unstable_cache(
  async () => {
    return prisma.page.findMany({
      select: {
        slug: true,
        updatedAt: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  },
  ['public-sitemap-pages'],
  { revalidate: PUBLIC_CONTENT_REVALIDATE_SECONDS, tags: ['public-pages'] },
);
